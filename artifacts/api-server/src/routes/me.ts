import { Router } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { workspacesTable } from "@workspace/db/schema";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/me/workspace", requireAuth, async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await clerkClient.users.getUser(clerkUserId);
    const email = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (!email) {
      res.status(404).json({ error: "No primary email on Clerk account" });
      return;
    }

    const rows = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.ownerEmail, email))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: "No workspace found for this account" });
      return;
    }

    const ws = rows[0];
    res.json({
      id:        ws.id,
      name:      ws.name,
      status:    ws.status,
      plan:      ws.plan,
      quota:     ws.quota,
      used:      ws.used,
      icpConfig: ws.icpConfig ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
