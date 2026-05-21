import { Router } from "express";
import type { Request } from "express";
import { createHash } from "node:crypto";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, workspacesTable, workspaceSourcesTable, sourceConfigsTable, scraperJobsTable } from "@workspace/db";
import { parseIcp } from "../lib/parseIcp";
import { sendBriefConfirmation } from "../lib/email";

const router = Router();

type RateBucket = { count: number; resetAt: number };

const ipBuckets = new Map<string, RateBucket>();
const emailBuckets = new Map<string, RateBucket>();

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  linkedin:   "LinkedIn",
  reddit:     "Reddit",
  g2:         "G2 Reviews",
  jobboards:  "Job Boards",
  webscrape:  "Web Scrape",
};

// Map source key → canonical source_type stored in source_configs
const SOURCE_TYPE_MAP: Record<string, string> = {
  linkedin:  "linkedin",
  reddit:    "reddit",
  g2:        "g2",
  jobboards: "jobboards",
  webscrape: "web",
};

const briefSchema = z.object({
  companyName:        z.string().min(1).max(120),
  contactEmail:       z.email(),
  plan:               z.string().max(60).optional(),
  icp:                z.string().max(2_000).optional(),
  useCases:           z.string().max(1_000).optional(),
  signalSources:      z.array(z.string().max(40)).max(8).optional(),
  additionalContext:  z.string().max(2_000).optional(),
});

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() ?? req.ip ?? "unknown";
  }
  return req.ip ?? "unknown";
}

function consumeBucket(
  map: Map<string, RateBucket>,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = map.get(key);
  if (!bucket || bucket.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function requireWebhookSecret(req: Request): boolean {
  const expected = process.env.PLATOS_BRIEF_WEBHOOK_SECRET;
  if (!expected) return true;

  const header = req.headers["x-plato-webhook-secret"] ?? req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  const normalized = value?.replace(/^Bearer\s+/i, "");
  return normalized === expected;
}

function workspaceIdForEmail(email: string): string {
  return `ws-${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16)}`;
}

function extractSeedUrls(brief: z.infer<typeof briefSchema>): string[] {
  const raw = [
    brief.icp,
    brief.useCases,
    brief.additionalContext,
  ].filter(Boolean).join("\n");

  const matches = raw.match(/https?:\/\/[^\s),]+/gi) ?? [];
  return [...new Set(matches)].slice(0, 25);
}

// POST /api/webhooks/brief — public, no Clerk auth
router.post("/webhooks/brief", async (req, res, next) => {
  try {
    if (!requireWebhookSecret(req)) {
      res.status(401).json({ error: "Unauthorized webhook" });
      return;
    }

    const ipLimit = Number(process.env.BRIEF_WEBHOOK_IP_LIMIT_PER_HOUR ?? 20);
    const emailLimit = Number(process.env.BRIEF_WEBHOOK_EMAIL_LIMIT_PER_DAY ?? 3);
    if (!consumeBucket(ipBuckets, clientIp(req), ipLimit, 3_600_000)) {
      res.status(429).json({ error: "Too many brief submissions from this IP" });
      return;
    }

    const result = briefSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid brief", details: result.error.issues });
      return;
    }
    const brief = result.data;
    const emailKey = brief.contactEmail.toLowerCase();

    if (!consumeBucket(emailBuckets, emailKey, emailLimit, 86_400_000)) {
      res.status(429).json({ error: "Too many brief submissions for this email" });
      return;
    }

    // Log receipt immediately — captures every prospect before GPT/DB
    req.log.info(
      { company: brief.companyName, emailDomain: brief.contactEmail.split("@")[1], sources: brief.signalSources },
      "Brief received",
    );

    const [existingWorkspace] = await db
      .select({
        id: workspacesTable.id,
        status: workspacesTable.status,
        icpConfig: workspacesTable.icpConfig,
      })
      .from(workspacesTable)
      .where(eq(workspacesTable.ownerEmail, emailKey))
      .limit(1);

    const workspaceId = existingWorkspace?.id ?? workspaceIdForEmail(emailKey);

    if (existingWorkspace?.icpConfig) {
      req.log.info({ workspaceId }, "Existing brief workspace returned without re-running GPT");
      res.status(200).json({
        workspaceId,
        signInUrl: `${process.env.APP_URL ?? ""}/sign-up`,
        icpConfig: existingWorkspace.icpConfig,
        status: existingWorkspace.status,
      });
      return;
    }

    // Parse ICP with GPT (cost-guarded)
    const icpConfig = await parseIcp(brief);

    // Upsert workspace
    await db
      .insert(workspacesTable)
      .values({
        id:         workspaceId,
        name:       brief.companyName,
        ownerEmail: emailKey,
        plan:       brief.plan ?? "Growth",
        quota:      200,
        used:       0,
        icpConfig,
      })
      .onConflictDoUpdate({
        target: workspacesTable.id,
        set: {
          name:      brief.companyName,
          icpConfig,
          updatedAt: new Date(),
        },
      });

    // Seed workspace_sources from GPT-recommended sources
    const sourceRows = icpConfig.signalSources.map((src: string) => ({
      workspaceId,
      name:   SOURCE_DISPLAY_NAMES[src] ?? src,
      yield:  0,
      status: "healthy" as const,
    }));
    if (sourceRows.length > 0) {
      await db.insert(workspaceSourcesTable).values(sourceRows).onConflictDoNothing();
    }

    // Seed source_configs + scraper_jobs only on first creation
    // (preserves any admin edits made after initial seeding)
    const existingConfigs = await db
      .select({ id: sourceConfigsTable.id })
      .from(sourceConfigsTable)
      .where(eq(sourceConfigsTable.workspaceId, workspaceId));

    if (existingConfigs.length === 0 && icpConfig.signalSources.length > 0) {
      const confidenceThreshold = icpConfig.confidence >= 0.85 ? 0.75 : 0.65;
      const seedUrls = extractSeedUrls(brief);

      const configRows = icpConfig.signalSources.map((src: string) => ({
        workspaceId,
        sourceType:          SOURCE_TYPE_MAP[src] ?? src,
        keywords:            icpConfig.keywords,
        disqualifiers:       icpConfig.disqualifiers,
        targetTitles:        [] as string[],
        targetIndustries:    [] as string[],
        seedUrls:            src === "webscrape" ? seedUrls : [],
        confidenceThreshold,
        dailyLimit:          50,
        createdFrom:         "brief_ai" as const,
      }));

      const insertedConfigs = await db
        .insert(sourceConfigsTable)
        .values(configRows)
        .returning({
          id:         sourceConfigsTable.id,
          sourceType: sourceConfigsTable.sourceType,
        });

      if (insertedConfigs.length > 0) {
        const jobRows = insertedConfigs.map((cfg) => ({
          workspaceId,
          sourceConfigId: cfg.id,
          jobType:        `${cfg.sourceType}_scrape`,
          status:         "paused" as const,
        }));
        await db.insert(scraperJobsTable).values(jobRows);
      }
    }

    req.log.info(
      { workspaceId, model: icpConfig.modelUsed, confidence: icpConfig.confidence },
      "Brief processed",
    );

    // Send confirmation email — fire and forget
    sendBriefConfirmation({ to: brief.contactEmail, companyName: brief.companyName })
      .catch((err: unknown) => req.log.warn({ err, workspaceId }, "Brief confirmation email failed silently"));

    res.status(201).json({
      workspaceId,
      signInUrl: `${process.env.APP_URL ?? ""}/sign-up`,
      icpConfig,
    });
  } catch (err) {
    req.log.error(
      { company: req.body?.companyName, emailDomain: String(req.body?.contactEmail ?? "").split("@")[1], err },
      "Brief processing failed",
    );
    next(err);
  }
});

export default router;
