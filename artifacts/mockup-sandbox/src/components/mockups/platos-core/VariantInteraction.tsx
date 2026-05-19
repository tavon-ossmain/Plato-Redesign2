/**
 * Variant B — Interaction & Affordance Visibility
 *
 * Tradeoff: Every interactive element announces itself. The primary action is
 * always the most visually dominant thing after the selected signal. Queue
 * rows show a hover arrow and full-row highlight. Buttons have icons. The
 * selected state is unmistakable. Feedback is immediate and inline.
 *
 * What this sacrifices: compactness — interactive affordances take space.
 * Some secondary metadata is hidden behind toggles to preserve breathing room.
 */

import { useState } from "react";
import { MOCK_SIGNALS, HEALTH, PROOF_STEPS, sourceIcon, dispositionMeta, statusDot, formatTime, scoreColor } from "./_data";

type Signal = typeof MOCK_SIGNALS[0];

const PLATFORM_COLOR: Record<string, string> = {
  linkedin: "#0077b5",
  g2: "#ff492c",
  reddit: "#ff4500",
  job_board: "#34d399",
  web: "#8b5cf6",
};

function IconRoute() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h10M8 4l4 4-4 4" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2 2 8l5 2 2 5 5-13z" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9a3 3 0 0 0 4.24.12l2-2a3 3 0 0 0-4.24-4.24l-1.15 1.15" />
      <path d="M9 7a3 3 0 0 0-4.24-.12l-2 2a3 3 0 0 0 4.24 4.24L8.15 11.9" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l4 4 8-8" />
    </svg>
  );
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const c = scoreColor(value);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: c }}>{value}</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1a1a24" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: c }} />
      </div>
    </div>
  );
}

export function VariantInteraction() {
  const [selected, setSelected] = useState<Signal>(MOCK_SIGNALS[0]);
  const [hover, setHover] = useState<string | null>(null);
  const [routed, setRouted] = useState<Record<string, boolean>>({ "sig-001": true, "sig-005": true });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [actionDone, setActionDone] = useState<Record<string, boolean>>({});

  const signals = filter ? MOCK_SIGNALS.filter(s => s.disposition === filter) : MOCK_SIGNALS;
  const ws = { name: "Acme Corp", plan: "Growth", quota: 200, used: 143 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  const done = new Set<string>(["captured", "verified", "crm", "model"]);
  if (routed[selected.id]) done.add("routed");
  if (feedback[selected.id]) done.add("feedback");

  const handleRoute = () => {
    setRouted(p => ({ ...p, [selected.id]: true }));
    setActionDone(p => ({ ...p, [`route-${selected.id}`]: true }));
  };

  const handleFeedback = (type: string) => {
    setFeedback(p => ({ ...p, [selected.id]: type }));
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#090910", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 shrink-0 border-b" style={{ height: 44, borderColor: "#14141e", background: "#0c0c14" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#22d3ee18", border: "1px solid #22d3ee30" }}>
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Plato's</span>
          <span className="text-zinc-600 mx-1">/</span>
          <span className="text-zinc-400 text-sm">Signal Command Center</span>
          <span className="ml-3 text-[10px] px-2 py-0.5 rounded text-zinc-500" style={{ background: "#111118", border: "1px solid #1d1d28" }}>
            Variant B · Interaction &amp; Affordance
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px]" style={{ background: "#111118", border: "1px solid #1f1f2c" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Live</span>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white" style={{ background: "#22d3ee18", border: "1px solid #22d3ee28" }}>AR</div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left rail — workspace, quota, health */}
        <aside className="flex flex-col shrink-0 border-r overflow-y-auto" style={{ width: 200, borderColor: "#14141e", background: "#0b0b12" }}>
          <div className="p-3 border-b" style={{ borderColor: "#14141e" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Workspace</div>
            <div className="text-sm font-semibold text-white">{ws.name}</div>
            <div className="text-[10px] text-zinc-600">{ws.plan}</div>
          </div>
          <div className="p-3 border-b" style={{ borderColor: "#14141e" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Weekly Quota</div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-2xl font-bold text-white tabular-nums">{ws.used}</span>
              <span className="text-xs text-zinc-600">/ {ws.quota}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#181828" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${quotaPct}%`, background: quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : "#34d399" }} />
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">{ws.quota - ws.used} remaining</div>
          </div>
          <div className="p-3 border-b" style={{ borderColor: "#14141e" }}>
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
          <div className="p-3">
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Signal Health</div>
            {[
              { label: "Billable Opps", val: "143" },
              { label: "Intent Updates", val: "89" },
              { label: "Dupes Suppressed", val: "412" },
              { label: "Stale", val: "223" },
            ].map(row => (
              <div key={row.label} className="flex justify-between mb-1.5">
                <span className="text-[10px] text-zinc-600">{row.label}</span>
                <span className="text-[10px] font-mono text-zinc-400">{row.val}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          {/* Queue — clearly clickable rows */}
          <div className="border-b shrink-0" style={{ borderColor: "#14141e", background: "#0b0b12" }}>
            <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: "#111118" }}>
              <span className="text-[11px] font-semibold text-zinc-300">Live Signal Queue</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-cyan-400" style={{ background: "#22d3ee10", border: "1px solid #22d3ee20" }}>{signals.length}</span>
              <div className="ml-auto flex gap-1">
                {[{ key: null, label: "All" }, { key: "billable_opportunity", label: "Billable" }, { key: "intent_update", label: "Intent" }, { key: "watchlist", label: "Watch" }].map(f => (
                  <button key={String(f.key)} onClick={() => setFilter(f.key)} className="px-2.5 py-1 text-[10px] rounded transition-all font-medium" style={{ background: filter === f.key ? "#1e1e2e" : "transparent", border: filter === f.key ? "1px solid #2a2a40" : "1px solid transparent", color: filter === f.key ? "#d4d4d8" : "#52525b" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 180 }}>
              {signals.map(sig => {
                const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
                const isActive = selected.id === sig.id;
                const isHover = hover === sig.id;
                const platColor = PLATFORM_COLOR[sig.sourcePlatform] ?? "#52525b";
                return (
                  <button
                    key={sig.id}
                    onClick={() => setSelected(sig)}
                    onMouseEnter={() => setHover(sig.id)}
                    onMouseLeave={() => setHover(null)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b transition-all"
                    style={{
                      borderColor: "#0e0e18",
                      background: isActive ? "#12122a" : isHover ? "#0f0f1c" : "transparent",
                      borderLeft: `3px solid ${isActive ? m.dot : isHover ? "#2a2a3e" : "transparent"}`,
                      cursor: "pointer",
                    }}
                  >
                    {/* Platform color dot — stronger affordance for source */}
                    <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: `${platColor}18`, border: `1px solid ${platColor}30`, color: platColor }}>
                      {sourceIcon[sig.sourcePlatform] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-zinc-200"}`}>{sig.company}</span>
                        <span className="text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded" style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text }}>{m.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600">{sig.contact.name} · {sig.source} · {formatTime(sig.seenAt)}</span>
                    </div>
                    {/* Arrow — explicit click affordance */}
                    <div className="shrink-0 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore) }}>{sig.fitScore}</span>
                        <span className="text-zinc-700 text-xs">·</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore) }}>{sig.confidenceScore}</span>
                      </div>
                      <div className={`transition-opacity text-zinc-600 ${isHover || isActive ? "opacity-100" : "opacity-0"}`}>
                        <IconArrow />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight mb-1.5">{selected.company}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ background: dispositionMeta[selected.disposition]?.bg, border: `1px solid ${dispositionMeta[selected.disposition]?.border}`, color: dispositionMeta[selected.disposition]?.text }}>
                      {dispositionMeta[selected.disposition]?.label}
                    </span>
                    <span className="text-xs text-zinc-400">{selected.contact.name} · {selected.contact.title}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{selected.source}</span>
                  </div>
                </div>
                <div className="flex gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-[9px] text-zinc-700 uppercase">Seen</div>
                    <div className="text-[11px] text-zinc-400">{formatTime(selected.seenAt)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-700 uppercase">Verified</div>
                    <div className="text-[11px] text-zinc-400">{formatTime(selected.lastVerifiedAt)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <ScoreBar value={selected.fitScore} label="Fit" />
                <ScoreBar value={selected.confidenceScore} label="Confidence" />
                <ScoreBar value={selected.freshnessScore} label="Freshness" />
              </div>

              <div className="mb-3 p-4 rounded" style={{ background: "#0d0d16", border: "1px solid #1a1a28" }}>
                <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Source Evidence</div>
                <p className="text-sm text-zinc-200 leading-relaxed italic mb-2">&ldquo;{selected.evidenceSnippet}&rdquo;</p>
                <a className="text-[11px] text-cyan-600 flex items-center gap-1 mt-1 group cursor-pointer">
                  <IconLink />
                  <span className="group-hover:underline">{selected.sourceUrl}</span>
                </a>
              </div>

              <div className="mb-4 p-3 rounded" style={{ background: "#0d0d16", border: "1px solid #1a1a28" }}>
                <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-1">Why Now</div>
                <p className="text-xs text-zinc-300">{selected.whyNow}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded" style={{ background: "#0d0d16", border: "1px solid #1a1a28" }}>
                  <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-1">Recommended Channel</div>
                  <div className="text-xs text-zinc-300">{selected.recommendedChannel}</div>
                </div>
                <div className="p-3 rounded" style={{ background: "#0d0d16", border: "1px solid #1a1a28" }}>
                  <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-1">Owner</div>
                  <div className="text-xs" style={{ color: routed[selected.id] ? "#34d399" : "#52525b" }}>
                    {routed[selected.id] ? selected.owner : "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right: proof + BIG action CTA */}
        <aside className="flex flex-col shrink-0 border-l overflow-y-auto" style={{ width: 256, borderColor: "#14141e", background: "#0b0b12" }}>
          {/* PRIMARY ACTION — top and dominant */}
          <div className="p-4 border-b" style={{ borderColor: "#14141e" }}>
            {actionDone[`route-${selected.id}`] ? (
              <div className="w-full px-4 py-3 rounded flex items-center justify-center gap-2 text-sm font-semibold" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
                <IconCheck />
                Routed to {selected.owner}
              </div>
            ) : (
              <button onClick={handleRoute} className="w-full px-4 py-3 rounded flex items-center justify-center gap-2 text-sm font-semibold transition-all" style={{ background: routed[selected.id] ? "rgba(52,211,153,0.08)" : "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.35)", color: "#34d399" }}>
                <IconRoute />
                {routed[selected.id] ? "Re-route to Owner" : "Route to Owner"}
              </button>
            )}
            <button className="w-full mt-2 px-4 py-2.5 rounded flex items-center justify-center gap-2 text-xs font-semibold transition-all" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.22)", color: "#22d3ee" }}>
              <IconSend />
              Start Outreach
            </button>
            <button className="w-full mt-1.5 px-3 py-2 rounded flex items-center justify-center gap-2 text-xs font-medium" style={{ background: "#101018", border: "1px solid #1c1c28", color: "#71717a" }}>
              <IconLink />
              View Source
            </button>
          </div>

          {/* Proof timeline */}
          <div className="p-4 border-b" style={{ borderColor: "#14141e" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-3">Proof Timeline</div>
            {PROOF_STEPS.map((step, i) => {
              const isLast = i === PROOF_STEPS.length - 1;
              const isDone = done.has(step.key);
              return (
                <div key={step.key} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: isDone ? "rgba(52,211,153,0.14)" : "#111120", border: `1px solid ${isDone ? "rgba(52,211,153,0.35)" : "#1e1e2e"}` }}>
                      {isDone && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                    {!isLast && <div className="w-px flex-1 my-0.5" style={{ minHeight: 14, background: isDone ? "rgba(52,211,153,0.18)" : "#181828" }} />}
                  </div>
                  <div className="pb-2.5">
                    <span className={`text-[11px] ${isDone ? "text-zinc-300" : "text-zinc-600"}`}>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secondary feedback actions — clearly grouped and labeled */}
          <div className="p-4 border-b" style={{ borderColor: "#14141e" }}>
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Mark Signal As</div>
            <div className="flex flex-col gap-1.5">
              {[
                { key: "duplicate", label: "Mark Duplicate" },
                { key: "outdated", label: "Mark Outdated" },
                { key: "better_contact", label: "Better Contact Exists" },
              ].map(item => {
                const isActive = feedback[selected.id] === item.key;
                return (
                  <button key={item.key} onClick={() => handleFeedback(item.key)} className="w-full px-3 py-2 rounded text-xs text-left font-medium transition-all" style={{ background: isActive ? "#18181e" : "#101018", border: isActive ? "1px solid #28283a" : "1px solid #181826", color: isActive ? "#a1a1aa" : "#52525b" }}>
                    {isActive && <span className="text-emerald-500 mr-1.5">✓</span>}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source yield + diagnostics toggle */}
          <div className="p-4">
            <div className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2">Source Yield</div>
            {HEALTH.sources.map(src => (
              <div key={src.name} className="mb-2">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-500">{src.name}</span>
                  <span className="text-[10px] font-mono text-zinc-600">{src.yield}%</span>
                </div>
                <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "#181828" }}>
                  <div className="h-full rounded-full" style={{ width: `${src.yield}%`, background: statusDot[src.status] }} />
                </div>
              </div>
            ))}
            <button onClick={() => setDiagOpen(p => !p)} className="mt-3 w-full px-2 py-1.5 rounded text-[10px] text-zinc-600 text-left flex items-center justify-between transition-colors" style={{ background: "#0d0d14", border: "1px solid #181824" }}>
              <span>Diagnostics</span>
              <span>{diagOpen ? "▲" : "▼"}</span>
            </button>
            {diagOpen && (
              <div className="mt-1.5 p-2 rounded" style={{ background: "#0a0a0f", border: "1px solid #141420" }}>
                {[
                  { label: "Model Path", val: selected.modelPath },
                  { label: "Raw Source", val: selected.rawSource },
                  { label: "Infra Cost", val: "$0.0024" },
                  { label: "Latency", val: "142ms" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between mb-1">
                    <span className="text-[10px] text-zinc-700">{row.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{row.val}</span>
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
