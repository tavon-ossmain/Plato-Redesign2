import { Router } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, workspacesTable, signalsTable, workspaceSourcesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
router.use(requireAuth);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map a DB signal row to the API shape the frontend expects. */
function toApiSignal(row: typeof signalsTable.$inferSelect) {
  return {
    id:                 row.id,
    company:            row.company,
    contact: {
      name:     row.contactName,
      title:    row.contactTitle,
      linkedin: row.contactLinkedin,
      email:    row.contactEmail,
      phone:    row.contactPhone,
    },
    companyDomain:      row.companyDomain,
    source:             row.source,
    sourcePlatform:     row.sourcePlatform,
    sourceUrl:          row.sourceUrl,
    evidenceSnippet:    row.evidenceSnippet,
    whyNow:             row.whyNow,
    fitScore:           row.fitScore,
    confidenceScore:    row.confidenceScore,
    freshnessScore:     row.freshnessScore,
    seenAt:             row.seenAt,
    lastVerifiedAt:     row.lastVerifiedAt,
    disposition:        row.disposition,
    recommendedChannel: row.recommendedChannel,
    owner:              row.owner,
    route:              row.route,
    crmStatus:          row.crmStatus,
    dedupeStatus:       row.dedupeStatus,
    modelPath:          row.modelPath,
    enrichmentSource:   row.enrichmentSource,
    enrichmentStatus:   row.enrichmentStatus,
    rawSource:          row.rawSource,
    feedback:           row.feedback ?? null,
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/workspaces", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id:    workspacesTable.id,
        name:  workspacesTable.name,
        plan:  workspacesTable.plan,
        quota: workspacesTable.quota,
        used:  workspacesTable.used,
      })
      .from(workspacesTable);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/workspaces/:workspaceId/dashboard", async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const [ws] = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId))
      .limit(1);

    if (!ws) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    const sources = await db
      .select({ name: workspaceSourcesTable.name, yield: workspaceSourcesTable.yield, status: workspaceSourcesTable.status })
      .from(workspaceSourcesTable)
      .where(eq(workspaceSourcesTable.workspaceId, workspaceId));

    // Derive live counts from the signals table
    const [billable] = await db
      .select({ n: count() })
      .from(signalsTable)
      .where(and(eq(signalsTable.workspaceId, workspaceId), eq(signalsTable.disposition, "billable")));

    const [intent] = await db
      .select({ n: count() })
      .from(signalsTable)
      .where(and(eq(signalsTable.workspaceId, workspaceId), eq(signalsTable.disposition, "watchlist")));

    res.json({
      rawScanned:           ws.rawScanned,
      uniqueAccounts:       ws.uniqueAccounts,
      duplicatesSuppressed: ws.duplicatesSuppressed,
      staleSignals:         ws.staleSignals,
      billableOpportunities: Number(billable?.n ?? 0),
      intentUpdates:         Number(intent?.n ?? 0),
      quota:                ws.quota,
      used:                 ws.used,
      sources,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/workspaces/:workspaceId/pipeline", async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const [ws] = await db
      .select({ id: workspacesTable.id })
      .from(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId))
      .limit(1);

    if (!ws) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    const rows = await db
      .select()
      .from(signalsTable)
      .where(eq(signalsTable.workspaceId, workspaceId))
      .orderBy(sql`${signalsTable.seenAt} DESC`);

    res.json(rows.map(toApiSignal));
  } catch (err) {
    next(err);
  }
});

router.post("/workspaces/:workspaceId/opportunities/:opportunityId/assign", async (req, res, next) => {
  try {
    const { workspaceId, opportunityId } = req.params;
    const { owner } = req.body as { owner?: string };

    const [existing] = await db
      .select()
      .from(signalsTable)
      .where(and(eq(signalsTable.id, opportunityId), eq(signalsTable.workspaceId, workspaceId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Signal not found" });
      return;
    }

    const updates: Partial<typeof signalsTable.$inferInsert> = { route: "routed" };
    if (owner) updates.owner = owner;

    const [updated] = await db
      .update(signalsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(signalsTable.id, opportunityId))
      .returning();

    res.json(toApiSignal(updated!));
  } catch (err) {
    next(err);
  }
});

router.post("/feedback", async (req, res, next) => {
  try {
    const { signalId, workspaceId, feedback } = req.body as {
      signalId?: string;
      workspaceId?: string;
      feedback?: string;
    };

    if (!signalId || !workspaceId || !feedback) {
      res.status(400).json({ error: "signalId, workspaceId and feedback are required" });
      return;
    }

    const [existing] = await db
      .select()
      .from(signalsTable)
      .where(and(eq(signalsTable.id, signalId), eq(signalsTable.workspaceId, workspaceId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Signal not found" });
      return;
    }

    const [updated] = await db
      .update(signalsTable)
      .set({ feedback, updatedAt: new Date() })
      .where(eq(signalsTable.id, signalId))
      .returning();

    res.json(toApiSignal(updated!));
  } catch (err) {
    next(err);
  }
});

export default router;
