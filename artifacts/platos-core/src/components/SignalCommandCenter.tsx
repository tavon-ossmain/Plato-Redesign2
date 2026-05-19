/**
 * Plato's Core — Signal Command Center
 * Graduated from mockup: real API hooks, no sim toggles.
 *
 * Mobile UX:
 * - Screen 1: Signal list with filter tabs, disposition badges, routed indicators
 * - Screen 2: Full-screen signal detail with Route / Mark As / View Source actions
 *
 * Desktop UX: 3-column command center layout.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWorkspaceDashboard,
  useGetWorkspacePipeline,
  useAssignOpportunity,
  useSubmitFeedback,
  getGetWorkspacePipelineQueryKey,
} from "@workspace/api-client-react";

// ── Design tokens ───────────────────────────────────────────────
const C        = "#06d0e4";
const C_DIM    = "rgba(6,208,228,0.10)";
const C_MED    = "rgba(6,208,228,0.18)";
const C_EDGE   = "rgba(6,208,228,0.24)";
const C_STRONG = "rgba(6,208,228,0.40)";

const BG_PAGE  = "#09090f";
const BG_RAIL  = "#0a0a13";
const BG_BAR   = "#0b0b15";
const BG_CARD  = "#0d0d18";
const BG_INSET = "#0b0b14";

const BORDER      = "#15152050";
const BORDER_CARD = "#18182a";
const LABEL_COLOR = "#52526a";
const R = 6;

// ── Static data ─────────────────────────────────────────────────
const PROOF_STEPS = [
  { key: "captured", label: "Signal captured" },
  { key: "verified", label: "Source verified" },
  { key: "crm",      label: "CRM / dedupe checked" },
  { key: "model",    label: "Model path chosen" },
  { key: "routed",   label: "Routed to owner" },
  { key: "feedback", label: "Feedback received" },
];

const dispositionMeta: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  billable_opportunity: {
    label: "Billable Opportunity",
    bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", text: "#34d399", dot: "#34d399",
  },
  intent_update: {
    label: "Intent Update",
    bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.25)", text: "#22d3ee", dot: "#22d3ee",
  },
  watchlist: {
    label: "Watchlist",
    bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", text: "#fbbf24", dot: "#fbbf24",
  },
  suppressed: {
    label: "Suppressed",
    bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.25)", text: "#71717a", dot: "#71717a",
  },
};

const statusDot: Record<string, string> = {
  healthy: "#34d399",
  degraded: "#fbbf24",
  error: "#f87171",
};

// ── Utilities ───────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const BADGE_PALETTES = [
  { bg: C_MED,                         text: C         },
  { bg: "rgba(52,211,153,0.16)",       text: "#34d399" },
  { bg: "rgba(139,92,246,0.16)",       text: "#a78bfa" },
  { bg: "rgba(251,191,36,0.16)",       text: "#fbbf24" },
  { bg: "rgba(248,113,113,0.16)",      text: "#f87171" },
];
function badgePalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return BADGE_PALETTES[h % BADGE_PALETTES.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function scoreColor(n: number) {
  if (n >= 85) return "#34d399";
  if (n >= 70) return "#22d3ee";
  if (n >= 55) return "#fbbf24";
  return "#f87171";
}

// ── API signal type ─────────────────────────────────────────────
interface Signal {
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
  feedback?: string | null;
}

// ── Sub-components ──────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: LABEL_COLOR, letterSpacing: "0.13em" }}>
      {children}
    </div>
  );
}

function PlatosLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V18h8v-2.9c1.8-1.4 3-3.6 3-6.1C19 5 16 2 12 2z" fill={C} opacity="0.85" />
      <path d="M9 18h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" fill={C} opacity="0.5" />
      <path d="M3 9h2M19 9h2" stroke={C} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function CompanyBadge({ name, size = 28 }: { name: string; size?: number }) {
  const p = badgePalette(name);
  return (
    <div
      className="shrink-0 flex items-center justify-center font-bold"
      style={{
        width: size, height: size,
        background: p.bg,
        border: `1px solid ${p.text}28`,
        color: p.text,
        borderRadius: R,
        fontSize: size > 28 ? 12 : 10,
        letterSpacing: "0.02em",
      }}
    >
      {initials(name)}
    </div>
  );
}

function DispositionPill({ d }: { d: string }) {
  const m = dispositionMeta[d] ?? dispositionMeta.suppressed;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium"
      style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text, borderRadius: 4, lineHeight: "1.5" }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function ScoreKPI({ value, label }: { value: number; label: string }) {
  const c = scoreColor(value);
  return (
    <div className="flex flex-col items-center py-4" style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
      <span className="text-[32px] font-bold tabular-nums leading-none mb-1.5" style={{ color: c }}>{value}</span>
      <span className="text-[9px] uppercase tracking-widest" style={{ color: LABEL_COLOR }}>{label}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#0e0e1c" }}>
      <div className="w-7 h-7 rounded shrink-0" style={{ background: "#111120", borderRadius: R }} />
      <div className="flex-1">
        <div className="h-2.5 w-32 rounded mb-2" style={{ background: "#111120" }} />
        <div className="h-2 w-24 rounded" style={{ background: "#0d0d18" }} />
      </div>
      <div className="flex gap-1.5">
        <div className="h-2.5 w-6 rounded" style={{ background: "#111120" }} />
        <div className="h-2.5 w-6 rounded" style={{ background: "#111120" }} />
      </div>
    </div>
  );
}

function ProofStrip({ done }: { done: Set<string> }) {
  return (
    <div className="flex items-center gap-1.5">
      {PROOF_STEPS.map((step, i) => {
        const isDone = done.has(step.key);
        const isNext = !isDone && PROOF_STEPS.slice(0, i).every((s) => done.has(s.key));
        return (
          <div key={step.key} className="relative group flex-1">
            <div className="flex items-center">
              <div className="w-full h-[3px] rounded-full transition-colors"
                style={{ background: isDone ? C : isNext ? `${C}30` : "#15152a" }} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: isDone ? C : isNext ? "#1c1c2e" : "#10101c",
                border: `1px solid ${isDone ? C : isNext ? `${C}40` : "#1c1c2e"}`,
                boxShadow: isDone ? `0 0 5px ${C}60` : "none",
              }} />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
              style={{ background: "#0d0d18", border: `1px solid ${BORDER_CARD}`, color: isDone ? "#d4d4d8" : LABEL_COLOR }}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mobile: Detail screen ───────────────────────────────────────
function MobileDetail({
  sig, isRouted, feedbackKey, done,
  onRoute, onFeedback, onBack, isAssigning,
}: {
  sig: Signal;
  isRouted: boolean;
  feedbackKey: string | null;
  done: Set<string>;
  onRoute: () => void;
  onFeedback: (key: string) => void;
  onBack: () => void;
  isAssigning: boolean;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: BG_PAGE }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: BORDER, background: BG_BAR }}>
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{sig.company}</div>
          <div className="text-[10px] text-zinc-600">{sig.contact.name} · {sig.source}</div>
        </div>
        <CompanyBadge name={sig.company} size={32} />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <DispositionPill d={sig.disposition} />
            {isRouted && (
              <span className="text-[11px] px-2 py-0.5 font-medium"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 4 }}>
                → {sig.owner.split(" ")[0]}
              </span>
            )}
            <span className="text-xs font-medium" style={{ color: C }}>{sig.contact.name}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{sig.contact.title}</span>
          </div>

          <div className="mb-3 p-4"
            style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderLeft: `3px solid ${C}45`, borderRadius: R }}>
            <SectionLabel>Source Evidence · {sig.source}</SectionLabel>
            <p className="text-sm text-zinc-200 leading-relaxed italic mb-3">
              &ldquo;{sig.evidenceSnippet}&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-3 border-t text-[10px]" style={{ borderColor: BORDER_CARD }}>
              <span className="text-zinc-700">Seen {formatTime(sig.seenAt)}</span>
              <span className="text-zinc-800">·</span>
              <span className="truncate" style={{ color: C, opacity: 0.65 }}>{sig.sourceUrl}</span>
            </div>
          </div>

          <div className="mb-4 p-3.5"
            style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
            <SectionLabel>Why Now</SectionLabel>
            <p className="text-sm text-zinc-300 leading-relaxed">{sig.whyNow}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <ScoreKPI value={sig.fitScore}        label="Fit"        />
            <ScoreKPI value={sig.confidenceScore} label="Confidence" />
            <ScoreKPI value={sig.freshnessScore}  label="Freshness"  />
          </div>

          <div className="mb-4 p-3.5" style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Proof</SectionLabel>
              <span className="text-[9px] font-mono" style={{ color: LABEL_COLOR }}>
                {PROOF_STEPS.filter((s) => done.has(s.key)).length}/{PROOF_STEPS.length}
              </span>
            </div>
            <ProofStrip done={done} />
          </div>

          <div className="mb-4">
            <SectionLabel>Mark As</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "duplicate",      label: "Duplicate"      },
                { key: "outdated",       label: "Outdated"       },
                { key: "better_contact", label: "Better Contact" },
                { key: "watchlist",      label: "Watchlist"      },
              ].map((item) => {
                const isActive = feedbackKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onFeedback(item.key)}
                    className="px-3 py-3 text-sm font-medium text-left transition-colors"
                    style={{
                      background: isActive ? "#141422" : BG_CARD,
                      border: isActive ? "1px solid #252538" : `1px solid ${BORDER_CARD}`,
                      color: isActive ? "#a1a1aa" : LABEL_COLOR,
                      borderRadius: R,
                    }}
                  >
                    {isActive && <span className="mr-2" style={{ color: "#34d399" }}>✓</span>}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {feedbackKey && (
              <div className="mt-2 px-3 py-2 text-[10px] text-zinc-600 text-center"
                style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                Feedback sent · {feedbackKey.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: BORDER, background: BG_BAR }}>
        <button
          onClick={onRoute}
          disabled={isAssigning}
          className="w-full py-3.5 text-sm font-semibold mb-2 transition-all"
          style={{
            background: isRouted ? C_DIM : C_MED,
            border: `1px solid ${isRouted ? C_EDGE : C_STRONG}`,
            color: C,
            borderRadius: R,
            opacity: isAssigning ? 0.6 : 1,
          }}
        >
          {isRouted ? <><span style={{ opacity: 0.45, marginRight: 8 }}>✓</span>Re-route to Owner</> : "Route to Owner →"}
        </button>
        <div className="flex gap-2">
          <button className="flex-1 py-3 text-sm font-medium"
            style={{ background: C_DIM, border: `1px solid ${C_EDGE}`, color: C, borderRadius: R, opacity: 0.75 }}>
            Start Outreach
          </button>
          <a
            href={sig.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 text-sm font-medium text-center"
            style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: "#71717a", borderRadius: R }}>
            View Source
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Mobile: List screen ─────────────────────────────────────────
function MobileList({
  signals, isLoading, isError, filter, filters,
  routedMap, onSelect, onFilter,
}: {
  signals: Signal[];
  isLoading: boolean;
  isError: boolean;
  filter: string | null;
  filters: { key: string | null; label: string; count: number }[];
  routedMap: Record<string, boolean>;
  onSelect: (s: Signal) => void;
  onFilter: (k: string | null) => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: BG_PAGE }}>
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 border-b overflow-x-auto"
        style={{ borderColor: BORDER, background: BG_BAR }}>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shrink-0 mr-1"
          style={{ background: C_DIM, border: `1px solid ${C_EDGE}`, color: C, borderRadius: 4 }}
        >
          <span style={{ fontSize: 7 }}>●</span>
          Feed
        </div>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={String(f.key)}
              onClick={() => onFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs shrink-0 transition-colors"
              style={{
                background: active ? "#1c1c2e" : "transparent",
                border: active ? "1px solid #28283e" : "1px solid transparent",
                color: active ? "#d4d4d8" : LABEL_COLOR,
                borderRadius: 4,
              }}
            >
              {f.label}
              <span className="text-[9px] font-mono px-1 rounded"
                style={{
                  background: active ? "#28283e" : "#111120",
                  color: active ? "#a1a1aa" : "#38384e",
                  minWidth: 16, textAlign: "center",
                }}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="text-red-400 text-lg mb-3">⚠</div>
            <div className="text-sm font-medium text-red-400 mb-1">Could not load signals</div>
            <div className="text-xs text-zinc-700 text-center">Check API connectivity and retry.</div>
          </div>
        )}

        {!isLoading && !isError && signals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#111120", border: `1px solid ${BORDER_CARD}` }}>
              <span className="text-zinc-600 text-lg">○</span>
            </div>
            <div className="text-sm font-medium text-zinc-500 mb-1">No signals in queue</div>
            <div className="text-xs text-zinc-700 text-center">
              {filter ? "Try a different filter." : "New signals will appear here as they're verified."}
            </div>
          </div>
        )}

        {!isLoading && !isError && signals.map((sig) => {
          const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
          const isRouted = routedMap[sig.id] ?? sig.route === "routed";
          return (
            <button
              key={sig.id}
              onClick={() => onSelect(sig)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left border-b active:opacity-70 transition-opacity"
              style={{ borderColor: "#0e0e1c" }}
            >
              <CompanyBadge name={sig.company} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{sig.company}</span>
                  {isRouted && (
                    <span className="text-[10px] px-1.5 py-0.5 shrink-0"
                      style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", color: "#34d399", borderRadius: 4 }}>
                      → {sig.owner.split(" ")[0]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium" style={{ color: m.text }}>{m.label}</span>
                  <span className="text-zinc-700 text-[10px]">·</span>
                  <span className="text-[11px] text-zinc-500 truncate">{sig.contact.name}</span>
                </div>
                <div className="text-[10px] text-zinc-700 mt-0.5">{formatTime(sig.seenAt)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore) }}>{sig.fitScore}</span>
                  <span className="text-zinc-700 text-[10px]">·</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore) }}>{sig.confidenceScore}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38384e" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
const WORKSPACE_ID = "ws-1";

export function SignalCommandCenter() {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useGetWorkspaceDashboard(WORKSPACE_ID);
  const { data: rawSignals, isLoading: pipelineLoading, isError: pipelineError } = useGetWorkspacePipeline(WORKSPACE_ID);

  const assignMutation    = useAssignOpportunity();
  const feedbackMutation  = useSubmitFeedback();

  // Optimistic overrides
  const [routedOverrides,   setRoutedOverrides]   = useState<Record<string, boolean>>({});
  const [feedbackOverrides, setFeedbackOverrides] = useState<Record<string, string>>({});
  const [filter,            setFilter]            = useState<string | null>(null);
  const [mobileDetail,      setMobileDetail]      = useState<Signal | null>(null);

  const signals: Signal[] = (rawSignals as Signal[] | undefined) ?? [];
  const allSignals  = filter ? signals.filter((s) => s.disposition === filter) : signals;
  const [selected, setSelected] = useState<Signal | null>(null);
  const activeSig   = mobileDetail ?? selected ?? signals[0] ?? null;

  function countByDisp(key: string) {
    return signals.filter((s) => s.disposition === key).length;
  }

  const FILTERS = [
    { key: null,                   label: "All",     count: signals.length },
    { key: "billable_opportunity", label: "Billable", count: countByDisp("billable_opportunity") },
    { key: "intent_update",        label: "Intent",  count: countByDisp("intent_update") },
    { key: "watchlist",            label: "Watch",   count: countByDisp("watchlist") },
  ];

  function getIsRouted(sig: Signal) {
    return routedOverrides[sig.id] ?? sig.route === "routed";
  }
  function getFeedbackKey(sig: Signal): string | null {
    return feedbackOverrides[sig.id] ?? sig.feedback ?? null;
  }

  function handleRoute(sig: Signal) {
    setRoutedOverrides((p) => ({ ...p, [sig.id]: true }));
    assignMutation.mutate(
      { workspaceId: WORKSPACE_ID, opportunityId: sig.id, data: { owner: sig.owner } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWorkspacePipelineQueryKey(WORKSPACE_ID) }) },
    );
  }

  function handleFeedback(sig: Signal, key: string) {
    setFeedbackOverrides((p) => ({ ...p, [sig.id]: key }));
    feedbackMutation.mutate(
      { data: { signalId: sig.id, workspaceId: WORKSPACE_ID, feedback: key } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWorkspacePipelineQueryKey(WORKSPACE_ID) }) },
    );
  }

  function getDoneSet(sig: Signal | null): Set<string> {
    if (!sig) return new Set(["captured", "verified", "crm", "model"]);
    const d = new Set<string>(["captured", "verified", "crm", "model"]);
    if (getIsRouted(sig)) d.add("routed");
    if (getFeedbackKey(sig)) d.add("feedback");
    return d;
  }

  const ws = { name: "Acme Corp", quota: dashboard?.quota ?? 200, used: dashboard?.used ?? 0 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: BG_PAGE, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ════════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on md+)
      ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col h-full md:hidden">
        <header className="flex items-center justify-between px-4 shrink-0 border-b"
          style={{ height: 48, borderColor: BORDER, background: BG_BAR }}>
          <div className="flex items-center gap-2">
            <PlatosLogo />
            <span className="text-white font-bold text-sm">Plato's</span>
            {mobileDetail && (
              <>
                <span className="text-zinc-700 mx-1 text-sm">/</span>
                <span className="text-zinc-500 text-sm truncate max-w-[140px]">{mobileDetail.company}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: C, boxShadow: `0 0 6px ${C}` }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C }}>Live</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ml-1"
              style={{ background: C_DIM, border: `1px solid ${C_EDGE}` }}>
              AR
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          {mobileDetail ? (
            <MobileDetail
              sig={mobileDetail}
              isRouted={getIsRouted(mobileDetail)}
              feedbackKey={getFeedbackKey(mobileDetail)}
              done={getDoneSet(mobileDetail)}
              onRoute={() => handleRoute(mobileDetail)}
              onFeedback={(key) => handleFeedback(mobileDetail, key)}
              onBack={() => setMobileDetail(null)}
              isAssigning={assignMutation.isPending}
            />
          ) : (
            <MobileList
              signals={allSignals}
              isLoading={pipelineLoading}
              isError={pipelineError}
              filter={filter}
              filters={FILTERS}
              routedMap={routedOverrides}
              onSelect={(sig) => { setSelected(sig); setMobileDetail(sig); }}
              onFilter={setFilter}
            />
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden on <md)
      ════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col h-full">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 shrink-0 border-b"
          style={{ height: 44, borderColor: BORDER, background: BG_BAR }}>
          <div className="flex items-center gap-2.5">
            <PlatosLogo />
            <span className="text-white font-bold text-sm tracking-tight">Plato's</span>
            <span className="text-zinc-700 mx-1.5 text-sm">/</span>
            <span className="text-zinc-400 text-sm">Signal Command Center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: C, boxShadow: `0 0 6px ${C}` }} />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C }}>Live</span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ml-1"
              style={{ background: C_DIM, border: `1px solid ${C_EDGE}` }}>
              AR
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">

          {/* Left Rail */}
          <aside className="flex flex-col shrink-0 border-r overflow-y-auto"
            style={{ width: 196, borderColor: BORDER, background: BG_RAIL }}>
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
              <SectionLabel>Workspace</SectionLabel>
              <div className="text-sm font-semibold text-white leading-tight">{ws.name}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">Growth plan</div>
            </div>
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
              <SectionLabel>Weekly Quota</SectionLabel>
              <div className="flex items-baseline gap-1.5 mb-2.5">
                <span className="text-[28px] font-bold text-white tabular-nums leading-none">{ws.used}</span>
                <span className="text-xs text-zinc-600">/ {ws.quota}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "#181830" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${quotaPct}%`, background: quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : C }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-zinc-600">{quotaPct}% used</span>
                <span className="text-[10px] text-zinc-600">{ws.quota - ws.used} left</span>
              </div>
            </div>
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
              <SectionLabel>Source Health</SectionLabel>
              {dashLoading
                ? <div className="h-2 w-24 rounded" style={{ background: "#111120" }} />
                : (dashboard?.sources ?? []).map((s) => (
                    <div key={s.name} className="flex items-center justify-between mb-2.5 last:mb-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[s.status] ?? "#71717a" }} />
                        <span className="text-[11px] text-zinc-400">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">{s.yield}%</span>
                    </div>
                  ))
              }
            </div>
            <div className="px-4 py-4">
              <SectionLabel>Signal Health</SectionLabel>
              {[
                { label: "Billable Opps",    val: dashboard?.billableOpportunities?.toString() ?? "—",   hi: true  },
                { label: "Intent Updates",   val: dashboard?.intentUpdates?.toString() ?? "—",            hi: false },
                { label: "Dupes Suppressed", val: dashboard?.duplicatesSuppressed?.toString() ?? "—",    hi: false },
                { label: "Raw Scanned",      val: dashboard?.rawScanned?.toLocaleString() ?? "—",        hi: false },
              ].map((row) => (
                <div key={row.label} className="flex justify-between mb-2.5 last:mb-0">
                  <span className="text-[10px] text-zinc-600">{row.label}</span>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: row.hi ? "#e4e4e7" : "#52525b" }}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          {/* Center */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
            {/* Queue header + filter tabs */}
            <div className="border-b shrink-0" style={{ borderColor: BORDER, background: BG_RAIL }}>
              <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: BORDER_CARD }}>
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: C_DIM, border: `1px solid ${C_EDGE}`, color: C, borderRadius: 4 }}>
                  <span style={{ fontSize: 7 }}>●</span>
                  Signal Feed
                </div>
                <span className="text-[9px] uppercase tracking-widest" style={{ color: LABEL_COLOR }}>
                  Detected · Verified · Routed
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                      <button key={String(f.key)} onClick={() => setFilter(f.key)}
                        className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] transition-colors"
                        style={{
                          background: active ? "#1c1c2e" : "transparent",
                          border: active ? "1px solid #28283e" : "1px solid transparent",
                          color: active ? "#d4d4d8" : LABEL_COLOR,
                          borderRadius: 4,
                        }}>
                        {f.label}
                        <span className="text-[9px] font-mono px-1 rounded"
                          style={{
                            background: active ? "#28283e" : "#111120",
                            color: active ? "#a1a1aa" : "#38384e",
                            minWidth: 16, textAlign: "center",
                          }}>
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Queue rows */}
              <div className="overflow-y-auto" style={{ maxHeight: 172 }}>
                {pipelineLoading && <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}
                {!pipelineLoading && pipelineError && (
                  <div className="flex flex-col items-center justify-center py-6 px-4">
                    <div className="text-red-400 text-sm mb-2">⚠ Could not load signals</div>
                    <div className="text-[10px] text-zinc-700">Check API connectivity and retry.</div>
                  </div>
                )}
                {!pipelineLoading && !pipelineError && allSignals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "#111120", border: `1px solid ${BORDER_CARD}` }}>
                      <span className="text-zinc-600 text-sm">○</span>
                    </div>
                    <div className="text-xs font-medium text-zinc-500 mb-1">No signals in queue</div>
                    <div className="text-[10px] text-zinc-700 text-center max-w-48">
                      {filter ? "Try a different filter or check source health." : "New high-intent signals will appear here as they're verified."}
                    </div>
                  </div>
                )}
                {!pipelineLoading && !pipelineError && allSignals.map((sig) => {
                  const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
                  const isActive = (selected ?? signals[0])?.id === sig.id;
                  const isRouted = getIsRouted(sig);
                  return (
                    <button key={sig.id} onClick={() => setSelected(sig)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b transition-all"
                      style={{
                        borderColor: "#0e0e1c",
                        background: isActive ? "#10101e" : "transparent",
                        borderLeft: `2px solid ${isActive ? C : "transparent"}`,
                        boxShadow: isActive ? `inset 2px 0 12px ${C_DIM}` : "none",
                      }}>
                      <CompanyBadge name={sig.company} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-zinc-200"}`}>
                            {sig.company}
                          </span>
                          <span className="text-[10px] font-medium shrink-0" style={{ color: m.text }}>{m.label}</span>
                          {isRouted && (
                            <span className="text-[9px] px-1.5 py-0.5 shrink-0"
                              style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", color: "#34d399", borderRadius: 4 }}>
                              → {sig.owner.split(" ")[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-600 block truncate">
                          {sig.contact.name} · {sig.source} · {formatTime(sig.seenAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore) }}>{sig.fitScore}</span>
                        <span className="text-zinc-700 text-[10px]">·</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore) }}>{sig.confidenceScore}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signal detail panel */}
            {activeSig && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <CompanyBadge name={activeSig.company} size={36} />
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1.5">{activeSig.company}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DispositionPill d={activeSig.disposition} />
                        {activeSig.dedupeStatus === "duplicate" && (
                          <span className="text-[10px] px-2 py-0.5 font-medium"
                            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.22)", color: "#fbbf24", borderRadius: 4 }}>
                            Duplicate
                          </span>
                        )}
                        {activeSig.crmStatus === "clean" && activeSig.dedupeStatus === "unique" && (
                          <span className="text-[10px] px-2 py-0.5"
                            style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: LABEL_COLOR, borderRadius: 4 }}>
                            CRM Clean
                          </span>
                        )}
                        <span className="text-xs font-medium" style={{ color: C }}>{activeSig.contact.name}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-500">{activeSig.contact.title}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-500">{activeSig.source}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 p-4"
                    style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderLeft: `3px solid ${C}45`, borderRadius: R }}>
                    <SectionLabel>Source Evidence · {activeSig.source}</SectionLabel>
                    <p className="text-sm text-zinc-200 leading-relaxed italic mb-3">&ldquo;{activeSig.evidenceSnippet}&rdquo;</p>
                    <div className="flex items-center gap-2 pt-3 border-t text-[10px]" style={{ borderColor: BORDER_CARD }}>
                      <span className="text-zinc-700">Seen {formatTime(activeSig.seenAt)}</span>
                      <span className="text-zinc-800">·</span>
                      <span className="text-zinc-700">Verified {formatTime(activeSig.lastVerifiedAt)}</span>
                      <span className="text-zinc-800">·</span>
                      <span className="truncate" style={{ color: C, opacity: 0.65 }}>{activeSig.sourceUrl}</span>
                    </div>
                  </div>

                  <div className="mb-4 p-3.5"
                    style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                    <SectionLabel>Why Now</SectionLabel>
                    <p className="text-xs text-zinc-300 leading-relaxed">{activeSig.whyNow}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <ScoreKPI value={activeSig.fitScore}        label="Fit Score"  />
                    <ScoreKPI value={activeSig.confidenceScore} label="Confidence" />
                    <ScoreKPI value={activeSig.freshnessScore}  label="Freshness"  />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3" style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                      <SectionLabel>Recommended Channel</SectionLabel>
                      <div className="text-xs text-zinc-300">{activeSig.recommendedChannel}</div>
                    </div>
                    <div className="p-3" style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                      <SectionLabel>Owner</SectionLabel>
                      <div className="text-xs font-medium" style={{ color: getIsRouted(activeSig) ? "#34d399" : "#52525b" }}>
                        {getIsRouted(activeSig) ? activeSig.owner : "Unassigned"}
                        {getIsRouted(activeSig) && <span className="font-normal" style={{ color: "#34d39970" }}> · Routed</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Rail */}
          <aside className="flex flex-col shrink-0 border-l overflow-y-auto"
            style={{ width: 256, borderColor: BORDER, background: BG_RAIL }}>
            {/* Primary actions */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
              <button
                onClick={() => activeSig && handleRoute(activeSig)}
                disabled={!activeSig || assignMutation.isPending}
                className="w-full px-4 py-3 text-sm font-semibold text-left transition-all mb-2"
                style={{
                  background: activeSig && getIsRouted(activeSig) ? C_DIM : C_MED,
                  border: `1px solid ${activeSig && getIsRouted(activeSig) ? C_EDGE : C_STRONG}`,
                  color: C,
                  borderRadius: R,
                  opacity: !activeSig || assignMutation.isPending ? 0.6 : 1,
                }}>
                {activeSig && getIsRouted(activeSig)
                  ? <><span style={{ opacity: 0.45, marginRight: 8 }}>✓</span>Re-route to Owner</>
                  : "Route to Owner →"}
              </button>
              <div className="flex gap-1.5">
                <button className="flex-1 px-3 py-2 text-xs font-medium text-left"
                  style={{ background: "rgba(6,208,228,0.05)", border: `1px solid ${C_EDGE}`, color: C, borderRadius: R, opacity: 0.75 }}>
                  Start Outreach
                </button>
                {activeSig ? (
                  <a
                    href={activeSig.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-xs font-medium text-center"
                    style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: "#71717a", borderRadius: R }}>
                    View Source
                  </a>
                ) : (
                  <button className="flex-1 px-3 py-2 text-xs font-medium text-left"
                    style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: "#71717a", borderRadius: R }}>
                    View Source
                  </button>
                )}
              </div>
            </div>

            {/* Proof strip */}
            <div className="px-4 py-3 border-b" style={{ borderColor: BORDER_CARD }}>
              <div className="flex items-center justify-between mb-2.5">
                <SectionLabel>Proof</SectionLabel>
                <span className="text-[9px] font-mono" style={{ color: LABEL_COLOR }}>
                  {activeSig ? PROOF_STEPS.filter((s) => getDoneSet(activeSig).has(s.key)).length : 4}/{PROOF_STEPS.length}
                </span>
              </div>
              <ProofStrip done={getDoneSet(activeSig)} />
            </div>

            {/* Mark As */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
              <SectionLabel>Mark As</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {[
                  { key: "duplicate",      label: "Duplicate"      },
                  { key: "outdated",       label: "Outdated"       },
                  { key: "better_contact", label: "Better Contact" },
                  { key: "watchlist",      label: "Watchlist"      },
                ].map((item) => {
                  const isActive = activeSig ? getFeedbackKey(activeSig) === item.key : false;
                  return (
                    <button key={item.key}
                      onClick={() => activeSig && handleFeedback(activeSig, item.key)}
                      disabled={!activeSig}
                      className="w-full px-3 py-2 text-xs font-medium text-left transition-colors"
                      style={{
                        background: isActive ? "#141422" : BG_CARD,
                        border: isActive ? "1px solid #252538" : `1px solid ${BORDER_CARD}`,
                        color: isActive ? "#a1a1aa" : LABEL_COLOR,
                        borderRadius: R,
                      }}>
                      {isActive && <span className="mr-2" style={{ color: "#34d399" }}>✓</span>}
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {activeSig && getFeedbackKey(activeSig) && (
                <div className="mt-2.5 px-3 py-2 text-[10px] text-zinc-600 text-center"
                  style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                  Feedback sent · {getFeedbackKey(activeSig)!.replace(/_/g, " ")}
                </div>
              )}
            </div>

            {/* Source Yield */}
            <div className="px-4 py-4">
              <SectionLabel>Source Yield</SectionLabel>
              {dashLoading
                ? <div className="h-2 w-full rounded" style={{ background: "#111120" }} />
                : (dashboard?.sources ?? []).map((src) => (
                    <div key={src.name} className="mb-3 last:mb-0">
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[src.status] ?? "#71717a" }} />
                          <span className="text-[10px] text-zinc-500">{src.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600">{src.yield}%</span>
                      </div>
                      <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "#15152a" }}>
                        <div className="h-full rounded-full" style={{ width: `${src.yield}%`, background: statusDot[src.status] ?? "#71717a" }} />
                      </div>
                    </div>
                  ))
              }
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
