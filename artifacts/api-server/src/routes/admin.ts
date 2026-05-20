import { Router } from "express";
import { z } from "zod/v4";
import { desc } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, workspacesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "tavon@platos.agency")
  .split(",")
  .map((e) => e.trim().toLowerCase());

async function requireAdmin(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
) {
  requireAuth(req, res, async () => {
    try {
      const userId = (req as typeof req & { userId?: string }).userId;
      if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

      const user = await clerkClient().users.getUser(userId);
      const email = user.emailAddresses
        .find((e) => e.id === user.primaryEmailAddressId)
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

// GET /api/admin/workspaces
router.get("/admin/workspaces", requireAdmin, async (req, res, next) => {
  try {
    const workspaces = await db
      .select()
      .from(workspacesTable)
      .orderBy(desc(workspacesTable.createdAt));

    res.json(workspaces);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/workspaces/:id/status
const statusSchema = z.object({
  status: z.enum(["preview", "active"]),
});

router.patch("/admin/workspaces/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const result = statusSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid status", details: result.error.issues });
      return;
    }

    const { id } = req.params;
    const { status } = result.data;

    await db
      .update(workspacesTable)
      .set({ status, updatedAt: new Date() })
      .where((fields, { eq }) => eq(fields.id, id));

    req.log.info({ workspaceId: id, status }, "Workspace status updated by admin");
    res.json({ id, status });
  } catch (err) {
    next(err);
  }
});

export default router;
