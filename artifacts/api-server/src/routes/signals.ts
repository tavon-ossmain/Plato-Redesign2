import { Router } from "express";

const router = Router();

const now = new Date("2026-05-20T15:00:00Z").getTime();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

type Disposition =
  | "billable_opportunity"
  | "intent_update"
  | "watchlist"
  | "suppressed";

type RouteState = "routed" | "unrouted";
type ActionStatus = "ready_to_route" | "routed" | "outreach_queued" | "suppressed";

interface WorkspaceRecord {
  id: string;
  name: string;
  plan: string;
  quota: number;
  used: number;
  primaryCrm: string;
  deliveryMode: "DIY Signals" | "DFY Outreach";
}

interface SourceHealthRecord {
  name: string;
  yield: number;
  status: "healthy" | "degraded" | "error";
  mode: "api" | "playwright" | "manual_review";
  scanned: number;
  accepted: number;
  duplicates: number;
  stale: number;
}

interface CostGuardRecord {
  status: "normal" | "guarded" | "degraded";
  defaultModel: string;
  escalationModel: string;
  weeklyBudgetUsd: number;
  spentUsd: number;
  degradedAction: string;
}

interface DashboardRecord {
  rawScanned: number;
  uniqueAccounts: number;
  duplicatesSuppressed: number;
  staleSignals: number;
  billableOpportunities: number;
  intentUpdates: number;
  quota: number;
  used: number;
  deliveredToday: number;
  weeklyTargetMin: number;
  weeklyTargetMax: number;
  rolledOver: number;
  noLeadReason: string | null;
  costGuard: CostGuardRecord;
  sources: SourceHealthRecord[];
}

interface SignalRecord {
  id: string;
  company: string;
  accountDomain: string;
  contact: { name: string; title: string; linkedin: string };
  source: string;
  sourcePlatform: string;
  sourceUrl: string;
  evidenceSnippet: string;
  whyNow: string;
  fitScore: number;
  confidenceScore: number;
  freshnessScore: number;
  seenAt: string;
  lastVerifiedAt: string;
  disposition: Disposition;
  billingReason: string;
  recommendedChannel: string;
  owner: string;
  route: RouteState;
  actionStatus: ActionStatus;
  crmStatus: "clean" | "matched" | "duplicate" | "missing_contact";
  crmRecordId: string | null;
  dedupeStatus: "unique" | "duplicate" | "intent_update";
  duplicateOf: string | null;
  territory: string;
  modelPath: string;
  modelTier: "cheap_default" | "premium_escalation" | "fallback";
  rawSource: string;
  nextAction: string;
  outreachDraft: string;
  feedback: string | null;
}

const WORKSPACES: WorkspaceRecord[] = [
  {
    id: "ws-1",
    name: "Acme Corp",
    plan: "Growth",
    quota: 200,
    used: 143,
    primaryCrm: "HubSpot",
    deliveryMode: "DIY Signals",
  },
  {
    id: "ws-2",
    name: "TechFlow",
    plan: "Scale",
    quota: 500,
    used: 312,
    primaryCrm: "Salesforce",
    deliveryMode: "DFY Outreach",
  },
];

const SIGNALS: Record<string, SignalRecord[]> = {
  "ws-1": [
    {
      id: "sig-001",
      company: "Lattice Systems",
      accountDomain: "lattice.example",
      contact: { name: "Jordan Park", title: "VP Sales Ops", linkedin: "linkedin.com/in/jordanpark" },
      source: "LinkedIn",
      sourcePlatform: "linkedin",
      sourceUrl: "https://linkedin.com/posts/lattice-hiring-sdr",
      evidenceSnippet:
        "We're scaling our outbound team by 3x this quarter and looking for a tool that gives reps verified buying signals - not spray-and-pray lists.",
      whyNow: "Active SDR hiring, outbound team expansion, and Q2 budget cycle all line up.",
      fitScore: 92,
      confidenceScore: 88,
      freshnessScore: 97,
      seenAt: hoursAgo(1.2),
      lastVerifiedAt: hoursAgo(1.1),
      disposition: "billable_opportunity",
      billingReason: "Unique account, current signal, ICP fit above 85, and no CRM duplicate.",
      recommendedChannel: "LinkedIn DM",
      owner: "Alex Rivera",
      route: "routed",
      actionStatus: "routed",
      crmStatus: "clean",
      crmRecordId: "hubspot-company-91822",
      dedupeStatus: "unique",
      duplicateOf: null,
      territory: "Commercial West",
      modelPath: "intent-classifier > crm-dedupe > premium-context-check",
      modelTier: "premium_escalation",
      rawSource: "linkedin_post",
      nextAction: "Send owner the source link, context, and first-message angle.",
      outreachDraft:
        "Jordan - saw your team is scaling outbound and looking for verified buying signals. Plato's finds public in-market moments before they become stale lists. Worth comparing notes?",
      feedback: null,
    },
    {
      id: "sig-002",
      company: "Meridian Capital",
      accountDomain: "meridiancapital.example",
      contact: { name: "Sam Okonkwo", title: "Head of Revenue", linkedin: "linkedin.com/in/samokonkwo" },
      source: "G2",
      sourcePlatform: "g2",
      sourceUrl: "https://g2.com/products/outbound/reviews",
      evidenceSnippet:
        "Just evaluated three intent tools. None of them filtered CRM duplicates properly. We shipped 200 leads last month, 60% were already in our system.",
      whyNow: "Public competitor complaint shows active evaluation and a pain we directly solve.",
      fitScore: 86,
      confidenceScore: 79,
      freshnessScore: 84,
      seenAt: hoursAgo(2.4),
      lastVerifiedAt: hoursAgo(2.3),
      disposition: "billable_opportunity",
      billingReason: "Evaluation intent plus duplicate pain; CRM match did not exist.",
      recommendedChannel: "Email",
      owner: "Maya Chen",
      route: "unrouted",
      actionStatus: "ready_to_route",
      crmStatus: "clean",
      crmRecordId: null,
      dedupeStatus: "unique",
      duplicateOf: null,
      territory: "Enterprise East",
      modelPath: "intent-classifier > crm-dedupe > competitor-displacement",
      modelTier: "cheap_default",
      rawSource: "g2_review",
      nextAction: "Route to Maya with duplicate-suppression proof and competitor angle.",
      outreachDraft:
        "Sam - saw your note about duplicate-heavy intent tools. Plato's only promotes verified buying moments after CRM dedupe, so reps do not waste cycles on recycled accounts.",
      feedback: null,
    },
    {
      id: "sig-003",
      company: "Cloudform",
      accountDomain: "cloudform.example",
      contact: { name: "Priya Desai", title: "Sales Enablement Lead", linkedin: "linkedin.com/in/priyadesai" },
      source: "Reddit",
      sourcePlatform: "reddit",
      sourceUrl: "https://reddit.com/r/sales/comments/xyz",
      evidenceSnippet: "Anyone using signal tools that aren't just recycled ZoomInfo? We want real intent, not demographic targeting.",
      whyNow: "Community question asks for active recommendations, but CRM shows a known account.",
      fitScore: 74,
      confidenceScore: 69,
      freshnessScore: 91,
      seenAt: hoursAgo(3.1),
      lastVerifiedAt: hoursAgo(3.0),
      disposition: "intent_update",
      billingReason: "Not billed as a new lead because the company already exists in CRM.",
      recommendedChannel: "Slack to account owner",
      owner: "Janelle Ortiz",
      route: "routed",
      actionStatus: "routed",
      crmStatus: "matched",
      crmRecordId: "hubspot-company-11492",
      dedupeStatus: "intent_update",
      duplicateOf: "hubspot-company-11492",
      territory: "Mid-Market Central",
      modelPath: "intent-classifier > crm-dedupe > owner-routing",
      modelTier: "cheap_default",
      rawSource: "reddit_comment",
      nextAction: "Send as account intelligence, not a billable opportunity.",
      outreachDraft:
        "Priya - saw your team asking for intent that is not recycled database data. We found that exact signal and can show the source trail.",
      feedback: null,
    },
    {
      id: "sig-004",
      company: "NovaBridge",
      accountDomain: "novabridge.example",
      contact: { name: "Tyler Walsh", title: "Director of Demand Gen", linkedin: "linkedin.com/in/tylerwalsh" },
      source: "LinkedIn",
      sourcePlatform: "linkedin",
      sourceUrl: "https://linkedin.com/posts/novabridge-tools",
      evidenceSnippet: "Excited to announce our partnership with Outreach. Scaling up the outbound motion starting Q2.",
      whyNow: "Tech stack expansion signal, but already owned by a rep and not urgent enough to bill.",
      fitScore: 61,
      confidenceScore: 54,
      freshnessScore: 72,
      seenAt: hoursAgo(27),
      lastVerifiedAt: hoursAgo(26.8),
      disposition: "watchlist",
      billingReason: "Watchlisted because the account is already in territory and confidence is below threshold.",
      recommendedChannel: "Watchlist",
      owner: "Unassigned",
      route: "unrouted",
      actionStatus: "ready_to_route",
      crmStatus: "duplicate",
      crmRecordId: "hubspot-company-77201",
      dedupeStatus: "duplicate",
      duplicateOf: "hubspot-company-77201",
      territory: "Commercial West",
      modelPath: "intent-classifier > duplicate-suppression",
      modelTier: "cheap_default",
      rawSource: "linkedin_post",
      nextAction: "Suppress from billable quota; keep as watchlist context.",
      outreachDraft: "No outreach recommended until a stronger buyer pain appears.",
      feedback: null,
    },
    {
      id: "sig-005",
      company: "Stratum Analytics",
      accountDomain: "stratumanalytics.example",
      contact: { name: "Chloe Nguyen", title: "CMO", linkedin: "linkedin.com/in/chloeng" },
      source: "Job Posting",
      sourcePlatform: "job_board",
      sourceUrl: "https://greenhouse.io/stratumanalytics/jobs",
      evidenceSnippet:
        "Hiring: Enterprise Account Executive with experience in intent-based outbound. Must have worked with signal tools.",
      whyNow: "AE hiring suggests a near-term outbound buildout where signal quality matters.",
      fitScore: 88,
      confidenceScore: 83,
      freshnessScore: 79,
      seenAt: hoursAgo(31),
      lastVerifiedAt: hoursAgo(30.8),
      disposition: "billable_opportunity",
      billingReason: "Current hiring signal, no CRM duplicate, and fit score above billable threshold.",
      recommendedChannel: "Email",
      owner: "Alex Rivera",
      route: "routed",
      actionStatus: "outreach_queued",
      crmStatus: "clean",
      crmRecordId: "hubspot-company-65011",
      dedupeStatus: "unique",
      duplicateOf: null,
      territory: "Enterprise West",
      modelPath: "intent-classifier > crm-dedupe > hiring-intent",
      modelTier: "cheap_default",
      rawSource: "job_board",
      nextAction: "Queue DFY outreach if the client approves messaging.",
      outreachDraft:
        "Chloe - noticed Stratum is hiring for intent-based outbound. Plato's surfaces verified buying moments your team can act on without adding another list vendor.",
      feedback: null,
    },
  ],
  "ws-2": [
    {
      id: "sig-201",
      company: "HarborOps",
      accountDomain: "harborops.example",
      contact: { name: "Elena Morris", title: "Revenue Operations Lead", linkedin: "linkedin.com/in/elenamorris" },
      source: "Founder Forum",
      sourcePlatform: "forum",
      sourceUrl: "https://founderforum.example/thread/outbound-intent",
      evidenceSnippet: "We need fewer cold lists and more moments where a buyer is already asking for help.",
      whyNow: "Buyer is actively discussing a replacement outbound channel.",
      fitScore: 90,
      confidenceScore: 81,
      freshnessScore: 95,
      seenAt: hoursAgo(0.8),
      lastVerifiedAt: hoursAgo(0.7),
      disposition: "billable_opportunity",
      billingReason: "Net-new account with explicit pain and recent public source.",
      recommendedChannel: "Email",
      owner: "Marcus Lee",
      route: "unrouted",
      actionStatus: "ready_to_route",
      crmStatus: "clean",
      crmRecordId: null,
      dedupeStatus: "unique",
      duplicateOf: null,
      territory: "SMB West",
      modelPath: "intent-classifier > crm-dedupe > premium-context-check",
      modelTier: "premium_escalation",
      rawSource: "forum_comment",
      nextAction: "Route to Marcus and open with the buyer's exact language.",
      outreachDraft:
        "Elena - saw your note about needing buyer moments instead of more cold lists. That's exactly the signal layer Plato's runs for revenue teams.",
      feedback: null,
    },
  ],
};

const DASHBOARDS: Record<string, DashboardRecord> = {
  "ws-1": {
    rawScanned: 14302,
    uniqueAccounts: 1847,
    duplicatesSuppressed: 412,
    staleSignals: 223,
    billableOpportunities: 143,
    intentUpdates: 89,
    quota: 200,
    used: 143,
    deliveredToday: 18,
    weeklyTargetMin: 125,
    weeklyTargetMax: 175,
    rolledOver: 57,
    noLeadReason: null,
    costGuard: {
      status: "guarded",
      defaultModel: "gpt-5.4-mini",
      escalationModel: "gpt-5.4",
      weeklyBudgetUsd: 85,
      spentUsd: 31.4,
      degradedAction: "Premium checks pause first; dedupe, cache summaries, and portal delivery keep running.",
    },
    sources: [
      { name: "LinkedIn", yield: 38, status: "healthy", mode: "playwright", scanned: 4200, accepted: 54, duplicates: 130, stale: 44 },
      { name: "G2", yield: 24, status: "healthy", mode: "api", scanned: 2100, accepted: 34, duplicates: 76, stale: 28 },
      { name: "Reddit", yield: 17, status: "degraded", mode: "playwright", scanned: 3800, accepted: 25, duplicates: 91, stale: 62 },
      { name: "Job Boards", yield: 14, status: "healthy", mode: "api", scanned: 3000, accepted: 20, duplicates: 71, stale: 49 },
      { name: "Web Scrape", yield: 7, status: "error", mode: "manual_review", scanned: 1202, accepted: 10, duplicates: 44, stale: 40 },
    ],
  },
  "ws-2": {
    rawScanned: 29100,
    uniqueAccounts: 3201,
    duplicatesSuppressed: 780,
    staleSignals: 401,
    billableOpportunities: 312,
    intentUpdates: 155,
    quota: 500,
    used: 312,
    deliveredToday: 31,
    weeklyTargetMin: 250,
    weeklyTargetMax: 350,
    rolledOver: 188,
    noLeadReason: null,
    costGuard: {
      status: "normal",
      defaultModel: "gpt-5.4-mini",
      escalationModel: "gpt-5.4",
      weeklyBudgetUsd: 160,
      spentUsd: 48.2,
      degradedAction: "Escalation remains available for low-confidence or high-value signals.",
    },
    sources: [
      { name: "LinkedIn", yield: 41, status: "healthy", mode: "playwright", scanned: 8400, accepted: 128, duplicates: 220, stale: 80 },
      { name: "G2", yield: 22, status: "healthy", mode: "api", scanned: 6100, accepted: 69, duplicates: 180, stale: 66 },
      { name: "Reddit", yield: 19, status: "healthy", mode: "playwright", scanned: 7600, accepted: 60, duplicates: 199, stale: 91 },
      { name: "Job Boards", yield: 11, status: "degraded", mode: "api", scanned: 5000, accepted: 34, duplicates: 112, stale: 88 },
      { name: "Web Scrape", yield: 7, status: "error", mode: "manual_review", scanned: 2000, accepted: 21, duplicates: 69, stale: 76 },
    ],
  },
};

function findWorkspace(workspaceId: string) {
  return WORKSPACES.find((workspace) => workspace.id === workspaceId);
}

function findSignal(workspaceId: string, signalId: string) {
  return SIGNALS[workspaceId]?.find((signal) => signal.id === signalId) ?? null;
}

router.get("/workspaces", (_req, res) => {
  res.json(WORKSPACES);
});

router.get("/workspaces/:workspaceId/dashboard", (req, res) => {
  const workspace = findWorkspace(req.params.workspaceId);
  const dashboard = DASHBOARDS[req.params.workspaceId];

  if (!workspace || !dashboard) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  res.json({
    ...dashboard,
    workspaceName: workspace.name,
    primaryCrm: workspace.primaryCrm,
    deliveryMode: workspace.deliveryMode,
  });
});

router.get("/workspaces/:workspaceId/pipeline", (req, res) => {
  const signals = SIGNALS[req.params.workspaceId];

  if (!signals) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  res.json(signals);
});

router.post("/workspaces/:workspaceId/opportunities/:opportunityId/assign", (req, res) => {
  const signal = findSignal(req.params.workspaceId, req.params.opportunityId);

  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }

  const { owner } = req.body as { owner?: string };
  if (owner) signal.owner = owner;
  signal.route = "routed";
  signal.actionStatus = "routed";
  req.log.info({ signalId: signal.id, owner: signal.owner }, "Signal routed to owner");
  res.json(signal);
});

router.post("/workspaces/:workspaceId/opportunities/:opportunityId/outreach", (req, res) => {
  const signal = findSignal(req.params.workspaceId, req.params.opportunityId);

  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }

  if (signal.disposition === "suppressed" || signal.dedupeStatus === "duplicate") {
    res.status(409).json({ error: "Suppressed or duplicate signals cannot start outreach" });
    return;
  }

  signal.actionStatus = "outreach_queued";
  signal.route = "routed";
  if (signal.owner === "Unassigned") signal.owner = "Alex Rivera";
  req.log.info({ signalId: signal.id, channel: signal.recommendedChannel }, "Outreach queued");
  res.json(signal);
});

router.post("/feedback", (req, res) => {
  const { signalId, workspaceId, feedback } = req.body as {
    signalId?: string;
    workspaceId?: string;
    feedback?: string;
  };

  if (!signalId || !workspaceId || !feedback) {
    res.status(400).json({ error: "signalId, workspaceId and feedback are required" });
    return;
  }

  const signal = findSignal(workspaceId, signalId);
  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }

  signal.feedback = feedback;

  if (feedback === "duplicate") {
    signal.disposition = "suppressed";
    signal.actionStatus = "suppressed";
    signal.dedupeStatus = "duplicate";
    signal.billingReason = "Suppressed after operator feedback confirmed duplicate ownership.";
  }

  if (feedback === "outdated") {
    signal.disposition = "suppressed";
    signal.actionStatus = "suppressed";
    signal.freshnessScore = Math.min(signal.freshnessScore, 40);
    signal.billingReason = "Suppressed after operator feedback marked the source as outdated.";
  }

  req.log.info({ signalId: signal.id, feedback }, "Signal feedback recorded");
  res.json(signal);
});

export default router;
