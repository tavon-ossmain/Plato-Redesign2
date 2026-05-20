import { Router } from "express";
import { z } from "zod/v4";
import { db, workspacesTable, workspaceSourcesTable } from "@workspace/db";
import { parseIcp } from "../lib/parseIcp";

const router = Router();

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  linkedin:   "LinkedIn",
  reddit:     "Reddit",
  g2:         "G2 Reviews",
  jobboards:  "Job Boards",
  webscrape:  "Web Scrape",
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

// POST /api/webhooks/brief — public, no Clerk auth
router.post("/webhooks/brief", async (req, res, next) => {
  try {
    const result = briefSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid brief", details: result.error.issues });
      return;
    }
    const brief = result.data;

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
      await db
        .insert(workspaceSourcesTable)
        .values(sourceRows)
        .onConflictDoNothing();
    }

    req.log.info({ workspaceId, model: icpConfig.modelUsed, confidence: icpConfig.confidence }, "Brief processed");

    res.status(201).json({
      workspaceId,
      signInUrl: `${process.env.APP_URL ?? ""}/sign-up`,
      icpConfig,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
