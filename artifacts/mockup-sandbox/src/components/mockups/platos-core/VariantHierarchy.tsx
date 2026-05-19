/**
 * Plato's Core — Signal Command Center
 * Brand-aligned, Jony Ive-approved polish pass.
 *
 * Fixes applied:
 * 1. Empty state (skeleton + zero-signal message)
 * 2. Error state on detail pane
 * 3. Count badges on filter tabs
 * 4. Routed indicator on queue rows
 *
 * Polish:
 * - Single border radius system (6px surface, 4px badge, 999px pill)
 * - Unified section-label token (LABEL_COLOR)
 * - Consistent spacing rhythm (multiples of 4px)
 * - Mark-As buttons full-width stacked — not cramped 2-col grid
 * - KPI cards: number + label only, no redundant grade text
 * - Selected queue row: faint cyan left-glow, not just a border
 * - Right rail sections breathe — more generous padding
 * - Typography cleaned up: no competing font-size clusters
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
const C = "#06d0e4";          // brand cyan
const C_DIM   = "rgba(6,208,228,0.10)";
const C_MED   = "rgba(6,208,228,0.18)";
const C_EDGE  = "rgba(6,208,228,0.24)";
const C_STRONG= "rgba(6,208,228,0.40)";

const BG_PAGE  = "#09090f";
const BG_RAIL  = "#0a0a13";
const BG_BAR   = "#0b0b15";
const BG_CARD  = "#0d0d18";
const BG_INSET = "#0b0b14";

const BORDER    = "#15152050";   // very subtle — used for major structural divides
const BORDER_CARD = "#18182a";  // card-level

const LABEL_COLOR = "#38384e";   // all section labels — one value, everywhere
const R = 6;                     // base surface radius (px)

// ── Utilities ──────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const BADGE_PALETTES = [
  { bg: C_MED,                         text: C                    },
  { bg: "rgba(52,211,153,0.16)",        text: "#34d399"            },
  { bg: "rgba(139,92,246,0.16)",        text: "#a78bfa"            },
  { bg: "rgba(251,191,36,0.16)",        text: "#fbbf24"            },
  { bg: "rgba(248,113,113,0.16)",       text: "#f87171"            },
];
function badgePalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return BADGE_PALETTES[h % BADGE_PALETTES.length];
}

// Per-disposition signal counts
function countByDisposition(key: string) {
  return MOCK_SIGNALS.filter((s) => s.disposition === key).length;
}

// ── Sub-components ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[9px] uppercase tracking-widest mb-3"
      style={{ color: LABEL_COLOR, letterSpacing: "0.13em" }}
    >
      {children}
    </div>
  );
}

function PlatosLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V18h8v-2.9c1.8-1.4 3-3.6 3-6.1C19 5 16 2 12 2z"
        fill={C} opacity="0.85"
      />
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
        width: size,
        height: size,
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
      style={{
        background: m.bg,
        border: `1px solid ${m.border}`,
        color: m.text,
        borderRadius: 4,
        lineHeight: "1.5",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function ScoreKPI({ value, label }: { value: number; label: string }) {
  const c = scoreColor(value);
  return (
    <div
      className="flex flex-col items-center py-4"
      style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}
    >
      <span
        className="text-[32px] font-bold tabular-nums leading-none mb-1.5"
        style={{ color: c }}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-widest" style={{ color: LABEL_COLOR }}>
        {label}
      </span>
    </div>
  );
}

// Skeleton shimmer for loading state
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

// ── Main component ─────────────────────────────────────────────
export function VariantHierarchy() {
  const [selected, setSelected]   = useState<Signal>(MOCK_SIGNALS[0]);
  const [routed, setRouted]       = useState<Record<string, boolean>>({ "sig-001": true, "sig-005": true });
  const [feedback, setFeedback]   = useState<Record<string, string>>({});
  const [filter, setFilter]       = useState<string | null>(null);
  const [simEmpty, setSimEmpty]   = useState(false);   // toggle empty state demo
  const [simError, setSimError]   = useState(false);   // toggle error state demo
  const [simLoad, setSimLoad]     = useState(false);   // toggle loading state demo

  const ws = { name: "Acme Corp", quota: 200, used: 143 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  const allSignals = simEmpty ? [] : MOCK_SIGNALS;
  const signals    = filter ? allSignals.filter((s) => s.disposition === filter) : allSignals;

  const done = new Set<string>(["captured", "verified", "crm", "model"]);
  if (routed[selected.id]) done.add("routed");
  if (feedback[selected.id]) done.add("feedback");

  const FILTERS = [
    { key: null,                    label: "All",     count: allSignals.length },
    { key: "billable_opportunity",  label: "Billable",count: countByDisposition("billable_opportunity") },
    { key: "intent_update",         label: "Intent",  count: countByDisposition("intent_update") },
    { key: "watchlist",             label: "Watch",   count: countByDisposition("watchlist") },
  ];

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: BG_PAGE, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 shrink-0 border-b"
        style={{ height: 44, borderColor: BORDER, background: BG_BAR }}
      >
        <div className="flex items-center gap-2.5">
          <PlatosLogo />
          <span className="text-white font-bold text-sm tracking-tight">Plato's</span>
          <span className="text-zinc-700 mx-1.5 text-sm">/</span>
          <span className="text-zinc-400 text-sm">Signal Command Center</span>
        </div>

        {/* Dev-only state toggles — remove before backend connection */}
        <div className="flex items-center gap-1.5">
          {[
            { label: "Sim: Empty",   active: simEmpty, toggle: () => setSimEmpty((p) => !p)  },
            { label: "Sim: Error",   active: simError, toggle: () => setSimError((p) => !p)  },
            { label: "Sim: Loading", active: simLoad,  toggle: () => setSimLoad((p) => !p)   },
          ].map(({ label, active, toggle }) => (
            <button
              key={label}
              onClick={toggle}
              className="text-[9px] px-2 py-1 uppercase tracking-wide transition-colors"
              style={{
                borderRadius: 4,
                background: active ? "rgba(251,191,36,0.12)" : "transparent",
                border: active ? "1px solid rgba(251,191,36,0.3)" : "1px solid #1c1c2c",
                color: active ? "#fbbf24" : LABEL_COLOR,
              }}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 mx-1" style={{ background: BORDER_CARD }} />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: C, boxShadow: `0 0 6px ${C}` }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C }}>Live</span>
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ml-1"
            style={{ background: C_DIM, border: `1px solid ${C_EDGE}` }}
          >
            AR
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">

        {/* ── Left Rail ───────────────────────────────────────── */}
        <aside
          className="flex flex-col shrink-0 border-r overflow-y-auto"
          style={{ width: 196, borderColor: BORDER, background: BG_RAIL }}
        >
          {/* Workspace */}
          <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
            <SectionLabel>Workspace</SectionLabel>
            <div className="text-sm font-semibold text-white leading-tight">{ws.name}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Growth plan</div>
          </div>

          {/* Weekly Quota */}
          <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
            <SectionLabel>Weekly Quota</SectionLabel>
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className="text-[28px] font-bold text-white tabular-nums leading-none">
                {ws.used}
              </span>
              <span className="text-xs text-zinc-600">/ {ws.quota}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "#181830" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${quotaPct}%`,
                  background: quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : C,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-zinc-600">{quotaPct}% used</span>
              <span className="text-[10px] text-zinc-600">{ws.quota - ws.used} left</span>
            </div>
          </div>

          {/* Source Health */}
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

          {/* Signal Health */}
          <div className="px-4 py-4">
            <SectionLabel>Signal Health</SectionLabel>
            {[
              { label: "Billable Opps",    val: "143", hi: true  },
              { label: "Intent Updates",   val: "89",  hi: false },
              { label: "Dupes Suppressed", val: "412", hi: false },
              { label: "Raw Scanned",      val: "14,302", hi: false },
            ].map((row) => (
              <div key={row.label} className="flex justify-between mb-2.5 last:mb-0">
                <span className="text-[10px] text-zinc-600">{row.label}</span>
                <span
                  className="text-[10px] font-mono tabular-nums"
                  style={{ color: row.hi ? "#e4e4e7" : "#52525b" }}
                >
                  {row.val}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Center ──────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">

          {/* Queue header */}
          <div className="border-b shrink-0" style={{ borderColor: BORDER, background: BG_RAIL }}>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: BORDER_CARD }}>
              {/* ● Signal Feed pill */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: C_DIM, border: `1px solid ${C_EDGE}`, color: C, borderRadius: 4 }}
              >
                <span style={{ fontSize: 7 }}>●</span>
                Signal Feed
              </div>

              {/* Dot-separator pipeline label */}
              <span className="text-[9px] uppercase tracking-widest" style={{ color: LABEL_COLOR }}>
                Detected · Verified · Routed
              </span>

              {/* Filter tabs — with counts (Fix #3) */}
              <div className="ml-auto flex items-center gap-1">
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={String(f.key)}
                      onClick={() => setFilter(f.key)}
                      className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] transition-colors"
                      style={{
                        background: active ? "#1c1c2e" : "transparent",
                        border: active ? "1px solid #28283e" : "1px solid transparent",
                        color: active ? "#d4d4d8" : LABEL_COLOR,
                        borderRadius: 4,
                      }}
                    >
                      {f.label}
                      {/* Count badge */}
                      <span
                        className="text-[9px] font-mono px-1 rounded"
                        style={{
                          background: active ? "#28283e" : "#111120",
                          color: active ? "#a1a1aa" : "#38384e",
                          minWidth: 16,
                          textAlign: "center",
                        }}
                      >
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Queue rows */}
            <div className="overflow-y-auto" style={{ maxHeight: 172 }}>
              {/* Loading state (Fix #1a) */}
              {simLoad && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}

              {/* Empty state (Fix #1b) */}
              {!simLoad && signals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "#111120", border: `1px solid ${BORDER_CARD}` }}
                  >
                    <span className="text-zinc-600 text-sm">○</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-500 mb-1">No signals in queue</div>
                  <div className="text-[10px] text-zinc-700 text-center max-w-48">
                    {filter
                      ? "Try a different filter or check source health."
                      : "New high-intent signals will appear here as they're verified."}
                  </div>
                </div>
              )}

              {/* Signal rows */}
              {!simLoad && signals.map((sig) => {
                const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
                const isActive = selected.id === sig.id;
                const isRouted = routed[sig.id];

                return (
                  <button
                    key={sig.id}
                    onClick={() => setSelected(sig)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b transition-all"
                    style={{
                      borderColor: "#0e0e1c",
                      background: isActive ? "#10101e" : "transparent",
                      // Selected: cyan left edge + subtle inset glow
                      borderLeft: `2px solid ${isActive ? C : "transparent"}`,
                      boxShadow: isActive ? `inset 2px 0 12px ${C_DIM}` : "none",
                    }}
                  >
                    <CompanyBadge name={sig.company} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-zinc-200"}`}>
                          {sig.company}
                        </span>
                        <span className="text-[10px] font-medium shrink-0" style={{ color: m.text }}>
                          {m.label}
                        </span>
                        {/* Routed indicator on queue row (Fix #4) */}
                        {isRouted && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 shrink-0"
                            style={{
                              background: "rgba(52,211,153,0.08)",
                              border: "1px solid rgba(52,211,153,0.18)",
                              color: "#34d399",
                              borderRadius: 4,
                            }}
                          >
                            → {sig.owner.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-600 block truncate">
                        {sig.contact.name} · {sig.source} · {formatTime(sig.seenAt)}
                      </span>
                    </div>

                    {/* Score pair */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore) }}>
                        {sig.fitScore}
                      </span>
                      <span className="text-zinc-700 text-[10px]">·</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore) }}>
                        {sig.confidenceScore}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Selected Signal Detail ────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {/* Error state (Fix #2) */}
            {simError && (
              <div
                className="mx-5 mt-5 px-4 py-3 flex items-center gap-3"
                style={{
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: R,
                }}
              >
                <span className="text-red-400 text-sm">⚠</span>
                <div>
                  <div className="text-xs font-medium text-red-400">Signal data unavailable</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">
                    Could not load signal details. Check API connectivity and retry.
                  </div>
                </div>
                <button
                  className="ml-auto text-[10px] px-2.5 py-1 font-medium"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.25)",
                    color: "#f87171",
                    borderRadius: 4,
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            <div className="p-5">
              {/* Company header */}
              <div className="flex items-start gap-3 mb-4">
                <CompanyBadge name={selected.company} size={36} />
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1.5">
                    {selected.company}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DispositionPill d={selected.disposition} />
                    {selected.dedupeStatus === "duplicate" && (
                      <span
                        className="text-[10px] px-2 py-0.5 font-medium"
                        style={{
                          background: "rgba(251,191,36,0.1)",
                          border: "1px solid rgba(251,191,36,0.22)",
                          color: "#fbbf24",
                          borderRadius: 4,
                        }}
                      >
                        Duplicate
                      </span>
                    )}
                    {selected.crmStatus === "clean" && selected.dedupeStatus === "unique" && (
                      <span
                        className="text-[10px] px-2 py-0.5"
                        style={{
                          background: BG_CARD,
                          border: `1px solid ${BORDER_CARD}`,
                          color: LABEL_COLOR,
                          borderRadius: 4,
                        }}
                      >
                        CRM Clean
                      </span>
                    )}
                    {/* Contact in brand cyan */}
                    <span className="text-xs font-medium" style={{ color: C }}>
                      {selected.contact.name}
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{selected.contact.title}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{selected.source}</span>
                  </div>
                </div>
              </div>

              {/* Score KPIs */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <ScoreKPI value={selected.fitScore}        label="Fit Score"   />
                <ScoreKPI value={selected.confidenceScore} label="Confidence"  />
                <ScoreKPI value={selected.freshnessScore}  label="Freshness"   />
              </div>

              {/* Evidence block — hero */}
              <div
                className="mb-3 p-4"
                style={{
                  background: BG_INSET,
                  border: `1px solid ${BORDER_CARD}`,
                  borderLeft: `3px solid ${C}45`,
                  borderRadius: R,
                }}
              >
                <SectionLabel>Source Evidence · {selected.source}</SectionLabel>
                <p className="text-sm text-zinc-200 leading-relaxed italic mb-3">
                  &ldquo;{selected.evidenceSnippet}&rdquo;
                </p>
                <div
                  className="flex items-center gap-2 pt-3 border-t text-[10px]"
                  style={{ borderColor: BORDER_CARD }}
                >
                  <span className="text-zinc-700">Seen {formatTime(selected.seenAt)}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="text-zinc-700">Verified {formatTime(selected.lastVerifiedAt)}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="truncate" style={{ color: C, opacity: 0.65 }}>
                    {selected.sourceUrl}
                  </span>
                </div>
              </div>

              {/* Why Now */}
              <div
                className="mb-4 p-3.5"
                style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}
              >
                <SectionLabel>Why Now</SectionLabel>
                <p className="text-xs text-zinc-300 leading-relaxed">{selected.whyNow}</p>
              </div>

              {/* Route info row */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="p-3"
                  style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}
                >
                  <SectionLabel>Recommended Channel</SectionLabel>
                  <div className="text-xs text-zinc-300">{selected.recommendedChannel}</div>
                </div>
                <div
                  className="p-3"
                  style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R }}
                >
                  <SectionLabel>Owner</SectionLabel>
                  <div
                    className="text-xs font-medium"
                    style={{ color: routed[selected.id] ? "#34d399" : "#52525b" }}
                  >
                    {routed[selected.id] ? selected.owner : "Unassigned"}
                    {routed[selected.id] && (
                      <span className="font-normal" style={{ color: "#34d39970" }}> · Routed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── Right Rail ──────────────────────────────────────── */}
        <aside
          className="flex flex-col shrink-0 border-l overflow-y-auto"
          style={{ width: 256, borderColor: BORDER, background: BG_RAIL }}
        >
          {/* Primary action — top, always visible, no scroll required */}
          <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
            <button
              onClick={() => setRouted((p) => ({ ...p, [selected.id]: true }))}
              className="w-full px-4 py-3 text-sm font-semibold text-left transition-all mb-2"
              style={{
                background: routed[selected.id] ? C_DIM : C_MED,
                border: `1px solid ${routed[selected.id] ? C_EDGE : C_STRONG}`,
                color: C,
                borderRadius: R,
              }}
            >
              {routed[selected.id] ? (
                <><span style={{ opacity: 0.45, marginRight: 8 }}>✓</span>Re-route to Owner</>
              ) : (
                "Route to Owner →"
              )}
            </button>
            <div className="flex gap-1.5">
              <button
                className="flex-1 px-3 py-2 text-xs font-medium text-left"
                style={{
                  background: "rgba(6,208,228,0.05)",
                  border: `1px solid ${C_EDGE}`,
                  color: C,
                  borderRadius: R,
                  opacity: 0.75,
                }}
              >
                Start Outreach
              </button>
              <button
                className="flex-1 px-3 py-2 text-xs font-medium text-left"
                style={{
                  background: BG_CARD,
                  border: `1px solid ${BORDER_CARD}`,
                  color: "#71717a",
                  borderRadius: R,
                }}
              >
                View Source
              </button>
            </div>
          </div>

          {/* Proof Timeline */}
          <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
            <SectionLabel>Proof Timeline</SectionLabel>
            {PROOF_STEPS.map((step, i) => {
              const isLast = i === PROOF_STEPS.length - 1;
              const isDone = done.has(step.key);
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: isDone ? `${C}18` : "#10101c",
                        border: `1px solid ${isDone ? `${C}38` : "#1c1c2e"}`,
                      }}
                    >
                      {isDone && <div className="w-1.5 h-1.5 rounded-full" style={{ background: C }} />}
                    </div>
                    {!isLast && (
                      <div
                        className="w-px flex-1 my-0.5"
                        style={{ minHeight: 14, background: isDone ? `${C}22` : "#15152a" }}
                      />
                    )}
                  </div>
                  <div className="pb-3">
                    <span
                      className="text-[11px]"
                      style={{ color: isDone ? "#d4d4d8" : LABEL_COLOR }}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mark As — full-width stacked, not a cramped 2-col grid */}
          <div className="px-4 py-4 border-b" style={{ borderColor: BORDER_CARD }}>
            <SectionLabel>Mark As</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {[
                { key: "duplicate",     label: "Duplicate"        },
                { key: "outdated",      label: "Outdated"         },
                { key: "better_contact",label: "Better Contact"   },
                { key: "watchlist",     label: "Watchlist"        },
              ].map((item) => {
                const isActive = feedback[selected.id] === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setFeedback((p) => ({ ...p, [selected.id]: item.key }))}
                    className="w-full px-3 py-2 text-xs font-medium text-left transition-colors"
                    style={{
                      background: isActive ? "#141422" : BG_CARD,
                      border: isActive ? "1px solid #252538" : `1px solid ${BORDER_CARD}`,
                      color: isActive ? "#a1a1aa" : LABEL_COLOR,
                      borderRadius: R,
                    }}
                  >
                    {isActive && (
                      <span className="mr-2" style={{ color: "#34d399" }}>✓</span>
                    )}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {feedback[selected.id] && (
              <div
                className="mt-2.5 px-3 py-2 text-[10px] text-zinc-600 text-center"
                style={{
                  background: BG_INSET,
                  border: `1px solid ${BORDER_CARD}`,
                  borderRadius: R,
                }}
              >
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
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${src.yield}%`, background: statusDot[src.status] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
}
