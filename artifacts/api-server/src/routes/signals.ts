import { Router } from "express";

const router = Router();

// ── In-memory seed data (matches OpenAPI schema shapes) ─────────────────────

const WORKSPACES = [
  { id: "ws-1", name: "Acme Corp", plan: "Growth", quota: 200, used: 143 },
  { id: "ws-2", name: "TechFlow", plan: "Scale", quota: 500, used: 312 },
];

const SIGNALS: Record<string, SignalRecord[]> = {
  "ws-1": [
    {
      id: "sig-001",
      company: "Lattice Systems",
      contact: { name: "Jordan Park", title: "VP Sales Ops", linkedin: "linkedin.com/in/jordanpark" },
      source: "LinkedIn",
      sourcePlatform: "linkedin",
      sourceUrl: "https://linkedin.com/posts/lattice-hiring-sdr",
      evidenceSnippet:
        "We're scaling our outbound team by 3x this quarter and looking for a tool that gives reps verified buying signals — not spray-and-pray lists.",
      whyNow: "Active hiring for SDR roles, Q2 budget cycle open",
      fitScore: 92,
      confidenceScore: 88,
      freshnessScore: 97,
      seenAt: "2025-05-19T09:12:00Z",
      lastVerifiedAt: "2025-05-19T09:14:22Z",
      disposition: "billable_opportunity",
      recommendedChannel: "LinkedIn DM",
      owner: "Alex Rivera",
      route: "routed",
      crmStatus: "clean",
      dedupeStatus: "unique",
      modelPath: "high-intent-outbound",
      rawSource: "linkedin_post",
      feedback: null,
    },
    {
      id: "sig-002",
      company: "Meridian Capital",
      contact: { name: "Sam Okonkwo", title: "Head of Revenue", linkedin: "linkedin.com/in/samokonkwo" },
      source: "G2",
      sourcePlatform: "g2",
      sourceUrl: "https://g2.com/products/outbound/reviews",
      evidenceSnippet:
        "Just evaluated three intent tools. None of them filtered CRM duplicates properly. We shipped 200 leads last month, 60% were already in our system.",
      whyNow: "Public competitor complaint, actively evaluating replacements",
      fitScore: 86,
      confidenceScore: 79,
      freshnessScore: 84,
      seenAt: "2025-05-19T08:44:00Z",
      lastVerifiedAt: "2025-05-19T08:47:11Z",
      disposition: "billable_opportunity",
      recommendedChannel: "Email",
      owner: "Maya Chen",
      route: "unrouted",
      crmStatus: "clean",
      dedupeStatus: "unique",
      modelPath: "competitor-displacement",
      rawSource: "g2_review",
      feedback: null,
    },
    {
      id: "sig-003",
      company: "Cloudform",
      contact: { name: "Priya Desai", title: "Sales Enablement Lead", linkedin: "linkedin.com/in/priyadesai" },
      source: "Reddit",
      sourcePlatform: "reddit",
      sourceUrl: "https://reddit.com/r/sales/comments/xyz",
      evidenceSnippet: "Anyone using signal tools that aren't just recycled ZoomInfo? We want real intent, not demographic targeting.",
      whyNow: "Community question seeking active vendor recommendations",
      fitScore: 74,
      confidenceScore: 69,
      freshnessScore: 91,
      seenAt: "2025-05-19T07:30:00Z",
      lastVerifiedAt: "2025-05-19T07:31:00Z",
      disposition: "intent_update",
      recommendedChannel: "Cold Email",
      owner: "Unassigned",
      route: "unrouted",
      crmStatus: "clean",
      dedupeStatus: "unique",
      modelPath: "community-intent",
      rawSource: "reddit_comment",
      feedback: null,
    },
    {
      id: "sig-004",
      company: "NovaBridge",
      contact: { name: "Tyler Walsh", title: "Director of Demand Gen", linkedin: "linkedin.com/in/tylerwalsh" },
      source: "LinkedIn",
      sourcePlatform: "linkedin",
      sourceUrl: "https://linkedin.com/posts/novabridge-tools",
      evidenceSnippet: "Excited to announce our partnership with Outreach. Scaling up the outbound motion starting Q2.",
      whyNow: "Tech stack expansion signal",
      fitScore: 61,
      confidenceScore: 54,
      freshnessScore: 72,
      seenAt: "2025-05-18T15:20:00Z",
      lastVerifiedAt: "2025-05-18T15:21:00Z",
      disposition: "watchlist",
      recommendedChannel: "LinkedIn DM",
      owner: "Unassigned",
      route: "unrouted",
      crmStatus: "duplicate",
      dedupeStatus: "duplicate",
      modelPath: "tech-intent",
      rawSource: "linkedin_post",
      feedback: null,
    },
    {
      id: "sig-005",
      company: "Stratum Analytics",
      contact: { name: "Chloe Nguyen", title: "CMO", linkedin: "linkedin.com/in/chloeng" },
      source: "Job Posting",
      sourcePlatform: "job_board",
      sourceUrl: "https://greenhouse.io/stratumanalytics/jobs",
      evidenceSnippet:
        "Hiring: Enterprise Account Executive with experience in intent-based outbound. Must have worked with signal tools.",
      whyNow: "AE hiring — outbound scaling signal",
      fitScore: 88,
      confidenceScore: 83,
      freshnessScore: 79,
      seenAt: "2025-05-18T12:05:00Z",
      lastVerifiedAt: "2025-05-18T12:06:30Z",
      disposition: "billable_opportunity",
      recommendedChannel: "Email",
      owner: "Alex Rivera",
      route: "routed",
      crmStatus: "clean",
      dedupeStatus: "unique",
      modelPath: "hiring-intent",
      rawSource: "job_board",
      feedback: null,
    },
  ],
  "ws-2": [],
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
    sources: [
      { name: "LinkedIn", yield: 38, status: "healthy" },
      { name: "G2", yield: 24, status: "healthy" },
      { name: "Reddit", yield: 17, status: "degraded" },
      { name: "Job Boards", yield: 14, status: "healthy" },
      { name: "Web Scrape", yield: 7, status: "error" },
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
    sources: [
      { name: "LinkedIn", yield: 41, status: "healthy" },
      { name: "G2", yield: 22, status: "healthy" },
      { name: "Reddit", yield: 19, status: "healthy" },
      { name: "Job Boards", yield: 11, status: "degraded" },
      { name: "Web Scrape", yield: 7, status: "error" },
    ],
  },
};

// ── TypeScript shapes ────────────────────────────────────────────────────────

interface SignalRecord {
  id: string;
  company: string;
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
  disposition: string;
  recommendedChannel: string;
  owner: string;
  route: string;
  crmStatus: string;
  dedupeStatus: string;
  modelPath: string;
  rawSource: string;
  feedback: string | null;
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
  sources: { name: string; yield: number; status: string }[];
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/workspaces", (_req, res) => {
  res.json(WORKSPACES);
});

router.get("/workspaces/:workspaceId/dashboard", (req, res) => {
  const dash = DASHBOARDS[req.params.workspaceId];
  if (!dash) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  res.json(dash);
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
  const signals = SIGNALS[req.params.workspaceId];
  if (!signals) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const sig = signals.find((s) => s.id === req.params.opportunityId);
  if (!sig) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }
  const { owner } = req.body as { owner?: string };
  if (owner) sig.owner = owner;
  sig.route = "routed";
  res.json(sig);
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
  const signals = SIGNALS[workspaceId];
  if (!signals) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const sig = signals.find((s) => s.id === signalId);
  if (!sig) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }
  sig.feedback = feedback;
  res.json(sig);
});

export default router;
