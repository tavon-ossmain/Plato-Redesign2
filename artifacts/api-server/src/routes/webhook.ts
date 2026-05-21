import { Router } from "express";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, workspacesTable, workspaceSourcesTable, sourceConfigsTable, scraperJobsTable } from "@workspace/db";
import { parseIcp } from "../lib/parseIcp";
import { sendBriefConfirmation } from "../lib/email";

const router = Router();

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
  companyName:        z.string().min(1),
  contactEmail:       z.email(),
  plan:               z.string().optional(),
  icp:                z.string().optional(),
  useCases:           z.string().optional(),
  signalSources:      z.array(z.string()).optional(),
  additionalContext:  z.string().optional(),
});

// POST /api/webhooks/brief — secret-guarded (X-Plato-Webhook-Secret header)
router.post("/webhooks/brief", async (req, res, next) => {
  try {
    const expectedSecret = process.env.PLATOS_CORE_WEBHOOK_SECRET;
    if (expectedSecret) {
      const incoming = req.headers["x-plato-webhook-secret"];
      if (!incoming || incoming !== expectedSecret) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }

    const result = briefSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid brief", details: result.error.issues });
      return;
    }
    const brief = result.data;

    // Log receipt immediately — captures every prospect before GPT/DB
    req.log.info(
      { company: brief.companyName, email: brief.contactEmail, sources: brief.signalSources },
      "Brief received",
    );

    // Parse ICP with GPT (cost-guarded)
    const icpConfig = await parseIcp(brief);

    // Generate a stable workspace id from the email
    const workspaceId = `ws-${Buffer.from(brief.contactEmail).toString("base64url").slice(0, 12)}`;

    // Upsert workspace
    await db
      .insert(workspacesTable)
      .values({
        id:         workspaceId,
        name:       brief.companyName,
        ownerEmail: brief.contactEmail,
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

      const configRows = icpConfig.signalSources.map((src: string) => ({
        workspaceId,
        sourceType:          SOURCE_TYPE_MAP[src] ?? src,
        keywords:            icpConfig.keywords,
        disqualifiers:       icpConfig.disqualifiers,
        targetTitles:        [] as string[],
        targetIndustries:    [] as string[],
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
    sendBriefConfirmation({ to: brief.contactEmail, companyName: brief.companyName });

    res.status(201).json({
      workspaceId,
      signInUrl: `${process.env.APP_URL ?? ""}/sign-up`,
      icpConfig,
    });
  } catch (err) {
    req.log.error(
      { company: req.body?.companyName, email: req.body?.contactEmail, err },
      "Brief processing failed",
    );
    next(err);
  }
});

export default router;
