/**
 * Variant A — Information Hierarchy (Brand-aligned)
 * Refined to match platos.agency visual identity:
 * - Navy-black backgrounds (#09090f family)
 * - Electric cyan accent (#06d0e4)
 * - Company initials badges
 * - Dot-separator section labels
 * - ● pill badge style for queue header
 */

import { useState } from "react";
import { MOCK_SIGNALS, HEALTH, PROOF_STEPS, dispositionMeta, statusDot, formatTime, scoreColor } from "./_data";

type Signal = typeof MOCK_SIGNALS[0];

// Brand colors
const CYAN = "#06d0e4";
const CYAN_DIM = "rgba(6,208,228,0.12)";
const CYAN_BORDER = "rgba(6,208,228,0.22)";
const CYAN_BORDER_STRONG = "rgba(6,208,228,0.38)";

// Generate company initials
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Consistent per-company hue for initials badge
const BADGE_PALETTES: Array<{ bg: string; text: string }> = [
  { bg: "rgba(6,208,228,0.18)", text: "#06d0e4" },
  { bg: "rgba(52,211,153,0.18)", text: "#34d399" },
  { bg: "rgba(139,92,246,0.18)", text: "#a78bfa" },
  { bg: "rgba(251,191,36,0.18)", text: "#fbbf24" },
  { bg: "rgba(248,113,113,0.18)", text: "#f87171" },
];
function badgePalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return BADGE_PALETTES[hash % BADGE_PALETTES.length];
}

// Plato's helmet logomark (simplified SVG path)
function PlatosLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V18h8v-2.9c1.8-1.4 3-3.6 3-6.1C19 5 16 2 12 2z"
        fill={CYAN}
        opacity="0.9"
      />
      <path d="M9 18h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" fill={CYAN} opacity="0.6" />
      <path d="M3 9h2M19 9h2" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function DispositionPill({ d }: { d: string }) {
  const m = dispositionMeta[d] ?? dispositionMeta.suppressed;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
      style={{
        background: m.bg,
        border: `1px solid ${m.border}`,
        color: m.text,
        borderRadius: 4,
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
      className="flex flex-col items-center py-3 px-4"
      style={{ background: "#0d0d16", border: "1px solid #1a1a28", borderRadius: 6 }}
    >
      <span
        className="text-3xl font-bold tabular-nums leading-none mb-1"
        style={{ color: c, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}

function CompanyBadge({ name }: { name: string }) {
  const p = badgePalette(name);
  return (
    <div
      className="shrink-0 w-7 h-7 flex items-center justify-center text-[10px] font-bold"
      style={{
        background: p.bg,
        border: `1px solid ${p.text}30`,
        color: p.text,
        borderRadius: 6,
      }}
    >
      {initials(name)}
    </div>
  );
}

export function VariantHierarchy() {
  const [selected, setSelected] = useState<Signal>(MOCK_SIGNALS[0]);
  const [routed, setRouted] = useState<Record<string, boolean>>({ "sig-001": true, "sig-005": true });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string | null>(null);

  const signals = filter ? MOCK_SIGNALS.filter((s) => s.disposition === filter) : MOCK_SIGNALS;
  const ws = { name: "Acme Corp", quota: 200, used: 143 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  const done = new Set<string>(["captured", "verified", "crm", "model"]);
  if (routed[selected.id]) done.add("routed");
  if (feedback[selected.id]) done.add("feedback");

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: "#09090f", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-5 shrink-0 border-b"
        style={{ height: 44, borderColor: "#14141e", background: "#0b0b14" }}
      >
        <div className="flex items-center gap-2.5">
          <PlatosLogo />
          <span className="text-white font-bold text-sm tracking-tight">Plato's</span>
          <span className="text-zinc-700 mx-1">/</span>
          <span className="text-zinc-400 text-sm">Signal Command Center</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Brand-style LIVE indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: CYAN, boxShadow: `0 0 6px ${CYAN}` }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: CYAN }}>
              Live
            </span>
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: CYAN_DIM, border: `1px solid ${CYAN_BORDER}` }}
          >
            AR
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* ── Left Rail ── */}
        <aside
          className="flex flex-col shrink-0 border-r overflow-y-auto"
          style={{ width: 196, borderColor: "#14141e", background: "#0a0a12" }}
        >
          {/* Workspace */}
          <div className="p-3.5 border-b" style={{ borderColor: "#14141e" }}>
            <div
              className="text-[9px] uppercase tracking-widest mb-2"
              style={{ color: "#3a3a52", letterSpacing: "0.12em" }}
            >
              Workspace
            </div>
            <div className="text-sm font-semibold text-white">{ws.name}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Growth plan</div>
          </div>

          {/* Weekly Quota */}
          <div className="p-3.5 border-b" style={{ borderColor: "#14141e" }}>
            <div
              className="text-[9px] uppercase tracking-widest mb-2"
              style={{ color: "#3a3a52", letterSpacing: "0.12em" }}
            >
              Weekly Quota
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-bold text-white tabular-nums">{ws.used}</span>
              <span className="text-xs text-zinc-600">/ {ws.quota}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1a1a2a" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${quotaPct}%`,
                  background:
                    quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : CYAN,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-600">{quotaPct}% used</span>
              <span className="text-[10px] text-zinc-600">{ws.quota - ws.used} left</span>
            </div>
          </div>

          {/* Source Health */}
          <div className="p-3.5 border-b" style={{ borderColor: "#14141e" }}>
            <div
              className="text-[9px] uppercase tracking-widest mb-2.5"
              style={{ color: "#3a3a52", letterSpacing: "0.12em" }}
            >
              Source Health
            </div>
            {HEALTH.sources.map((s) => (
              <div key={s.name} className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: statusDot[s.status] }}
                  />
                  <span className="text-[11px] text-zinc-400">{s.name}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">{s.yield}%</span>
              </div>
            ))}
          </div>

          {/* Signal Health */}
          <div className="p-3.5">
            <div
              className="text-[9px] uppercase tracking-widest mb-2.5"
              style={{ color: "#3a3a52", letterSpacing: "0.12em" }}
            >
              Signal Health
            </div>
            {[
              { label: "Billable Opps", val: "143", hi: true },
              { label: "Intent Updates", val: "89", hi: false },
              { label: "Dupes Suppressed", val: "412", hi: false },
              { label: "Raw Scanned", val: "14,302", hi: false },
            ].map((row) => (
              <div key={row.label} className="flex justify-between mb-2">
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

        {/* ── Center ── */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          {/* Queue header — brand pill style */}
          <div
            className="border-b shrink-0"
            style={{ borderColor: "#14141e", background: "#0a0a12" }}
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 border-b"
              style={{ borderColor: "#111120" }}
            >
              {/* ● SIGNAL FEED pill — matches site's badge style */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: CYAN_DIM,
                  border: `1px solid ${CYAN_BORDER}`,
                  color: CYAN,
                  borderRadius: 4,
                }}
              >
                <span style={{ fontSize: 8 }}>●</span>
                Signal Feed
              </div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: "#14141e", color: "#52525b", border: "1px solid #1e1e2e" }}
              >
                {signals.length}
              </span>

              {/* Dot-separator label — matches site's SIGNAL DETECTED · ENRICHED · READY */}
              <span className="text-[9px] uppercase tracking-widest text-zinc-700 ml-1">
                Detected · Verified · Routed
              </span>

              <div className="ml-auto flex gap-1">
                {[
                  { key: null, label: "All" },
                  { key: "billable_opportunity", label: "Billable" },
                  { key: "intent_update", label: "Intent" },
                  { key: "watchlist", label: "Watch" },
                ].map((f) => (
                  <button
                    key={String(f.key)}
                    onClick={() => setFilter(f.key)}
                    className="px-2 py-0.5 text-[10px] transition-colors"
                    style={{
                      background: filter === f.key ? "#1c1c2c" : "transparent",
                      border: filter === f.key ? "1px solid #28283e" : "1px solid transparent",
                      color: filter === f.key ? "#d4d4d8" : "#52525b",
                      borderRadius: 4,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue rows */}
            <div className="overflow-y-auto" style={{ maxHeight: 168 }}>
              {signals.map((sig) => {
                const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
                const isActive = selected.id === sig.id;
                return (
                  <button
                    key={sig.id}
                    onClick={() => setSelected(sig)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b transition-all"
                    style={{
                      borderColor: "#0e0e1c",
                      background: isActive ? "#10101e" : "transparent",
                      borderLeft: `2px solid ${isActive ? CYAN : "transparent"}`,
                    }}
                  >
                    {/* Company initials badge — brand style */}
                    <CompanyBadge name={sig.company} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isActive ? "text-white" : "text-zinc-200"
                          }`}
                        >
                          {sig.company}
                        </span>
                        <span
                          className="text-[10px] font-medium shrink-0"
                          style={{ color: m.text }}
                        >
                          {m.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-600 block truncate">
                        {sig.contact.name} · {sig.source} · {formatTime(sig.seenAt)}
                      </span>
                    </div>

                    {/* Score pair — always visible */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: scoreColor(sig.fitScore) }}
                      >
                        {sig.fitScore}
                      </span>
                      <span className="text-zinc-700 text-[10px]">·</span>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: scoreColor(sig.confidenceScore) }}
                      >
                        {sig.confidenceScore}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Selected Signal Detail ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              {/* Company — largest element */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <CompanyBadge name={selected.company} />
                  <h1 className="text-2xl font-bold text-white tracking-tight leading-none">
                    {selected.company}
                  </h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DispositionPill d={selected.disposition} />
                  {selected.dedupeStatus === "duplicate" && (
                    <span
                      className="text-[10px] px-2 py-0.5 font-semibold"
                      style={{
                        background: "rgba(251,191,36,0.1)",
                        border: "1px solid rgba(251,191,36,0.25)",
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
                        background: "#10101a",
                        border: "1px solid #1e1e2e",
                        color: "#3a3a52",
                        borderRadius: 4,
                      }}
                    >
                      CRM Clean
                    </span>
                  )}
                  {/* Contact info in brand cyan — matches website's contact name style */}
                  <span className="text-xs font-medium" style={{ color: CYAN }}>
                    {selected.contact.name}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">{selected.contact.title}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">{selected.source}</span>
                </div>
              </div>

              {/* Scores — large KPIs */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <ScoreKPI value={selected.fitScore} label="Fit Score" />
                <ScoreKPI value={selected.confidenceScore} label="Confidence" />
                <ScoreKPI value={selected.freshnessScore} label="Freshness" />
              </div>

              {/* Evidence — hero block with brand left-border accent */}
              <div
                className="mb-3 p-4"
                style={{
                  background: "#0c0c16",
                  border: "1px solid #1a1a28",
                  borderLeft: `3px solid ${CYAN}50`,
                  borderRadius: 6,
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "#3a3a52" }}
                >
                  Source Evidence · {selected.source}
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed italic mb-3">
                  &ldquo;{selected.evidenceSnippet}&rdquo;
                </p>
                <div
                  className="flex items-center gap-2 pt-2 border-t text-[10px]"
                  style={{ borderColor: "#1a1a28" }}
                >
                  <span className="text-zinc-700">Seen {formatTime(selected.seenAt)}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="text-zinc-700">Verified {formatTime(selected.lastVerifiedAt)}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="truncate" style={{ color: CYAN, opacity: 0.7 }}>
                    {selected.sourceUrl}
                  </span>
                </div>
              </div>

              {/* Why Now */}
              <div
                className="mb-4 p-3"
                style={{
                  background: "#0c0c16",
                  border: "1px solid #181826",
                  borderRadius: 6,
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: "#3a3a52" }}
                >
                  Why Now
                </div>
                <p className="text-xs text-zinc-300">{selected.whyNow}</p>
              </div>

              {/* Route info */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="p-2.5"
                  style={{
                    background: "#0c0c16",
                    border: "1px solid #181826",
                    borderRadius: 6,
                  }}
                >
                  <div
                    className="text-[9px] uppercase tracking-widest mb-1"
                    style={{ color: "#3a3a52" }}
                  >
                    Recommended Channel
                  </div>
                  <div className="text-xs text-zinc-300">{selected.recommendedChannel}</div>
                </div>
                <div
                  className="p-2.5"
                  style={{
                    background: "#0c0c16",
                    border: "1px solid #181826",
                    borderRadius: 6,
                  }}
                >
                  <div
                    className="text-[9px] uppercase tracking-widest mb-1"
                    style={{ color: "#3a3a52" }}
                  >
                    Owner
                  </div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: routed[selected.id] ? "#34d399" : "#52525b" }}
                  >
                    {routed[selected.id] ? selected.owner : "Unassigned"}
                    {routed[selected.id] && (
                      <span className="text-emerald-700 font-normal"> · Routed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── Right Rail ── */}
        <aside
          className="flex flex-col shrink-0 border-l overflow-y-auto"
          style={{ width: 252, borderColor: "#14141e", background: "#0a0a12" }}
        >
          {/* PRIMARY ACTION — top, always visible */}
          <div className="p-4 border-b" style={{ borderColor: "#14141e" }}>
            <button
              onClick={() => setRouted((p) => ({ ...p, [selected.id]: true }))}
              className="w-full px-4 py-3 text-sm font-semibold text-left transition-all mb-2"
              style={{
                background: routed[selected.id] ? CYAN_DIM : "rgba(6,208,228,0.15)",
                border: `1px solid ${routed[selected.id] ? CYAN_BORDER : CYAN_BORDER_STRONG}`,
                color: CYAN,
                borderRadius: 6,
              }}
            >
              {routed[selected.id] ? (
                <>
                  <span style={{ opacity: 0.5, marginRight: 8 }}>✓</span>Re-route to Owner
                </>
              ) : (
                "Route to Owner →"
              )}
            </button>
            <div className="flex gap-1.5">
              <button
                className="flex-1 px-3 py-2 text-xs font-medium text-left"
                style={{
                  background: "rgba(6,208,228,0.06)",
                  border: `1px solid ${CYAN_BORDER}`,
                  color: CYAN,
                  borderRadius: 6,
                  opacity: 0.8,
                }}
              >
                Start Outreach
              </button>
              <button
                className="flex-1 px-3 py-2 text-xs font-medium text-left"
                style={{
                  background: "#0f0f1a",
                  border: "1px solid #1c1c2c",
                  color: "#71717a",
                  borderRadius: 6,
                }}
              >
                View Source
              </button>
            </div>
          </div>

          {/* Proof Timeline */}
          <div className="p-4 border-b" style={{ borderColor: "#14141e" }}>
            <div
              className="text-[9px] uppercase tracking-widest mb-3"
              style={{ color: "#3a3a52" }}
            >
              Proof Timeline
            </div>
            {PROOF_STEPS.map((step, i) => {
              const isLast = i === PROOF_STEPS.length - 1;
              const isDone = done.has(step.key);
              return (
                <div key={step.key} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: isDone ? `${CYAN}18` : "#111120",
                        border: `1px solid ${isDone ? `${CYAN}40` : "#1c1c2c"}`,
                      }}
                    >
                      {isDone && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CYAN }} />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className="w-px flex-1 my-0.5"
                        style={{
                          minHeight: 14,
                          background: isDone ? `${CYAN}20` : "#161628",
                        }}
                      />
                    )}
                  </div>
                  <div className="pb-2.5">
                    <span
                      className="text-[11px]"
                      style={{ color: isDone ? "#d4d4d8" : "#3a3a52" }}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mark As — quiet, secondary */}
          <div className="p-4 border-b" style={{ borderColor: "#14141e" }}>
            <div
              className="text-[9px] uppercase tracking-widest mb-2"
              style={{ color: "#3a3a52" }}
            >
              Mark As
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { key: "duplicate", label: "Duplicate" },
                { key: "outdated", label: "Outdated" },
                { key: "better_contact", label: "Better Contact" },
                { key: "watchlist", label: "Watchlist" },
              ].map((item) => {
                const isActive = feedback[selected.id] === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() =>
                      setFeedback((p) => ({ ...p, [selected.id]: item.key }))
                    }
                    className="px-2 py-1.5 text-[10px] text-center font-medium transition-colors"
                    style={{
                      background: isActive ? "#14141e" : "#0d0d14",
                      border: isActive ? "1px solid #28283e" : "1px solid #18182a",
                      color: isActive ? "#a1a1aa" : "#3a3a52",
                      borderRadius: 4,
                    }}
                  >
                    {isActive && <span style={{ color: "#34d399", marginRight: 3 }}>✓</span>}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {feedback[selected.id] && (
              <div
                className="mt-2 px-2 py-1.5 text-[10px] text-zinc-600 text-center"
                style={{
                  background: "#0c0c14",
                  border: "1px solid #161626",
                  borderRadius: 4,
                }}
              >
                Feedback sent · {feedback[selected.id].replace("_", " ")}
              </div>
            )}
          </div>

          {/* Source Yield */}
          <div className="p-4">
            <div
              className="text-[9px] uppercase tracking-widest mb-3"
              style={{ color: "#3a3a52" }}
            >
              Source Yield
            </div>
            {HEALTH.sources.map((src) => (
              <div key={src.name} className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: statusDot[src.status] }}
                    />
                    <span className="text-[10px] text-zinc-500">{src.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{src.yield}%</span>
                </div>
                <div
                  className="h-[2px] rounded-full overflow-hidden"
                  style={{ background: "#161628" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${src.yield}%`,
                      background: statusDot[src.status],
                    }}
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
