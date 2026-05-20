import { Router } from "express";
import { z } from "zod/v4";
import { desc, eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, workspacesTable, workspaceSourcesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import type { Request, Response, NextFunction } from "express";

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "tavon@platos.agency")
  .split(",")
  .map((e) => e.trim().toLowerCase());

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    try {
      const userId = (req as Request & { userId?: string }).userId;
      if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

      const user = await clerkClient.users.getUser(userId);
      const email = user.emailAddresses
        .find((e: { id: string; emailAddress: string }) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? "";

      if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    } catch {
      res.status(403).json({ error: "Forbidden" });
    }
  });
}

// GET /api/admin/workspaces — all workspaces + their sources
router.get("/admin/workspaces", requireAdmin, async (req, res, next) => {
  try {
    const workspaces = await db
      .select()
      .from(workspacesTable)
      .orderBy(desc(workspacesTable.createdAt));

    const sources = await db.select().from(workspaceSourcesTable);

    const result = workspaces.map((ws) => ({
      ...ws,
      sources: sources.filter((s) => s.workspaceId === ws.id),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/workspaces/:id — update any editable field
const patchSchema = z.object({
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
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
      return;
    }

    const id = req.params["id"] as string;
    const patch = parsed.data;

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.status !== undefined)          set.status           = patch.status;
    if (patch.plan !== undefined)            set.plan             = patch.plan;
    if (patch.quota !== undefined)           set.quota            = patch.quota;
    if (patch.deliveryMode !== undefined)    set.deliveryMode     = patch.deliveryMode;
    if (patch.slackWebhookUrl !== undefined) set.slackWebhookUrl  = patch.slackWebhookUrl || null;
    if (patch.deliveryEmail !== undefined)   set.deliveryEmail    = patch.deliveryEmail   || null;
    if (patch.adminNotes !== undefined)      set.adminNotes       = patch.adminNotes;

    // Record activation timestamp on first activation
    if (patch.status === "active") {
      const [current] = await db
        .select({ activatedAt: workspacesTable.activatedAt })
        .from(workspacesTable)
        .where(eq(workspacesTable.id, id));
      if (current && !current.activatedAt) set.activatedAt = new Date();
    }

    await db.update(workspacesTable).set(set).where(eq(workspacesTable.id, id));

    req.log.info({ workspaceId: id, patch }, "Admin patched workspace");
    res.json({ id, ...set });
  } catch (err) {
    next(err);
  }
});

export default router;
