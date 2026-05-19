export const MOCK_WORKSPACES = [
  { id: "ws-1", name: "Acme Corp", plan: "Growth", quota: 200, used: 143 },
  { id: "ws-2", name: "TechFlow", plan: "Scale", quota: 500, used: 312 },
];

export const MOCK_SIGNALS = [
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
  },
];

export const HEALTH = {
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
};

export const PROOF_STEPS = [
  { key: "captured", label: "Signal captured" },
  { key: "verified", label: "Source verified" },
  { key: "crm", label: "CRM / dedupe checked" },
  { key: "model", label: "Model path chosen" },
  { key: "routed", label: "Routed to owner" },
  { key: "feedback", label: "Feedback received" },
];

export const sourceIcon: Record<string, string> = {
  linkedin: "in",
  g2: "G2",
  reddit: "r/",
  job_board: "JD",
  web: "WS",
};

export const dispositionMeta: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  billable_opportunity: {
    label: "Billable Opportunity",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
    text: "#34d399",
    dot: "#34d399",
  },
  intent_update: {
    label: "Intent Update",
    bg: "rgba(34,211,238,0.08)",
    border: "rgba(34,211,238,0.25)",
    text: "#22d3ee",
    dot: "#22d3ee",
  },
  watchlist: {
    label: "Watchlist",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
    text: "#fbbf24",
    dot: "#fbbf24",
  },
  suppressed: {
    label: "Suppressed",
    bg: "rgba(113,113,122,0.08)",
    border: "rgba(113,113,122,0.25)",
    text: "#71717a",
    dot: "#71717a",
  },
};

export const statusDot: Record<string, string> = {
  healthy: "#34d399",
  degraded: "#fbbf24",
  error: "#f87171",
};

export const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

export const scoreColor = (n: number) => {
  if (n >= 85) return "#34d399";
  if (n >= 70) return "#22d3ee";
  if (n >= 55) return "#fbbf24";
  return "#f87171";
};
