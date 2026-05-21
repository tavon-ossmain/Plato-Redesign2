import { createHash } from "node:crypto";
import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  scraperJobsTable,
  sourceConfigsTable,
  signalsTable,
  type SourceConfig,
} from "@workspace/db/schema";
import { logger } from "../lib/logger.js";
import { enrichSignals } from "../lib/enrichment.js";
import { deliverSignalsToSlack } from "../lib/signalDelivery.js";
import { getAdapter } from "./registry.js";
import type { ScraperInput, RawSignal } from "./types.js";

const MAX_CONCURRENT =
  Number(process.env["JOB_RUNNER_CONCURRENCY"] ?? 3);
const TICK_MS =
  Number(process.env["JOB_RUNNER_INTERVAL_MS"] ?? 60_000);

function signalId(workspaceId: string, sourceUrl: string, snippet: string): string {
  return "sig-" + createHash("sha256")
    .update(`${workspaceId}:${sourceUrl}:${snippet}`)
    .digest("hex")
    .slice(0, 16);
}

function nextRunAt(frequency: string): Date {
  const now = Date.now();
  switch (frequency) {
    case "hourly": return new Date(now + 3_600_000);
    case "weekly": return new Date(now + 604_800_000);
    default:       return new Date(now + 86_400_000);
  }
}

function resolveDisposition(
  fit: number,
  confidence: number,
  threshold: number,
): string {
  const threshPct = threshold * 100;
  if (fit >= 70 && confidence >= threshPct) return "billable";
  if (fit >= 50) return "watchlist";
  return "suppressed";
}

function recommendedChannel(sourcePlatform: string): string {
  if (sourcePlatform === "remoteok" || sourcePlatform === "hn_hiring") return "email";
  if (sourcePlatform === "reddit") return "linkedin";
  return "email";
}

async function writeSignals(
  signals: RawSignal[],
  config: SourceConfig,
): Promise<Array<typeof signalsTable.$inferSelect>> {
  if (signals.length === 0) return [];

  const rows = signals.map((s) => ({
    id:                 signalId(config.workspaceId, s.sourceUrl, s.evidenceSnippet),
    workspaceId:        config.workspaceId,
    company:            s.company || "Unknown",
    contactName:        s.contactName || "Unknown",
    contactTitle:       s.contactTitle || "",
    contactLinkedin:    s.contactLinkedin || "",
    contactEmail:       s.contactEmail || "",
    contactPhone:       s.contactPhone || "",
    companyDomain:      s.companyDomain || "",
    source:             s.source,
    sourcePlatform:     s.sourcePlatform,
    sourceUrl:          s.sourceUrl,
    evidenceSnippet:    s.evidenceSnippet,
    whyNow:             s.whyNow,
    fitScore:           s.fitScore,
    confidenceScore:    s.confidenceScore,
    freshnessScore:     s.freshnessScore,
    seenAt:             s.seenAt,
    lastVerifiedAt:     new Date().toISOString(),
    disposition:        resolveDisposition(s.fitScore, s.confidenceScore, config.confidenceThreshold),
    recommendedChannel: recommendedChannel(s.sourcePlatform),
    owner:              "Unassigned",
    route:              "unrouted",
    crmStatus:          "clean",
    dedupeStatus:       "unique",
    modelPath:          "",
    enrichmentSource:   s.enrichmentSource || "none",
    enrichmentStatus:   s.enrichmentStatus || "not_enriched",
    rawSource:          s.rawSource,
  }));

  const inserted = await db
    .insert(signalsTable)
    .values(rows)
    .onConflictDoNothing()
    .returning();

  return inserted;
}

async function processJob(jobId: number, config: SourceConfig): Promise<void> {
  const adapter = getAdapter(config.sourceType);
  if (!adapter) {
    await db
      .update(scraperJobsTable)
      .set({
        status:       "failed",
        errorMessage: `No adapter registered for sourceType "${config.sourceType}"`,
        updatedAt:    new Date(),
      })
      .where(eq(scraperJobsTable.id, jobId));
    return;
  }

  // Mark as running
  await db
    .update(scraperJobsTable)
    .set({
      status:    "running",
      attempts:  sql`${scraperJobsTable.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(scraperJobsTable.id, jobId));

  const input: ScraperInput = {
    workspaceId:         config.workspaceId,
    sourceConfigId:      config.id,
    sourceType:          config.sourceType,
    keywords:            (config.keywords as string[]) ?? [],
    disqualifiers:       (config.disqualifiers as string[]) ?? [],
    targetTitles:        (config.targetTitles as string[]) ?? [],
    targetIndustries:    (config.targetIndustries as string[]) ?? [],
    seedUrls:            (config.seedUrls as string[]) ?? [],
    companySizeRange:    config.companySizeRange ?? null,
    confidenceThreshold: config.confidenceThreshold,
    dailyLimit:          config.dailyLimit,
  };

  try {
    const results = await adapter.run(input);
    const enrichedResults = await enrichSignals(results);
    const writtenSignals = await writeSignals(enrichedResults, config);
    await deliverSignalsToSlack(config.workspaceId, writtenSignals);

    await db
      .update(scraperJobsTable)
      .set({
        status:      "completed",
        lastRunAt:   new Date(),
        nextRunAt:   nextRunAt(config.runFrequency),
        runLog:      `${new Date().toISOString()} — fetched ${results.length} candidates, enriched ${enrichedResults.length}, wrote ${writtenSignals.length} new signals.`,
        errorMessage: null,
        updatedAt:   new Date(),
      })
      .where(eq(scraperJobsTable.id, jobId));

    logger.info({ jobId, workspaceId: config.workspaceId, written: writtenSignals.length }, "Scraper job completed");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(scraperJobsTable)
      .set({
        status:       "failed",
        errorMessage: msg,
        lastRunAt:    new Date(),
        updatedAt:    new Date(),
      })
      .where(eq(scraperJobsTable.id, jobId));

    logger.error({ jobId, workspaceId: config.workspaceId, err }, "Scraper job failed");
  }
}

async function tick(): Promise<void> {
  try {
    // Re-queue completed jobs that are due again
    await db
      .update(scraperJobsTable)
      .set({ status: "queued", updatedAt: new Date() })
      .where(
        and(
          eq(scraperJobsTable.status, "completed"),
          lte(scraperJobsTable.nextRunAt, new Date()),
        ),
      );

    // Pick up queued jobs whose source config is active
    const due = await db
      .select({ jobId: scraperJobsTable.id, config: sourceConfigsTable })
      .from(scraperJobsTable)
      .innerJoin(
        sourceConfigsTable,
        eq(scraperJobsTable.sourceConfigId, sourceConfigsTable.id),
      )
      .where(
        and(
          eq(scraperJobsTable.status, "queued"),
          eq(sourceConfigsTable.status, "active"),
        ),
      )
      .limit(MAX_CONCURRENT);

    if (due.length > 0) {
      logger.info({ count: due.length }, "Runner: processing queued jobs");
    }

    await Promise.allSettled(due.map(({ jobId, config }) => processJob(jobId, config)));
  } catch (err) {
    logger.error({ err }, "Runner tick error");
  }
}

let handle: ReturnType<typeof setInterval> | null = null;

export function startJobRunner(): void {
  if (handle) return;
  logger.info({ intervalMs: TICK_MS, maxConcurrent: MAX_CONCURRENT }, "Job runner started");
  handle = setInterval(() => { void tick(); }, TICK_MS);
  // Run immediately on first start to pick up anything queued at boot
  void tick();
}

export function stopJobRunner(): void {
  if (handle) {
    clearInterval(handle);
    handle = null;
    logger.info("Job runner stopped");
  }
}
