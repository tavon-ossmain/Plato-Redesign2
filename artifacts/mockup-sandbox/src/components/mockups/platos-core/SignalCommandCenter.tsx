import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_WORKSPACES = [
  { id: "ws-1", name: "Acme Corp", plan: "Growth", quota: 200, used: 143 },
  { id: "ws-2", name: "TechFlow", plan: "Scale", quota: 500, used: 312 },
];

const MOCK_SIGNALS = [
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
    evidenceSnippet: "Hiring: Enterprise Account Executive with experience in intent-based outbound. Must have worked with signal tools.",
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

const HEALTH = {
  rawScanned: 14302,
  uniqueAccounts: 1847,
  duplicatesSuppressed: 412,
  staleSignals: 223,
  billableOpportunities: 143,
  intentUpdates: 89,
  sources: [
    { name: "LinkedIn", yield: 38, status: "healthy" },
    { name: "G2", yield: 24, status: "healthy" },
    { name: "Reddit", yield: 17, status: "degraded" },
    { name: "Job Boards", yield: 14, status: "healthy" },
    { name: "Web Scrape", yield: 7, status: "error" },
  ],
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const dispositionLabel: Record<string, { label: string; color: string }> = {
  billable_opportunity: { label: "Billable Opportunity", color: "text-emerald-400" },
  intent_update: { label: "Intent Update", color: "text-cyan-400" },
  watchlist: { label: "Watchlist", color: "text-amber-400" },
  suppressed: { label: "Suppressed", color: "text-zinc-500" },
};

const routeColor: Record<string, string> = {
  routed: "text-emerald-400",
  unrouted: "text-zinc-500",
};

const statusDot: Record<string, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-400",
  error: "bg-red-500",
};

const scoreColor = (n: number) => {
  if (n >= 85) return "text-emerald-400";
  if (n >= 70) return "text-cyan-400";
  if (n >= 55) return "text-amber-400";
  return "text-red-400";
};

const sourceIcon: Record<string, string> = {
  linkedin: "in",
  g2: "G2",
  reddit: "r/",
  job_board: "JD",
  web: "WS",
};

const PROOF_STEPS = [
  { key: "captured", label: "Signal captured" },
  { key: "verified", label: "Source verified" },
  { key: "crm", label: "CRM / dedupe checked" },
  { key: "model", label: "Model path chosen" },
  { key: "routed", label: "Routed to owner" },
  { key: "feedback", label: "Feedback received" },
];

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-mono font-semibold ${scoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-[3px] rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: value >= 85 ? "#34d399" : value >= 70 ? "#22d3ee" : value >= 55 ? "#fbbf24" : "#f87171",
          }}
        />
      </div>
    </div>
  );
}

function DispositionBadge({ disposition }: { disposition: string }) {
  const d = dispositionLabel[disposition] ?? { label: disposition, color: "text-zinc-400" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
      style={{
        borderColor:
          disposition === "billable_opportunity"
            ? "rgba(52,211,153,0.3)"
            : disposition === "intent_update"
            ? "rgba(34,211,238,0.3)"
            : disposition === "watchlist"
            ? "rgba(251,191,36,0.3)"
            : "rgba(113,113,122,0.3)",
        color:
          disposition === "billable_opportunity"
            ? "#34d399"
            : disposition === "intent_update"
            ? "#22d3ee"
            : disposition === "watchlist"
            ? "#fbbf24"
            : "#71717a",
        background:
          disposition === "billable_opportunity"
            ? "rgba(52,211,153,0.08)"
            : disposition === "intent_update"
            ? "rgba(34,211,238,0.08)"
            : disposition === "watchlist"
            ? "rgba(251,191,36,0.08)"
            : "rgba(113,113,122,0.08)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background:
            disposition === "billable_opportunity"
              ? "#34d399"
              : disposition === "intent_update"
              ? "#22d3ee"
              : disposition === "watchlist"
              ? "#fbbf24"
              : "#71717a",
        }}
      />
      {d.label}
    </span>
  );
}

export function SignalCommandCenter() {
  const [selectedWorkspace, setSelectedWorkspace] = useState(MOCK_WORKSPACES[0]);
  const [selectedSignal, setSelectedSignal] = useState(MOCK_SIGNALS[0]);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, string>>({});
  const [routed, setRouted] = useState<Record<string, boolean>>({ "sig-001": true, "sig-005": true });
  const [diagOpen, setDiagOpen] = useState(false);
  const [filterDisposition, setFilterDisposition] = useState<string | null>(null);

  const ws = selectedWorkspace;
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  const filteredSignals = filterDisposition
    ? MOCK_SIGNALS.filter((s) => s.disposition === filterDisposition)
    : MOCK_SIGNALS;

  const proofDone = (sig: typeof MOCK_SIGNALS[0]) => {
    const steps = new Set<string>();
    steps.add("captured");
    steps.add("verified");
    steps.add("crm");
    steps.add("model");
    if (routed[sig.id]) steps.add("routed");
    if (feedbackSent[sig.id]) steps.add("feedback");
    return steps;
  };

  const handleAssign = () => {
    setRouted((prev) => ({ ...prev, [selectedSignal.id]: true }));
  };

  const handleFeedback = (type: string) => {
    setFeedbackSent((prev) => ({ ...prev, [selectedSignal.id]: type }));
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden select-none"
      style={{ background: "#0a0a0b", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-4 shrink-0 border-b"
        style={{ height: 44, borderColor: "#1a1a1f", background: "#0d0d0f" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "#22d3ee22", border: "1px solid #22d3ee44" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">Plato's</span>
            <span className="text-zinc-500 text-sm">/</span>
            <span className="text-zinc-400 text-sm">Signal Command Center</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px]" style={{ background: "#111113", border: "1px solid #1f1f25" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Live</span>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white" style={{ background: "#22d3ee22", border: "1px solid #22d3ee33" }}>
            AR
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Rail */}
        <aside
          className="flex flex-col shrink-0 border-r overflow-y-auto"
          style={{ width: 220, borderColor: "#1a1a1f", background: "#0c0c0e" }}
        >
          {/* Workspace Switcher */}
          <div className="p-3 border-b" style={{ borderColor: "#1a1a1f" }}>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Workspace</div>
            <div className="flex flex-col gap-1">
              {MOCK_WORKSPACES.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorkspace(w)}
                  className="flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors"
                  style={{
                    background: selectedWorkspace.id === w.id ? "#16161c" : "transparent",
                    border: selectedWorkspace.id === w.id ? "1px solid #22222a" : "1px solid transparent",
                  }}
                >
                  <span className={`text-xs font-medium ${selectedWorkspace.id === w.id ? "text-white" : "text-zinc-400"}`}>
                    {w.name}
                  </span>
                  <span className="text-[10px] text-zinc-600">{w.plan}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Quota */}
          <div className="p-3 border-b" style={{ borderColor: "#1a1a1f" }}>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Weekly Quota</div>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-xl font-semibold tabular-nums text-white">{ws.used}</span>
              <span className="text-xs text-zinc-600 mb-0.5">/ {ws.quota}</span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "#1a1a1f" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${quotaPct}%`,
                  background: quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : "#34d399",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-600">{quotaPct}% used</span>
              <span className="text-[10px] text-zinc-600">{ws.quota - ws.used} remaining</span>
            </div>
          </div>

          {/* Source Health */}
          <div className="p-3 border-b" style={{ borderColor: "#1a1a1f" }}>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Source Health</div>
            <div className="flex flex-col gap-1.5">
              {HEALTH.sources.map((src) => (
                <div key={src.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot[src.status]}`} />
                    <span className="text-xs text-zinc-400">{src.name}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{src.yield}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Health Metrics */}
          <div className="p-3">
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Signal Health</div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Raw Scanned", val: HEALTH.rawScanned.toLocaleString() },
                { label: "Unique Accounts", val: HEALTH.uniqueAccounts.toLocaleString() },
                { label: "Dupes Suppressed", val: HEALTH.duplicatesSuppressed.toLocaleString() },
                { label: "Stale", val: HEALTH.staleSignals.toLocaleString() },
                { label: "Billable Opps", val: HEALTH.billableOpportunities.toLocaleString() },
                { label: "Intent Updates", val: HEALTH.intentUpdates.toLocaleString() },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">{row.label}</span>
                  <span className="text-[11px] font-mono text-zinc-300">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Signal Queue + Detail */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Signal Queue Header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ borderColor: "#1a1a1f", background: "#0c0c0e" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-300">Live Signal Queue</span>
              <span
                className="inline-flex items-center justify-center text-[10px] font-mono text-cyan-400 rounded px-1.5"
                style={{ background: "#22d3ee12", border: "1px solid #22d3ee25" }}
              >
                {filteredSignals.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: null, label: "All" },
                { key: "billable_opportunity", label: "Billable" },
                { key: "intent_update", label: "Intent" },
                { key: "watchlist", label: "Watch" },
              ].map((f) => (
                <button
                  key={String(f.key)}
                  onClick={() => setFilterDisposition(f.key)}
                  className="px-2 py-0.5 rounded text-[10px] transition-colors"
                  style={{
                    background: filterDisposition === f.key ? "#1d1d24" : "transparent",
                    border: filterDisposition === f.key ? "1px solid #2a2a35" : "1px solid transparent",
                    color: filterDisposition === f.key ? "#e4e4e7" : "#71717a",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List */}
          <div
            className="overflow-y-auto shrink-0 border-b"
            style={{ maxHeight: 210, borderColor: "#1a1a1f" }}
          >
            {filteredSignals.map((sig) => {
              const isSelected = selectedSignal.id === sig.id;
              const disp = dispositionLabel[sig.disposition] ?? { label: sig.disposition, color: "text-zinc-400" };
              return (
                <button
                  key={sig.id}
                  onClick={() => setSelectedSignal(sig)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b transition-colors"
                  style={{
                    borderColor: "#131318",
                    background: isSelected ? "#13131a" : "transparent",
                    borderLeft: isSelected ? "2px solid #22d3ee" : "2px solid transparent",
                  }}
                >
                  {/* Source Badge */}
                  <div
                    className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold"
                    style={{ background: "#161620", border: "1px solid #22222c", color: "#71717a" }}
                  >
                    {sourceIcon[sig.sourcePlatform] ?? "??"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-zinc-200"}`}>
                        {sig.company}
                      </span>
                      <DispositionBadge disposition={sig.disposition} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 truncate">{sig.contact.name} · {sig.source}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono ${scoreColor(sig.fitScore)}`}>{sig.fitScore}</span>
                      <span className="text-zinc-700 text-[10px]">/</span>
                      <span className={`text-[10px] font-mono ${scoreColor(sig.confidenceScore)}`}>{sig.confidenceScore}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600">{formatTime(sig.seenAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Signal Detail */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-white tracking-tight">{selectedSignal.company}</h2>
                  <DispositionBadge disposition={selectedSignal.disposition} />
                  {selectedSignal.dedupeStatus === "duplicate" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-amber-400" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      Duplicate
                    </span>
                  )}
                  {selectedSignal.crmStatus === "clean" && selectedSignal.dedupeStatus === "unique" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500" style={{ background: "rgba(113,113,122,0.1)", border: "1px solid rgba(113,113,122,0.2)" }}>
                      CRM Clean
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="text-zinc-300">{selectedSignal.contact.name}</span>
                  <span>·</span>
                  <span>{selectedSignal.contact.title}</span>
                  <span>·</span>
                  <span>{selectedSignal.source}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-600 mb-0.5">Seen</div>
                  <div className="text-[11px] text-zinc-400">{formatTime(selectedSignal.seenAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-600 mb-0.5">Verified</div>
                  <div className="text-[11px] text-zinc-400">{formatTime(selectedSignal.lastVerifiedAt)}</div>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded" style={{ background: "#0f0f13", border: "1px solid #1a1a22" }}>
                <ScoreBar value={selectedSignal.fitScore} label="Fit Score" />
              </div>
              <div className="p-3 rounded" style={{ background: "#0f0f13", border: "1px solid #1a1a22" }}>
                <ScoreBar value={selectedSignal.confidenceScore} label="Confidence" />
              </div>
              <div className="p-3 rounded" style={{ background: "#0f0f13", border: "1px solid #1a1a22" }}>
                <ScoreBar value={selectedSignal.freshnessScore} label="Freshness" />
              </div>
            </div>

            {/* Evidence */}
            <div className="mb-4 p-3 rounded" style={{ background: "#0c0c10", border: "1px solid #1a1a22" }}>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Source Evidence</div>
              <p className="text-sm text-zinc-300 leading-relaxed italic">&ldquo;{selectedSignal.evidenceSnippet}&rdquo;</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-zinc-600">via</span>
                <span className="text-[11px] text-cyan-500">{selectedSignal.sourceUrl}</span>
              </div>
            </div>

            {/* Why Now */}
            <div className="mb-4 p-3 rounded" style={{ background: "#0c0c10", border: "1px solid #1a1a22" }}>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Why Now</div>
              <p className="text-xs text-zinc-300">{selectedSignal.whyNow}</p>
            </div>

            {/* Routing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded" style={{ background: "#0f0f13", border: "1px solid #1a1a22" }}>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Recommended Channel</div>
                <div className="text-xs text-zinc-200">{selectedSignal.recommendedChannel}</div>
              </div>
              <div className="p-3 rounded" style={{ background: "#0f0f13", border: "1px solid #1a1a22" }}>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Owner</div>
                <div className="flex items-center gap-1.5">
                  <div className={`text-xs ${routed[selectedSignal.id] ? "text-emerald-400" : "text-zinc-500"}`}>
                    {routed[selectedSignal.id] ? selectedSignal.owner : "Unassigned"}
                  </div>
                  {routed[selectedSignal.id] && (
                    <span className="text-[10px] text-emerald-600">· Routed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Rail */}
        <aside
          className="flex flex-col shrink-0 border-l overflow-y-auto"
          style={{ width: 260, borderColor: "#1a1a1f", background: "#0c0c0e" }}
        >
          {/* Proof Timeline */}
          <div className="p-3 border-b" style={{ borderColor: "#1a1a1f" }}>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Proof Timeline</div>
            <div className="flex flex-col gap-0">
              {PROOF_STEPS.map((step, i) => {
                const done = proofDone(selectedSignal).has(step.key);
                const isLast = i === PROOF_STEPS.length - 1;
                return (
                  <div key={step.key} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: done ? "rgba(52,211,153,0.15)" : "#131318",
                          border: done ? "1px solid rgba(52,211,153,0.4)" : "1px solid #1f1f28",
                        }}
                      >
                        {done && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                      {!isLast && (
                        <div
                          className="w-px flex-1 my-0.5"
                          style={{ minHeight: 14, background: done ? "rgba(52,211,153,0.2)" : "#1a1a22" }}
                        />
                      )}
                    </div>
                    <div className="pb-2.5">
                      <span className={`text-[11px] ${done ? "text-zinc-300" : "text-zinc-600"}`}>{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 border-b" style={{ borderColor: "#1a1a1f" }}>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Actions</div>
            <div className="flex flex-col gap-1.5">
              <button
                className="w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left"
                style={{ background: "#0f1a14", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}
                onClick={handleAssign}
              >
                {routed[selectedSignal.id] ? "Re-route to Owner" : "Route to Owner"}
              </button>
              <button
                className="w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left"
                style={{ background: "#0f1318", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
              >
                Start Outreach
              </button>
              <button
                className="w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left"
                style={{ background: "#111113", border: "1px solid #1f1f28", color: "#a1a1aa" }}
              >
                View Source
              </button>
              <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                <button
                  className="px-2 py-1.5 rounded text-[10px] font-medium text-center"
                  style={{ background: "#111113", border: "1px solid #1f1f28", color: "#71717a" }}
                  onClick={() => handleFeedback("duplicate")}
                >
                  Mark Duplicate
                </button>
                <button
                  className="px-2 py-1.5 rounded text-[10px] font-medium text-center"
                  style={{ background: "#111113", border: "1px solid #1f1f28", color: "#71717a" }}
                  onClick={() => handleFeedback("outdated")}
                >
                  Mark Outdated
                </button>
                <button
                  className="px-2 py-1.5 rounded text-[10px] font-medium text-center col-span-2"
                  style={{ background: "#111113", border: "1px solid #1f1f28", color: "#71717a" }}
                  onClick={() => handleFeedback("better_contact")}
                >
                  Better Contact
                </button>
              </div>
              {feedbackSent[selectedSignal.id] && (
                <div
                  className="mt-1 px-2 py-1.5 rounded text-[10px] text-center text-zinc-400"
                  style={{ background: "#0f0f13", border: "1px solid #1a1a22" }}
                >
                  Feedback sent · {feedbackSent[selectedSignal.id].replace("_", " ")}
                </div>
              )}
            </div>
          </div>

          {/* Source Yield by Channel */}
          <div className="p-3 border-b" style={{ borderColor: "#1a1a1f" }}>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Source Yield</div>
            {HEALTH.sources.map((src) => (
              <div key={src.name} className="mb-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-500">{src.name}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{src.yield}%</span>
                </div>
                <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "#1a1a22" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${src.yield}%`,
                      background: src.status === "healthy" ? "#34d399" : src.status === "degraded" ? "#fbbf24" : "#f87171",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Diagnostics */}
          <div className="p-3">
            <button
              className="flex items-center justify-between w-full mb-2"
              onClick={() => setDiagOpen(!diagOpen)}
            >
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Diagnostics</span>
              <span className="text-zinc-600 text-[10px]">{diagOpen ? "▲" : "▼"}</span>
            </button>
            {diagOpen && (
              <div className="flex flex-col gap-2 p-2 rounded" style={{ background: "#0a0a0c", border: "1px solid #16161e" }}>
                {[
                  { label: "Model Path", val: selectedSignal.modelPath },
                  { label: "Raw Source", val: selectedSignal.rawSource },
                  { label: "Infra Cost", val: "$0.0024" },
                  { label: "Latency", val: "142ms" },
                  { label: "Token Budget", val: "OK" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-[10px] text-zinc-600">{row.label}</span>
                    <span className="text-[10px] font-mono text-zinc-400">{row.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
