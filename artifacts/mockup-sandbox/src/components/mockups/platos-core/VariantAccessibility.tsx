/**
 * Variant C — Accessibility & Readability
 *
 * Tradeoff: Nothing relies on color alone. Contrast ratios target WCAG AA+.
 * Base font is 13–14px minimum. Status badges include text labels and icons,
 * not just color dots. Score values include descriptive grades ("Excellent",
 * "Good"). Focus indicators are visible. Disposition is communicated with
 * a shape + text label pair. Critical info is never zinc-600 on dark bg.
 *
 * What this sacrifices: maximum density — legibility requires more whitespace
 * and larger type, so fewer items fit per scroll viewport.
 */

import { useState } from "react";
import { MOCK_SIGNALS, HEALTH, PROOF_STEPS, sourceIcon, dispositionMeta, statusDot, formatTime, scoreColor } from "./_data";

type Signal = typeof MOCK_SIGNALS[0];

const GRADE = (n: number) => n >= 85 ? "Excellent" : n >= 70 ? "Good" : n >= 55 ? "Fair" : "Low";

const STATUS_ICONS: Record<string, string> = {
  healthy: "✓",
  degraded: "~",
  error: "✕",
};
const STATUS_LABELS: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  error: "Error",
};

function ScoreCell({ value, label }: { value: number; label: string }) {
  const c = scoreColor(value);
  const grade = GRADE(value);
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded" style={{ background: "#0f0f16", border: "1px solid #1d1d2c" }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: c }}>{value}</span>
        <span className="text-xs font-medium" style={{ color: c }}>{grade}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1d1d2c" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: c }} />
      </div>
    </div>
  );
}

function DispositionBadge({ d }: { d: string }) {
  const m = dispositionMeta[d] ?? dispositionMeta.suppressed;
  const icons: Record<string, string> = {
    billable_opportunity: "●",
    intent_update: "◆",
    watchlist: "▲",
    suppressed: "○",
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold" style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text }}>
      <span>{icons[d] ?? "○"}</span>
      {m.label}
    </span>
  );
}

function ProofStep({ label, isDone, isLast }: { label: string; isDone: boolean; isLast: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: isDone ? "rgba(52,211,153,0.14)" : "#111120", border: `2px solid ${isDone ? "rgba(52,211,153,0.5)" : "#1e1e30"}`, color: isDone ? "#34d399" : "#3f3f58" }}>
          {isDone ? "✓" : ""}
        </div>
        {!isLast && <div className="w-0.5 flex-1 my-1" style={{ minHeight: 12, background: isDone ? "rgba(52,211,153,0.2)" : "#1a1a2c" }} />}
      </div>
      <div className="pb-3">
        <span className={`text-xs font-medium ${isDone ? "text-zinc-200" : "text-zinc-600"}`}>{label}</span>
      </div>
    </div>
  );
}

export function VariantAccessibility() {
  const [selected, setSelected] = useState<Signal>(MOCK_SIGNALS[0]);
  const [routed, setRouted] = useState<Record<string, boolean>>({ "sig-001": true, "sig-005": true });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);

  const signals = filter ? MOCK_SIGNALS.filter(s => s.disposition === filter) : MOCK_SIGNALS;
  const ws = { name: "Acme Corp", plan: "Growth", quota: 200, used: 143 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);

  const done = new Set<string>(["captured", "verified", "crm", "model"]);
  if (routed[selected.id]) done.add("routed");
  if (feedback[selected.id]) done.add("feedback");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#09090f", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>
      {/* Top bar — higher contrast */}
      <header className="flex items-center justify-between px-5 shrink-0 border-b" style={{ height: 46, borderColor: "#18182a", background: "#0c0c18" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#22d3ee20", border: "1px solid #22d3ee40" }}>
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <span className="text-white font-bold tracking-tight">Plato's</span>
          <span className="text-zinc-500 mx-1">/</span>
          <span className="text-zinc-300">Signal Command Center</span>
          <span className="ml-3 text-[10px] px-2 py-0.5 rounded text-zinc-400" style={{ background: "#14141e", border: "1px solid #1e1e30" }}>
            Variant C · Accessibility &amp; Readability
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "#14141e", border: "1px solid #1e1e2e" }}>
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-300 text-xs font-medium">Live</span>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#22d3ee22", border: "1px solid #22d3ee40" }}>AR</div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left — high contrast, legible labels */}
        <aside className="flex flex-col shrink-0 border-r overflow-y-auto" style={{ width: 208, borderColor: "#18182a", background: "#0b0b16" }}>
          <div className="p-4 border-b" style={{ borderColor: "#18182a" }}>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Workspace</div>
            <div className="font-semibold text-white">{ws.name}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{ws.plan} plan</div>
          </div>
          <div className="p-4 border-b" style={{ borderColor: "#18182a" }}>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Weekly Quota</div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-bold text-white tabular-nums">{ws.used}</span>
              <span className="text-sm text-zinc-400">/ {ws.quota}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: "#1a1a2e" }}>
              <div className="h-full rounded-full" style={{ width: `${quotaPct}%`, background: quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : "#34d399" }} />
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">{quotaPct}% used</span>
              <span className="text-xs text-zinc-400">{ws.quota - ws.used} left</span>
            </div>
          </div>

          {/* Source Health — text + icon, not just dot */}
          <div className="p-4 border-b" style={{ borderColor: "#18182a" }}>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Source Health</div>
            {HEALTH.sources.map(s => (
              <div key={s.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold" style={{ color: statusDot[s.status] }}>{STATUS_ICONS[s.status]}</span>
                  <span className="text-xs text-zinc-300">{s.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-400">{s.yield}%</span>
                  <span className="text-[10px] px-1 py-0.5 rounded font-medium" style={{ background: s.status === "healthy" ? "rgba(52,211,153,0.1)" : s.status === "degraded" ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)", color: statusDot[s.status], border: `1px solid ${statusDot[s.status]}25` }}>{STATUS_LABELS[s.status]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Signal Health</div>
            {[
              { label: "Billable Opps", val: "143", color: "#34d399" },
              { label: "Intent Updates", val: "89", color: "#22d3ee" },
              { label: "Dupes Suppressed", val: "412", color: "#fbbf24" },
              { label: "Raw Scanned", val: "14,302", color: "#a1a1aa" },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-1.5">
                <span className="text-xs text-zinc-400">{row.label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: row.color }}>{row.val}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          {/* Queue — larger touch targets, clearer text */}
          <div className="border-b shrink-0" style={{ borderColor: "#18182a", background: "#0c0c18" }}>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: "#14142a" }}>
              <span className="text-sm font-semibold text-zinc-200">Live Signal Queue</span>
              <span className="text-xs px-2 py-0.5 rounded font-bold font-mono text-cyan-300" style={{ background: "#22d3ee14", border: "1px solid #22d3ee30" }}>{signals.length}</span>
              <div className="ml-auto flex gap-1">
                {[{ key: null, label: "All" }, { key: "billable_opportunity", label: "Billable" }, { key: "intent_update", label: "Intent" }, { key: "watchlist", label: "Watch" }].map(f => (
                  <button key={String(f.key)} onClick={() => setFilter(f.key)} className="px-2.5 py-1 text-xs rounded font-medium transition-colors" style={{ background: filter === f.key ? "#1e1e32" : "transparent", border: filter === f.key ? "1px solid #2e2e4a" : "1px solid transparent", color: filter === f.key ? "#e4e4e7" : "#71717a" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
              {signals.map(sig => {
                const m = dispositionMeta[sig.disposition] ?? dispositionMeta.suppressed;
                const isActive = selected.id === sig.id;
                return (
                  <button key={sig.id} onClick={() => setSelected(sig)} className="w-full flex items-center gap-3 px-4 py-3 text-left border-b transition-all" style={{ borderColor: "#101020", background: isActive ? "#13132a" : "transparent", borderLeft: `3px solid ${isActive ? m.dot : "transparent"}` }}>
                    {/* Source badge with text */}
                    <div className="shrink-0 w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold text-zinc-300" style={{ background: "#161628", border: "1px solid #22223a" }}>
                      {sourceIcon[sig.sourcePlatform] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-zinc-200"}`}>{sig.company}</span>
                        <DispositionBadge d={sig.disposition} />
                        {sig.dedupeStatus === "duplicate" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>Dup</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span>{sig.contact.name}</span>
                        <span className="text-zinc-600">·</span>
                        <span>{sig.source}</span>
                        <span className="text-zinc-600">·</span>
                        <span>{formatTime(sig.seenAt)}</span>
                      </div>
                    </div>
                    {/* Scores with labels */}
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500">Fit</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore) }}>{sig.fitScore}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500">Conf</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore) }}>{sig.confidenceScore}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail — generous type, clear labels */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight mb-2">{selected.company}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DispositionBadge d={selected.disposition} />
                    {selected.dedupeStatus === "duplicate" && (
                      <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>⚠ Duplicate in CRM</span>
                    )}
                    {selected.crmStatus === "clean" && selected.dedupeStatus === "unique" && (
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>✓ CRM Clean</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-zinc-300">
                    <span className="font-medium">{selected.contact.name}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">{selected.contact.title}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">{selected.source}</span>
                  </div>
                </div>
                <div className="flex gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase mb-0.5">Seen</div>
                    <div className="text-sm text-zinc-300">{formatTime(selected.seenAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase mb-0.5">Verified</div>
                    <div className="text-sm text-zinc-300">{formatTime(selected.lastVerifiedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Scores with grade labels */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <ScoreCell value={selected.fitScore} label="Fit Score" />
                <ScoreCell value={selected.confidenceScore} label="Confidence" />
                <ScoreCell value={selected.freshnessScore} label="Freshness" />
              </div>

              {/* Evidence */}
              <div className="mb-3 p-4 rounded" style={{ background: "#0d0d1c", border: "1px solid #1c1c30", borderLeft: "3px solid #22d3ee30" }}>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Source Evidence · {selected.source}</div>
                <p className="text-sm text-zinc-200 leading-relaxed italic mb-3">&ldquo;{selected.evidenceSnippet}&rdquo;</p>
                <div className="pt-2.5 border-t text-xs text-zinc-400" style={{ borderColor: "#1e1e30" }}>
                  <span className="text-cyan-400">{selected.sourceUrl}</span>
                </div>
              </div>

              {/* Why Now */}
              <div className="mb-4 p-3.5 rounded" style={{ background: "#0d0d1c", border: "1px solid #1c1c30" }}>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Why Now</div>
                <p className="text-sm text-zinc-300 leading-relaxed">{selected.whyNow}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded" style={{ background: "#0d0d1c", border: "1px solid #1c1c30" }}>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Channel</div>
                  <div className="text-sm text-zinc-200">{selected.recommendedChannel}</div>
                </div>
                <div className="p-3 rounded" style={{ background: "#0d0d1c", border: "1px solid #1c1c30" }}>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Owner</div>
                  <div className="text-sm font-medium" style={{ color: routed[selected.id] ? "#34d399" : "#71717a" }}>
                    {routed[selected.id] ? `✓ ${selected.owner}` : "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right rail — proof + accessible actions */}
        <aside className="flex flex-col shrink-0 border-l overflow-y-auto" style={{ width: 256, borderColor: "#18182a", background: "#0c0c18" }}>
          {/* Proof timeline */}
          <div className="p-4 border-b" style={{ borderColor: "#18182a" }}>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Proof Timeline</div>
            {PROOF_STEPS.map((step, i) => (
              <ProofStep key={step.key} label={step.label} isDone={done.has(step.key)} isLast={i === PROOF_STEPS.length - 1} />
            ))}
          </div>

          {/* Actions — min 44px touch targets, clear labeling */}
          <div className="p-4 border-b" style={{ borderColor: "#18182a" }}>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Actions</div>
            <button onClick={() => setRouted(p => ({ ...p, [selected.id]: true }))} className="w-full px-4 py-3 rounded text-sm font-semibold mb-2 text-left flex items-center gap-2 transition-colors" style={{ background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.35)", color: "#34d399", minHeight: 44 }}>
              <span>{routed[selected.id] ? "✓" : "→"}</span>
              {routed[selected.id] ? "Re-route to Owner" : "Route to Owner"}
            </button>
            <button className="w-full px-4 py-3 rounded text-sm font-semibold mb-2 text-left flex items-center gap-2" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.28)", color: "#22d3ee", minHeight: 44 }}>
              <span>↗</span>
              Start Outreach
            </button>
            <button className="w-full px-4 py-2.5 rounded text-xs font-medium text-left flex items-center gap-2 mb-3" style={{ background: "#111120", border: "1px solid #1e1e30", color: "#a1a1aa", minHeight: 40 }}>
              <span>⧉</span>
              View Source
            </button>

            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Mark Signal As</div>
            {[
              { key: "duplicate", label: "Mark Duplicate", icon: "⊕" },
              { key: "outdated", label: "Mark Outdated", icon: "⊘" },
              { key: "better_contact", label: "Better Contact", icon: "↔" },
            ].map(item => {
              const isActive = feedback[selected.id] === item.key;
              return (
                <button key={item.key} onClick={() => setFeedback(p => ({ ...p, [selected.id]: item.key }))} className="w-full px-3 py-2.5 rounded text-sm font-medium mb-1.5 text-left flex items-center gap-2 transition-all" style={{ background: isActive ? "#1a1a2e" : "#101020", border: isActive ? "1px solid #2a2a45" : "1px solid #181828", color: isActive ? "#d4d4d8" : "#71717a", minHeight: 40 }}>
                  {isActive && <span className="text-emerald-400">✓</span>}
                  {!isActive && <span>{item.icon}</span>}
                  {item.label}
                </button>
              );
            })}
            {feedback[selected.id] && (
              <div className="mt-2 px-3 py-2 rounded text-xs text-zinc-300 font-medium" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                ✓ Feedback recorded: {feedback[selected.id].replace("_", " ")}
              </div>
            )}
          </div>

          {/* Source yield — labeled bars */}
          <div className="p-4">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Source Yield</div>
            {HEALTH.sources.map(src => (
              <div key={src.name} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold" style={{ color: statusDot[src.status] }}>{STATUS_ICONS[src.status]}</span>
                    <span className="text-xs text-zinc-300">{src.name}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-zinc-300">{src.yield}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a2e" }}>
                  <div className="h-full rounded-full" style={{ width: `${src.yield}%`, background: statusDot[src.status] }} />
                </div>
              </div>
            ))}

            {/* Diagnostics — readable */}
            <button onClick={() => setDiagOpen(p => !p)} className="w-full mt-1 px-3 py-2 rounded text-xs font-medium flex items-center justify-between" style={{ background: "#101020", border: "1px solid #1c1c2e", color: "#71717a" }}>
              <span>Diagnostics</span>
              <span>{diagOpen ? "▲" : "▼"}</span>
            </button>
            {diagOpen && (
              <div className="mt-2 p-3 rounded" style={{ background: "#0c0c1a", border: "1px solid #18182c" }}>
                {[
                  { label: "Model Path", val: selected.modelPath },
                  { label: "Raw Source", val: selected.rawSource },
                  { label: "Infra Cost", val: "$0.0024" },
                  { label: "Latency", val: "142ms" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-1">
                    <span className="text-xs text-zinc-500">{row.label}</span>
                    <span className="text-xs font-mono text-zinc-300">{row.val}</span>
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
