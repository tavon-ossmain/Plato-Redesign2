/**
 * Plato's Core — Signal Command Center
 * Responsive: desktop 3-col command center + mobile 2-screen triage flow.
 *
 * Mobile UX:
 * - Screen 1: Signal list with filter tabs, disposition badges, routed indicators
 * - Screen 2: Full-screen signal detail with Route / Mark As / View Source actions
 * - Back chevron returns to list
 * - Sticky action bar at bottom of detail for one-thumb reach
 *
 * Desktop UX: unchanged 3-column layout.
 */

import { useState } from "react";
import {
  MOCK_SIGNALS,
  HEALTH,
  PROOF_STEPS,
  dispositionMeta,
  statusDot,
  formatTime,
  scoreColor,
} from "./_data";

type Signal = typeof MOCK_SIGNALS[0];

// ── Design tokens ──────────────────────────────────────────────
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
const LABEL_COLOR = "#38384e";
const R = 6;

// ── Utilities ──────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const BADGE_PALETTES = [
  { bg: C_MED,                          text: C         },
  { bg: "rgba(52,211,153,0.16)",        text: "#34d399" },
  { bg: "rgba(139,92,246,0.16)",        text: "#a78bfa" },
  { bg: "rgba(251,191,36,0.16)",        text: "#fbbf24" },
  { bg: "rgba(248,113,113,0.16)",       text: "#f87171" },
];
function badgePalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return BADGE_PALETTES[h % BADGE_PALETTES.length];
}

function countByDisposition(key: string) {
  return MOCK_SIGNALS.filter((s) => s.disposition === key).length;
}

// ── Shared sub-components ──────────────────────────────────────
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

// ── Proof strip (shared desktop + mobile) ─────────────────────
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

// ── Mobile: Signal Detail screen ───────────────────────────────
function MobileDetail({
  sig, routed, feedback, done,
  onRoute, onFeedback, onBack, simError,
}: {
  sig: Signal;
  routed: Record<string, boolean>;
  feedback: Record<string, string>;
  done: Set<string>;
  onRoute: () => void;
  onFeedback: (key: string) => void;
  onBack: () => void;
  simError: boolean;
}) {
  const isRouted = routed[sig.id];

  return (
    <div className="flex flex-col h-full" style={{ background: BG_PAGE }}>
      {/* Mobile detail header */}
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">

          {/* Error state */}
          {simError && (
            <div className="mb-4 px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: R }}>
              <span className="text-red-400">⚠</span>
              <div className="flex-1">
                <div className="text-xs font-medium text-red-400">Signal data unavailable</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">Check API connectivity and retry.</div>
              </div>
              <button className="text-[10px] px-2.5 py-1 font-medium"
                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: 4 }}>
                Retry
              </button>
            </div>
          )}

          {/* Disposition + contact */}
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

          {/* Evidence — hero */}
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

          {/* Why Now */}
          <div className="mb-4 p-3.5"
            style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
            <SectionLabel>Why Now</SectionLabel>
            <p className="text-sm text-zinc-300 leading-relaxed">{sig.whyNow}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <ScoreKPI value={sig.fitScore}        label="Fit"        />
            <ScoreKPI value={sig.confidenceScore} label="Confidence" />
            <ScoreKPI value={sig.freshnessScore}  label="Freshness"  />
          </div>

          {/* Proof strip */}
          <div className="mb-4 p-3.5" style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Proof</SectionLabel>
              <span className="text-[9px] font-mono" style={{ color: LABEL_COLOR }}>
                {PROOF_STEPS.filter((s) => done.has(s.key)).length}/{PROOF_STEPS.length}
              </span>
            </div>
            <ProofStrip done={done} />
          </div>

          {/* Mark As */}
          <div className="mb-4">
            <SectionLabel>Mark As</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "duplicate",      label: "Duplicate"      },
                { key: "outdated",       label: "Outdated"       },
                { key: "better_contact", label: "Better Contact" },
                { key: "watchlist",      label: "Watchlist"      },
              ].map((item) => {
                const isActive = feedback[sig.id] === item.key;
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
            {feedback[sig.id] && (
              <div className="mt-2 px-3 py-2 text-[10px] text-zinc-600 text-center"
                style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                Feedback sent · {feedback[sig.id].replace("_", " ")}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sticky bottom action bar — thumb-reachable */}
      <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: BORDER, background: BG_BAR }}>
        <button
          onClick={onRoute}
          className="w-full py-3.5 text-sm font-semibold mb-2 transition-all"
          style={{
            background: isRouted ? C_DIM : C_MED,
            border: `1px solid ${isRouted ? C_EDGE : C_STRONG}`,
            color: C,
            borderRadius: R,
          }}
        >
          {isRouted ? <><span style={{ opacity: 0.45, marginRight: 8 }}>✓</span>Re-route to Owner</> : "Route to Owner →"}
        </button>
        <div className="flex gap-2">
          <button className="flex-1 py-3 text-sm font-medium"
            style={{ background: C_DIM, border: `1px solid ${C_EDGE}`, color: C, borderRadius: R, opacity: 0.75 }}>
            Start Outreach
          </button>
          <button className="flex-1 py-3 text-sm font-medium"
            style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: "#71717a", borderRadius: R }}>
            View Source
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile: Signal List screen ─────────────────────────────────
function MobileList({
  signals, allSignals, selected, routed, filter, filters, simLoad, simEmpty,
  onSelect, onFilter,
}: {
  signals: Signal[];
  allSignals: Signal[];
  selected: Signal;
  routed: Record<string, boolean>;
  filter: string | null;
  filters: { key: string | null; label: string; count: number }[];
  simLoad: boolean;
  simEmpty: boolean;
  onSelect: (s: Signal) => void;
  onFilter: (k: string | null) => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: BG_PAGE }}>
      {/* Filter tabs */}
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

      {/* Signal list */}
      <div className="flex-1 overflow-y-auto">
        {simLoad && <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}

        {!simLoad && signals.length === 0 && (
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

        {!simLoad && signals.map((sig) => {
          const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
          const isRouted = routed[sig.id];
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
              {/* Score pair + chevron */}
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

// ── Main component ─────────────────────────────────────────────
export function VariantHierarchy() {
  const [selected, setSelected] = useState<Signal>(MOCK_SIGNALS[0]);
  const [routed, setRouted]     = useState<Record<string, boolean>>({ "sig-001": true, "sig-005": true });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter]     = useState<string | null>(null);
  const [simEmpty, setSimEmpty] = useState(false);
  const [simError, setSimError] = useState(false);
  const [simLoad, setSimLoad]   = useState(false);
  // Mobile: null = list, Signal = detail
  const [mobileDetail, setMobileDetail] = useState<Signal | null>(null);

  const ws = { name: "Acme Corp", quota: 200, used: 143 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  const allSignals = simEmpty ? [] : MOCK_SIGNALS;
  const signals    = filter ? allSignals.filter((s) => s.disposition === filter) : allSignals;

  const activeSig = mobileDetail ?? selected;
  const done = new Set<string>(["captured", "verified", "crm", "model"]);
  if (routed[activeSig.id]) done.add("routed");
  if (feedback[activeSig.id]) done.add("feedback");

  const FILTERS = [
    { key: null,                   label: "All",     count: allSignals.length },
    { key: "billable_opportunity", label: "Billable",count: countByDisposition("billable_opportunity") },
    { key: "intent_update",        label: "Intent",  count: countByDisposition("intent_update") },
    { key: "watchlist",            label: "Watch",   count: countByDisposition("watchlist") },
  ];

  const handleRoute = (sigId: string) =>
    setRouted((p) => ({ ...p, [sigId]: true }));
  const handleFeedback = (sigId: string, key: string) =>
    setFeedback((p) => ({ ...p, [sigId]: key }));

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: BG_PAGE, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ════════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on md+)
      ════════════════════════════════════════════════════════ */}
      <div className="flex flex-col h-full md:hidden">
        {/* Mobile top bar */}
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

        {/* Mobile screen router */}
        <div className="flex-1 min-h-0">
          {mobileDetail ? (
            <MobileDetail
              sig={mobileDetail}
              routed={routed}
              feedback={feedback}
              done={done}
              onRoute={() => handleRoute(mobileDetail.id)}
              onFeedback={(key) => handleFeedback(mobileDetail.id, key)}
              onBack={() => setMobileDetail(null)}
              simError={simError}
            />
          ) : (
            <MobileList
              signals={signals}
              allSignals={allSignals}
              selected={selected}
              routed={routed}
              filter={filter}
              filters={FILTERS}
              simLoad={simLoad}
              simEmpty={simEmpty}
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
            {[
              { label: "Sim: Empty",   active: simEmpty, toggle: () => setSimEmpty((p) => !p) },
              { label: "Sim: Error",   active: simError, toggle: () => setSimError((p) => !p) },
              { label: "Sim: Loading", active: simLoad,  toggle: () => setSimLoad((p) => !p)  },
            ].map(({ label, active, toggle }) => (
              <button key={label} onClick={toggle} className="text-[9px] px-2 py-1 uppercase tracking-wide transition-colors"
                style={{
                  borderRadius: 4,
                  background: active ? "rgba(251,191,36,0.12)" : "transparent",
                  border: active ? "1px solid rgba(251,191,36,0.3)" : "1px solid #1c1c2c",
                  color: active ? "#fbbf24" : LABEL_COLOR,
                }}>
                {label}
              </button>
            ))}
            <div className="w-px h-4 mx-1" style={{ background: BORDER_CARD }} />
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
              {HEALTH.sources.map((s) => (
                <div key={s.name} className="flex items-center justify-between mb-2.5 last:mb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[s.status] }} />
                    <span className="text-[11px] text-zinc-400">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{s.yield}%</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-4">
              <SectionLabel>Signal Health</SectionLabel>
              {[
                { label: "Billable Opps",    val: "143",    hi: true  },
                { label: "Intent Updates",   val: "89",     hi: false },
                { label: "Dupes Suppressed", val: "412",    hi: false },
                { label: "Raw Scanned",      val: "14,302", hi: false },
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
            {/* Queue header */}
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
                {simLoad && <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}
                {!simLoad && signals.length === 0 && (
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
                {!simLoad && signals.map((sig) => {
                  const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
                  const isActive = selected.id === sig.id;
                  const isRouted = routed[sig.id];
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

            {/* Signal detail */}
            <div className="flex-1 overflow-y-auto">
              {simError && (
                <div className="mx-5 mt-5 px-4 py-3 flex items-center gap-3"
                  style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: R }}>
                  <span className="text-red-400 text-sm">⚠</span>
                  <div>
                    <div className="text-xs font-medium text-red-400">Signal data unavailable</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Could not load signal details. Check API connectivity and retry.</div>
                  </div>
                  <button className="ml-auto text-[10px] px-2.5 py-1 font-medium"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: 4 }}>
                    Retry
                  </button>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <CompanyBadge name={selected.company} size={36} />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1.5">{selected.company}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DispositionPill d={selected.disposition} />
                      {selected.dedupeStatus === "duplicate" && (
                        <span className="text-[10px] px-2 py-0.5 font-medium"
                          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.22)", color: "#fbbf24", borderRadius: 4 }}>
                          Duplicate
                        </span>
                      )}
                      {selected.crmStatus === "clean" && selected.dedupeStatus === "unique" && (
                        <span className="text-[10px] px-2 py-0.5"
                          style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: LABEL_COLOR, borderRadius: 4 }}>
                          CRM Clean
                        </span>
                      )}
                      <span className="text-xs font-medium" style={{ color: C }}>{selected.contact.name}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500">{selected.contact.title}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500">{selected.source}</span>
                    </div>
                  </div>
                </div>

                {/* Evidence — hero */}
                <div className="mb-3 p-4"
                  style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderLeft: `3px solid ${C}45`, borderRadius: R }}>
                  <SectionLabel>Source Evidence · {selected.source}</SectionLabel>
                  <p className="text-sm text-zinc-200 leading-relaxed italic mb-3">&ldquo;{selected.evidenceSnippet}&rdquo;</p>
                  <div className="flex items-center gap-2 pt-3 border-t text-[10px]" style={{ borderColor: BORDER_CARD }}>
                    <span className="text-zinc-700">Seen {formatTime(selected.seenAt)}</span>
                    <span className="text-zinc-800">·</span>
                    <span className="text-zinc-700">Verified {formatTime(selected.lastVerifiedAt)}</span>
                    <span className="text-zinc-800">·</span>
                    <span className="truncate" style={{ color: C, opacity: 0.65 }}>{selected.sourceUrl}</span>
                  </div>
                </div>

                {/* Why Now */}
                <div className="mb-4 p-3.5"
                  style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                  <SectionLabel>Why Now</SectionLabel>
                  <p className="text-xs text-zinc-300 leading-relaxed">{selected.whyNow}</p>
                </div>

                {/* Score KPIs */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <ScoreKPI value={selected.fitScore}        label="Fit Score"  />
                  <ScoreKPI value={selected.confidenceScore} label="Confidence" />
                  <ScoreKPI value={selected.freshnessScore}  label="Freshness"  />
                </div>

                {/* Route info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3" style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                    <SectionLabel>Recommended Channel</SectionLabel>
                    <div className="text-xs text-zinc-300">{selected.recommendedChannel}</div>
                  </div>
                  <div className="p-3" style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                    <SectionLabel>Owner</SectionLabel>
                    <div className="text-xs font-medium" style={{ color: routed[selected.id] ? "#34d399" : "#52525b" }}>
                      {routed[selected.id] ? selected.owner : "Unassigned"}
                      {routed[selected.id] && <span className="font-normal" style={{ color: "#34d39970" }}> · Routed</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right Rail */}
          <aside className="flex flex-col shrink-0 border-l overflow-y-auto"
            style={{ width: 256, borderColor: BORDER, background: BG_RAIL }}>
            {/* Primary action */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
              <button
                onClick={() => handleRoute(selected.id)}
                className="w-full px-4 py-3 text-sm font-semibold text-left transition-all mb-2"
                style={{
                  background: routed[selected.id] ? C_DIM : C_MED,
                  border: `1px solid ${routed[selected.id] ? C_EDGE : C_STRONG}`,
                  color: C,
                  borderRadius: R,
                }}>
                {routed[selected.id]
                  ? <><span style={{ opacity: 0.45, marginRight: 8 }}>✓</span>Re-route to Owner</>
                  : "Route to Owner →"}
              </button>
              <div className="flex gap-1.5">
                <button className="flex-1 px-3 py-2 text-xs font-medium text-left"
                  style={{ background: "rgba(6,208,228,0.05)", border: `1px solid ${C_EDGE}`, color: C, borderRadius: R, opacity: 0.75 }}>
                  Start Outreach
                </button>
                <button className="flex-1 px-3 py-2 text-xs font-medium text-left"
                  style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: "#71717a", borderRadius: R }}>
                  View Source
                </button>
              </div>
            </div>

            {/* Proof strip */}
            <div className="px-4 py-3 border-b" style={{ borderColor: BORDER_CARD }}>
              <div className="flex items-center justify-between mb-2.5">
                <SectionLabel>Proof</SectionLabel>
                <span className="text-[9px] font-mono" style={{ color: LABEL_COLOR }}>
                  {PROOF_STEPS.filter((s) => done.has(s.key)).length}/{PROOF_STEPS.length}
                </span>
              </div>
              <ProofStrip done={done} />
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
                  const isActive = feedback[selected.id] === item.key;
                  return (
                    <button key={item.key}
                      onClick={() => handleFeedback(selected.id, item.key)}
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
              {feedback[selected.id] && (
                <div className="mt-2.5 px-3 py-2 text-[10px] text-zinc-600 text-center"
                  style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}>
                  Feedback sent · {feedback[selected.id].replace("_", " ")}
                </div>
              )}
            </div>

            {/* Source Yield */}
            <div className="px-4 py-4">
              <SectionLabel>Source Yield</SectionLabel>
              {HEALTH.sources.map((src) => (
                <div key={src.name} className="mb-3 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[src.status] }} />
                      <span className="text-[10px] text-zinc-500">{src.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600">{src.yield}%</span>
                  </div>
                  <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "#15152a" }}>
                    <div className="h-full rounded-full" style={{ width: `${src.yield}%`, background: statusDot[src.status] }} />
                  </div>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
