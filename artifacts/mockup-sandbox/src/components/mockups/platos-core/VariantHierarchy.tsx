/**
 * Variant A — Information Hierarchy
 *
 * Tradeoff: Every pixel of visual weight is intentional. The selected signal's
 * company name is the largest element on screen. Scores are large numerals,
 * not bars. Evidence is the hero block. Secondary rails (source health,
 * diagnostics) are visually quieter. The user's eye always lands on the most
 * actionable thing first.
 *
 * What this sacrifices: compactness — the detail zone is more spacious, so
 * fewer signals are visible in the queue without scrolling.
 */

import { useState } from "react";
import { MOCK_SIGNALS, HEALTH, PROOF_STEPS, sourceIcon, dispositionMeta, statusDot, formatTime, scoreColor } from "./_data";

type Signal = typeof MOCK_SIGNALS[0];

function DispositionPill({ d }: { d: string }) {
  const m = dispositionMeta[d] ?? dispositionMeta.suppressed;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-sm"
      style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function ScoreKPI({ value, label }: { value: number; label: string }) {
  const c = scoreColor(value);
  const grade = value >= 85 ? "Excellent" : value >= 70 ? "Good" : value >= 55 ? "Fair" : "Low";
  return (
    <div className="flex flex-col items-center py-3 px-4 rounded" style={{ background: "#0f0f14", border: "1px solid #1c1c26" }}>
      <span className="text-3xl font-bold tabular-nums leading-none mb-1" style={{ color: c }}>{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">{label}</span>
      <span className="text-[10px] font-medium" style={{ color: c }}>{grade}</span>
    </div>
  );
}

export function VariantHierarchy() {
  const [selected, setSelected] = useState<Signal>(MOCK_SIGNALS[0]);
  const [routed, setRouted] = useState<Record<string, boolean>>({ "sig-001": true, "sig-005": true });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string | null>(null);

  const signals = filter ? MOCK_SIGNALS.filter(s => s.disposition === filter) : MOCK_SIGNALS;
  const ws = { name: "Acme Corp", quota: 200, used: 143 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  const done = new Set<string>(["captured", "verified", "crm", "model"]);
  if (routed[selected.id]) done.add("routed");
  if (feedback[selected.id]) done.add("feedback");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#08080a", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 shrink-0 border-b" style={{ height: 42, borderColor: "#161620", background: "#0b0b0e" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#22d3ee18", border: "1px solid #22d3ee30" }}>
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Plato's</span>
          <span className="text-zinc-600 text-sm mx-1">/</span>
          <span className="text-zinc-400 text-sm">Signal Command Center</span>
          <span className="ml-3 text-[10px] px-2 py-0.5 rounded text-zinc-500" style={{ background: "#111115", border: "1px solid #1d1d25" }}>
            Refined
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px]" style={{ background: "#111113", border: "1px solid #1f1f25" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Live</span>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white" style={{ background: "#22d3ee18", border: "1px solid #22d3ee28" }}>AR</div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left: narrow context rail */}
        <aside className="flex flex-col shrink-0 border-r overflow-y-auto" style={{ width: 192, borderColor: "#161620", background: "#0a0a0d" }}>
          <div className="p-3 border-b" style={{ borderColor: "#161620" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Workspace</div>
            <div className="text-sm font-semibold text-white">{ws.name}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Growth plan</div>
          </div>
          <div className="p-3 border-b" style={{ borderColor: "#161620" }}>
            {/* Quota — hero number in the rail */}
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-1">Weekly Quota</div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-white tabular-nums">{ws.used}</span>
              <span className="text-xs text-zinc-600">/ {ws.quota}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1a1a22" }}>
              <div className="h-full rounded-full" style={{ width: `${quotaPct}%`, background: quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : "#34d399" }} />
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">{ws.quota - ws.used} remaining · {quotaPct}% used</div>
          </div>

          {/* Source Health — minimal, secondary */}
          <div className="p-3 border-b" style={{ borderColor: "#161620" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Source Health</div>
            {HEALTH.sources.map(s => (
              <div key={s.name} className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[s.status] }} />
                  <span className="text-[11px] text-zinc-400">{s.name}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">{s.yield}%</span>
              </div>
            ))}
          </div>

          {/* Signal health numbers — most secondary */}
          <div className="p-3">
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Signal Health</div>
            {[
              { label: "Billable Opps", val: "143", emphasis: true },
              { label: "Intent Updates", val: "89", emphasis: false },
              { label: "Dupes Suppressed", val: "412", emphasis: false },
              { label: "Raw Scanned", val: "14,302", emphasis: false },
            ].map(row => (
              <div key={row.label} className="flex justify-between mb-1.5">
                <span className="text-[10px] text-zinc-600">{row.label}</span>
                <span className={`text-[10px] font-mono tabular-nums ${row.emphasis ? "text-zinc-200" : "text-zinc-500"}`}>{row.val}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: queue + BIG detail */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          {/* Queue strip — compact, subordinate */}
          <div className="border-b shrink-0" style={{ borderColor: "#161620", background: "#0a0a0d" }}>
            <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: "#111118" }}>
              <span className="text-[11px] font-semibold text-zinc-300">Live Signal Queue</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-cyan-400" style={{ background: "#22d3ee10", border: "1px solid #22d3ee20" }}>{signals.length}</span>
              <div className="ml-auto flex gap-1">
                {[{ key: null, label: "All" }, { key: "billable_opportunity", label: "Billable" }, { key: "intent_update", label: "Intent" }, { key: "watchlist", label: "Watch" }].map(f => (
                  <button key={String(f.key)} onClick={() => setFilter(f.key)} className="px-2 py-0.5 text-[10px] rounded transition-colors" style={{ background: filter === f.key ? "#1c1c26" : "transparent", border: filter === f.key ? "1px solid #28283a" : "1px solid transparent", color: filter === f.key ? "#d4d4d8" : "#52525b" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-hidden overflow-y-auto" style={{ maxHeight: 160 }}>
              {signals.map(sig => {
                const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
                const isActive = selected.id === sig.id;
                return (
                  <button key={sig.id} onClick={() => setSelected(sig)} className="w-full flex items-center gap-3 px-4 py-2 text-left border-b transition-all" style={{ borderColor: "#0f0f15", background: isActive ? "#10101a" : "transparent", borderLeft: `3px solid ${isActive ? m.dot : "transparent"}` }}>
                    <div className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: "#141420", border: "1px solid #1e1e2c", color: "#4b4b6a" }}>{sourceIcon[sig.sourcePlatform] ?? "?"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-zinc-300"}`}>{sig.company}</span>
                        <span className="text-[10px] shrink-0 font-medium" style={{ color: m.text }}>{m.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 truncate block">{sig.contact.name} · {sig.source} · {formatTime(sig.seenAt)}</span>
                    </div>
                    {/* Hierarchy: score pair is rightmost, always visible */}
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

          {/* HERO: Selected Signal Detail */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              {/* Company — largest element on page */}
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">{selected.company}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <DispositionPill d={selected.disposition} />
                  {selected.dedupeStatus === "duplicate" && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>Duplicate</span>
                  )}
                  {selected.crmStatus === "clean" && selected.dedupeStatus === "unique" && (
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "#111115", border: "1px solid #1e1e28", color: "#52525b" }}>CRM Clean</span>
                  )}
                  <span className="text-xs text-zinc-400">{selected.contact.name}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">{selected.contact.title}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">{selected.source}</span>
                </div>
              </div>

              {/* Scores — large, scannable KPIs */}
              <div className="grid grid-cols-3 gap-2 my-4">
                <ScoreKPI value={selected.fitScore} label="Fit Score" />
                <ScoreKPI value={selected.confidenceScore} label="Confidence" />
                <ScoreKPI value={selected.freshnessScore} label="Freshness" />
              </div>

              {/* Evidence — hero block */}
              <div className="mb-3 p-4 rounded" style={{ background: "#0c0c12", border: "1px solid #181825", borderLeft: "3px solid #22d3ee40" }}>
                <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Source Evidence · {selected.source}</div>
                <p className="text-sm text-zinc-200 leading-relaxed italic mb-3">&ldquo;{selected.evidenceSnippet}&rdquo;</p>
                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "#1a1a26" }}>
                  <span className="text-[10px] text-zinc-700">Seen {formatTime(selected.seenAt)}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="text-[10px] text-zinc-700">Verified {formatTime(selected.lastVerifiedAt)}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="text-[11px] text-cyan-600 truncate">{selected.sourceUrl}</span>
                </div>
              </div>

              {/* Why Now — secondary but visible */}
              <div className="mb-4 p-3 rounded" style={{ background: "#0c0c12", border: "1px solid #181822" }}>
                <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-1">Why Now</div>
                <p className="text-xs text-zinc-300">{selected.whyNow}</p>
              </div>

              {/* Route info — tertiary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded" style={{ background: "#0c0c12", border: "1px solid #181822" }}>
                  <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-1">Recommended Channel</div>
                  <div className="text-xs text-zinc-300">{selected.recommendedChannel}</div>
                </div>
                <div className="p-2.5 rounded" style={{ background: "#0c0c12", border: "1px solid #181822" }}>
                  <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-1">Owner</div>
                  <div className="text-xs" style={{ color: routed[selected.id] ? "#34d399" : "#52525b" }}>
                    {routed[selected.id] ? selected.owner : "Unassigned"}{routed[selected.id] && <span className="text-emerald-700"> · Routed</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right: actions first, then proof, then yield */}
        <aside className="flex flex-col shrink-0 border-l overflow-y-auto" style={{ width: 248, borderColor: "#161620", background: "#0a0a0d" }}>

          {/* PRIMARY ACTION — top of rail, always reachable without scrolling */}
          <div className="p-4 border-b" style={{ borderColor: "#161620" }}>
            <button
              onClick={() => setRouted(p => ({ ...p, [selected.id]: true }))}
              className="w-full px-4 py-3 rounded text-sm font-semibold text-left transition-colors mb-2"
              style={{
                background: routed[selected.id] ? "rgba(52,211,153,0.08)" : "rgba(52,211,153,0.13)",
                border: `1px solid ${routed[selected.id] ? "rgba(52,211,153,0.22)" : "rgba(52,211,153,0.38)"}`,
                color: "#34d399",
              }}
            >
              {routed[selected.id]
                ? <><span className="opacity-60 mr-2">✓</span>Re-route to Owner</>
                : <>Route to Owner</>}
            </button>
            <div className="flex gap-1.5">
              <button
                className="flex-1 px-3 py-2 rounded text-xs font-medium text-left transition-colors"
                style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}
              >
                Start Outreach
              </button>
              <button
                className="flex-1 px-3 py-2 rounded text-xs font-medium text-left"
                style={{ background: "#101015", border: "1px solid #1c1c26", color: "#71717a" }}
              >
                View Source
              </button>
            </div>
          </div>

          {/* Proof timeline */}
          <div className="p-4 border-b" style={{ borderColor: "#161620" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-3">Proof Timeline</div>
            {PROOF_STEPS.map((step, i) => {
              const isLast = i === PROOF_STEPS.length - 1;
              const isDone = done.has(step.key);
              return (
                <div key={step.key} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: isDone ? "rgba(52,211,153,0.12)" : "#111118",
                        border: `1px solid ${isDone ? "rgba(52,211,153,0.35)" : "#1c1c28"}`,
                      }}
                    >
                      {isDone && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                    {!isLast && (
                      <div
                        className="w-px flex-1 my-0.5"
                        style={{ minHeight: 14, background: isDone ? "rgba(52,211,153,0.18)" : "#161622" }}
                      />
                    )}
                  </div>
                  <div className="pb-2.5">
                    <span className={`text-[11px] ${isDone ? "text-zinc-300" : "text-zinc-600"}`}>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mark As — secondary feedback, visually quieter */}
          <div className="p-4 border-b" style={{ borderColor: "#161620" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Mark As</div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { key: "duplicate", label: "Duplicate" },
                { key: "outdated", label: "Outdated" },
                { key: "better_contact", label: "Better Contact" },
                { key: "watchlist", label: "Watchlist" },
              ].map(item => {
                const isActive = feedback[selected.id] === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setFeedback(p => ({ ...p, [selected.id]: item.key }))}
                    className="px-2 py-1.5 rounded text-[10px] text-center font-medium transition-colors"
                    style={{
                      background: isActive ? "#141420" : "#0d0d12",
                      border: isActive ? "1px solid #28283a" : "1px solid #1a1a24",
                      color: isActive ? "#a1a1aa" : "#52525b",
                    }}
                  >
                    {isActive && <span className="text-emerald-600 mr-1">✓</span>}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {feedback[selected.id] && (
              <div
                className="mt-2 px-2 py-1.5 rounded text-[10px] text-zinc-500 text-center"
                style={{ background: "#0c0c10", border: "1px solid #161620" }}
              >
                Feedback sent · {feedback[selected.id].replace("_", " ")}
              </div>
            )}
          </div>

          {/* Source yield */}
          <div className="p-4">
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Source Yield</div>
            {HEALTH.sources.map(src => (
              <div key={src.name} className="mb-2.5">
                <div className="flex justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[src.status] }} />
                    <span className="text-[10px] text-zinc-500">{src.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{src.yield}%</span>
                </div>
                <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "#161622" }}>
                  <div className="h-full rounded-full" style={{ width: `${src.yield}%`, background: statusDot[src.status] }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
