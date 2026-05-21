import { Router } from "express";
import { z } from "zod/v4";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  workspacesTable,
  workspaceSourcesTable,
  sourceConfigsTable,
  scraperJobsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sendActivationEmail, sendAdminSlackActivation } from "../lib/email";
import { isAdminRequest } from "../lib/security";
import type { Request, Response, NextFunction } from "express";

const router = Router();

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  linkedin:  "LinkedIn",
  reddit:    "Reddit",
  g2:        "G2 Reviews",
  jobboards: "Job Boards",
  web:       "Web Scrape",
};

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    try {
      if (!(await isAdminRequest(req))) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    } catch {
      res.status(403).json({ error: "Forbidden" });
    }
  });
}

// GET /api/admin/workspaces — all workspaces with sources, source configs, and scraper jobs
router.get("/admin/workspaces", requireAdmin, async (req, res, next) => {
  try {
    const workspaces    = await db.select().from(workspacesTable).orderBy(desc(workspacesTable.createdAt));
    const sources       = await db.select().from(workspaceSourcesTable);
    const sourceConfigs = await db.select().from(sourceConfigsTable);
    const scraperJobs   = await db.select().from(scraperJobsTable);

    const result = workspaces.map((ws) => ({
      ...ws,
      sources: sources.filter((s) => s.workspaceId === ws.id),
      sourceConfigs: sourceConfigs
        .filter((c) => c.workspaceId === ws.id)
        .map((c) => ({
          ...c,
          jobs: scraperJobs.filter((j) => j.sourceConfigId === c.id),
        })),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/workspaces/:id — update workspace + cascade on activation
const patchWorkspaceSchema = z.object({
  status:          z.enum(["preview", "active", "paused"]).optional(),
  plan:            z.string().min(1).optional(),
  quota:           z.number().int().positive().optional(),
  deliveryMode:    z.enum(["diy", "managed"]).optional(),
  slackWebhookUrl: z.string().url().or(z.literal("")).optional(),
  deliveryEmail:   z.string().email().or(z.literal("")).optional(),
  adminNotes:      z.string().optional(),
});

router.patch("/admin/workspaces/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = patchWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
      return;
    }

    const id    = req.params["id"] as string;
    const patch = parsed.data;

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.status !== undefined)          set.status           = patch.status;
    if (patch.plan !== undefined)            set.plan             = patch.plan;
    if (patch.quota !== undefined)           set.quota            = patch.quota;
    if (patch.deliveryMode !== undefined)    set.deliveryMode     = patch.deliveryMode;
    if (patch.slackWebhookUrl !== undefined) set.slackWebhookUrl  = patch.slackWebhookUrl || null;
    if (patch.deliveryEmail !== undefined)   set.deliveryEmail    = patch.deliveryEmail   || null;
    if (patch.adminNotes !== undefined)      set.adminNotes       = patch.adminNotes;

    // Fetch current workspace for cascade + notification data
    const [current] = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, id));

    if (!current) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    // On first activation: record timestamp + cascade source configs + scraper jobs
    if (patch.status === "active" && current.status !== "active") {
      if (!current.activatedAt) set.activatedAt = new Date();

      // Flip preview_paused → active for all source configs
      await db
        .update(sourceConfigsTable)
        .set({ status: "active", updatedAt: new Date() })
        .where(and(
          eq(sourceConfigsTable.workspaceId, id),
          eq(sourceConfigsTable.status, "preview_paused"),
        ));

      // Flip paused → queued for all scraper jobs, set next_run_at = now
      await db
        .update(scraperJobsTable)
        .set({ status: "queued", nextRunAt: new Date(), updatedAt: new Date() })
        .where(and(
          eq(scraperJobsTable.workspaceId, id),
          eq(scraperJobsTable.status, "paused"),
        ));

      req.log.info({ workspaceId: id }, "Activation cascade: source configs + scraper jobs queued");

      // Fetch source configs for notification
      const configs = await db
        .select({ sourceType: sourceConfigsTable.sourceType })
        .from(sourceConfigsTable)
        .where(eq(sourceConfigsTable.workspaceId, id));
      const sourceNames = configs.map((c) =>
        SOURCE_DISPLAY_NAMES[c.sourceType] ?? c.sourceType
      );

      const deliveryMode = (patch.deliveryMode ?? current.deliveryMode) as string;

      // Fire notifications non-blocking — activation succeeds regardless
      if (current.ownerEmail) {
        sendActivationEmail({
          to:          current.ownerEmail,
          companyName: current.name,
          sources:     sourceNames,
        }).catch((err: unknown) => req.log.warn({ err }, "Activation email failed silently"));
      }

      sendAdminSlackActivation({
        workspaceName: current.name,
        ownerEmail:    current.ownerEmail,
        plan:          patch.plan ?? current.plan,
        quota:         patch.quota ?? current.quota,
        sources:       sourceNames,
        deliveryMode,
      }).catch((err: unknown) => req.log.warn({ err }, "Slack ping failed silently"));
    }

    await db.update(workspacesTable).set(set).where(eq(workspacesTable.id, id));

    req.log.info(
      {
        workspaceId: id,
        patchKeys: Object.keys(patch),
        status: patch.status,
        deliveryMode: patch.deliveryMode,
      },
      "Admin patched workspace",
    );
    res.json({ id, ...set });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/source-configs/:id — edit individual source config
const patchSourceConfigSchema = z.object({
  status:              z.enum(["preview_paused", "active", "paused", "disabled"]).optional(),
  dailyLimit:          z.number().int().min(1).max(500).optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  keywords:            z.array(z.string()).optional(),
  disqualifiers:       z.array(z.string()).optional(),
  targetTitles:        z.array(z.string()).optional(),
  targetIndustries:    z.array(z.string()).optional(),
  seedUrls:            z.array(z.string().url()).optional(),
  companySizeRange:    z.string().optional(),
  runFrequency:        z.enum(["hourly", "daily", "weekly"]).optional(),
});

router.patch("/admin/source-configs/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = patchSourceConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
      return;
    }

    const id    = parseInt(req.params["id"] as string, 10);
    const patch = parsed.data;

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.status              !== undefined) set.status              = patch.status;
    if (patch.dailyLimit          !== undefined) set.dailyLimit          = patch.dailyLimit;
    if (patch.confidenceThreshold !== undefined) set.confidenceThreshold = patch.confidenceThreshold;
    if (patch.keywords            !== undefined) set.keywords            = patch.keywords;
    if (patch.disqualifiers       !== undefined) set.disqualifiers       = patch.disqualifiers;
    if (patch.targetTitles        !== undefined) set.targetTitles        = patch.targetTitles;
    if (patch.targetIndustries    !== undefined) set.targetIndustries    = patch.targetIndustries;
    if (patch.seedUrls            !== undefined) set.seedUrls            = patch.seedUrls;
    if (patch.companySizeRange    !== undefined) set.companySizeRange    = patch.companySizeRange;
    if (patch.runFrequency        !== undefined) set.runFrequency        = patch.runFrequency;

    await db.update(sourceConfigsTable).set(set).where(eq(sourceConfigsTable.id, id));

    req.log.info(
      {
        sourceConfigId: id,
        patchKeys: Object.keys(patch),
        status: patch.status,
        dailyLimit: patch.dailyLimit,
        runFrequency: patch.runFrequency,
      },
      "Admin patched source config",
    );
    res.json({ id, ...set });
  } catch (err) {
    next(err);
  }
});

export default router;
