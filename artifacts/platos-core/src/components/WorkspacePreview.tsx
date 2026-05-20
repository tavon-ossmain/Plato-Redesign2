/**
 * WorkspacePreview — shown when workspace.status === "preview"
 * Displays ICP config, a blurred signal queue, and an activation CTA.
 * Matches the design language of SignalCommandCenter exactly.
 */

import { useState } from "react";
import type { WorkspaceContext, IcpConfig } from "@workspace/api-client-react";

// ── Theme contract (mirrors SignalCommandCenter) ────────────────
interface T {
  light: boolean;
  page: string;
  bar: string;
  card: string;
  inset: string;
  border: string;
  borderCard: string;
  label: string;
  text: string;
  textSub: string;
  textFaint: string;
  shadowSm: string;
  shadowMd: string;
  shadowGlow: string;
  c: string;
  cDim: string;
  cMed: string;
  cEdge: string;
  cStrong: string;
}

const DARK: T = {
  light: false,
  page:       "#07070e",
  bar:        "#0a0a14",
  card:       "linear-gradient(145deg,#111128 0%,#0e0e20 100%)",
  inset:      "linear-gradient(145deg,#0d0d1e 0%,#0b0b18 100%)",
  border:     "rgba(255,255,255,0.04)",
  borderCard: "rgba(255,255,255,0.06)",
  label:      "#5a5a78",
  text:       "#f4f4f6",
  textSub:    "#9898b0",
  textFaint:  "#2a2a3e",
  shadowSm:   "0 1px 3px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
  shadowMd:   "0 4px 12px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.05)",
  shadowGlow: "0 0 24px rgba(6,208,228,0.14), 0 4px 12px rgba(0,0,0,0.60), 0 0 0 1px rgba(6,208,228,0.22)",
  c:          "#06d0e4",
  cDim:       "rgba(6,208,228,0.08)",
  cMed:       "rgba(6,208,228,0.15)",
  cEdge:      "rgba(6,208,228,0.22)",
  cStrong:    "rgba(6,208,228,0.38)",
};

const LIGHT: T = {
  light: true,
  page:       "#f4f4f8",
  bar:        "#ffffff",
  card:       "linear-gradient(145deg,#ffffff 0%,#fafafd 100%)",
  inset:      "linear-gradient(145deg,#f0f0f5 0%,#ebebf2 100%)",
  border:     "rgba(0,0,0,0.06)",
  borderCard: "rgba(0,0,0,0.07)",
  label:      "#9090a8",
  text:       "#0f0f1a",
  textSub:    "#4a4a68",
  textFaint:  "#e4e4ee",
  shadowSm:   "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
  shadowMd:   "0 4px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)",
  shadowGlow: "0 0 24px rgba(0,153,168,0.18), 0 4px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,153,168,0.24)",
  c:          "#0099a8",
  cDim:       "rgba(0,153,168,0.08)",
  cMed:       "rgba(0,153,168,0.14)",
  cEdge:      "rgba(0,153,168,0.22)",
  cStrong:    "rgba(0,153,168,0.36)",
};

// ── Shared sub-components ───────────────────────────────────────
function PlatosLogo({ t }: { t: T }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V18h8v-2.9c1.8-1.4 3-3.6 3-6.1C19 5 16 2 12 2z"
        fill={t.c} opacity="0.9" />
      <path d="M9 18h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" fill={t.c} opacity="0.45" />
      <path d="M3 9h2M19 9h2" stroke={t.c} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function ThemeToggle({ t, onToggle }: { t: T; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={t.light ? "Switch to dark mode" : "Switch to light mode"}
      className="flex items-center justify-center w-7 h-7 rounded-full transition-all"
      style={{ background: t.card, border: `1px solid ${t.borderCard}`, boxShadow: t.shadowSm, color: t.label }}
    >
      {t.light ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

// ── Source config preview ─────────────────────────────────────────
const SOURCE_META: Record<string, { label: string; daily: number; weekly: number; icon: string }> = {
  linkedin:  { label: "LinkedIn",   daily: 30, weekly: 150, icon: "💼" },
  reddit:    { label: "Reddit",     daily: 20, weekly: 100, icon: "📣" },
  g2:        { label: "G2 Reviews", daily: 15, weekly:  75, icon: "⭐" },
  jobboards: { label: "Job Boards", daily: 40, weekly: 200, icon: "📋" },
  webscrape: { label: "Web Scrape", daily: 25, weekly: 125, icon: "🌐" },
  web:       { label: "Web Scrape", daily: 25, weekly: 125, icon: "🌐" },
};

function SourceConfigSection({ sources, keywordCount, t }: {
  sources: string[];
  keywordCount: number;
  t: T;
}) {
  if (sources.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: t.label }}>
        Source Configuration
      </p>
      <div className="flex flex-col gap-2">
        {sources.map((src) => {
          const meta = SOURCE_META[src] ?? { label: src, daily: 50, weekly: 250, icon: "📡" };
          return (
            <div key={src} className="rounded-lg px-2.5 py-2 flex flex-col gap-1.5"
              style={{ background: t.inset, border: `1px solid ${t.borderCard}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px]">{meta.icon}</span>
                  <span className="text-[11px] font-semibold" style={{ color: t.text }}>{meta.label}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.22)", color: "#f59e0b" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  Paused
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: t.label }}>
                <span>{keywordCount} keywords</span>
                <span style={{ color: t.textFaint }}>·</span>
                <span>~{meta.daily}/day</span>
                <span style={{ color: t.textFaint }}>·</span>
                <span>~{meta.weekly}/wk</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mt-2 leading-relaxed" style={{ color: t.label }}>
        Activate to start live sourcing across all configured channels.
      </p>
    </div>
  );
}

// ── ICP Panel ───────────────────────────────────────────────────
function IcpPanel({ icp, t }: { icp: IcpConfig; t: T }) {
  const SOURCE_LABEL: Record<string, string> = {
    linkedin: "LinkedIn", jobboards: "Job Boards", g2: "G2",
    reddit: "Reddit", webscrape: "Web Scrape", twitter: "X / Twitter",
  };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto" style={{ padding: "16px 14px" }}>
      {/* Normalized ICP */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: t.label }}>
          ICP Definition
        </p>
        <div className="rounded-lg px-3 py-2.5 text-[12px] leading-relaxed" style={{ background: t.inset, border: `1px solid ${t.borderCard}`, color: t.text }}>
          {icp.normalizedIcp}
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: t.cDim, border: `1px solid ${t.cEdge}` }}>
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: t.c }}>
          ICP Confidence
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: t.c }}>
          {Math.round(icp.confidence * 100)}%
        </span>
      </div>

      {/* Signal Sources */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: t.label }}>
          Signal Sources
        </p>
        <div className="flex flex-wrap gap-1.5">
          {icp.signalSources.map((s) => (
            <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: t.cDim, border: `1px solid ${t.cEdge}`, color: t.c }}>
              {SOURCE_LABEL[s] ?? s}
            </span>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: t.label }}>
          Target Keywords
        </p>
        <div className="flex flex-wrap gap-1.5">
          {icp.keywords.slice(0, 8).map((k) => (
            <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: t.inset, border: `1px solid ${t.borderCard}`, color: t.textSub }}>
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Disqualifiers */}
      {icp.disqualifiers.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: t.label }}>
            Disqualifiers
          </p>
          <div className="flex flex-col gap-1">
            {icp.disqualifiers.slice(0, 4).map((d) => (
              <div key={d} className="flex items-start gap-1.5 text-[11px]" style={{ color: t.textSub }}>
                <span style={{ color: "#f87171", marginTop: 1, flexShrink: 0 }}>✕</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Routing Notes */}
      {icp.routingNotes && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: t.label }}>
            Routing Notes
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: t.textSub }}>
            {icp.routingNotes}
          </p>
        </div>
      )}

      {/* Fit factors */}
      {icp.scoringRules.fitFactors.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: t.label }}>
            Fit Factors
          </p>
          <div className="flex flex-col gap-1">
            {icp.scoringRules.fitFactors.slice(0, 4).map((f) => (
              <div key={f} className="flex items-start gap-1.5 text-[11px]" style={{ color: t.textSub }}>
                <span style={{ color: t.c, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source config preview */}
      <SourceConfigSection
        sources={icp.signalSources}
        keywordCount={icp.keywords.length}
        t={t}
      />
    </div>
  );
}

// ── Blurred fake signal row ─────────────────────────────────────
const FAKE_SIGNALS = [
  { company: "Meridian Systems Inc",  source: "LinkedIn",   fit: 94, disp: "Billable" },
  { company: "Vertex Capital Group",  source: "G2 Review",  fit: 87, disp: "Billable" },
  { company: "Strata Analytics Co",   source: "Job Boards", fit: 82, disp: "Intent"   },
  { company: "NovaBridge Solutions",  source: "Reddit",     fit: 76, disp: "Watchlist" },
];

function BlurredQueuePanel({ t }: { t: T }) {
  return (
    <div className="flex flex-col min-h-0 h-full" style={{ borderLeft: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}` }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 shrink-0"
        style={{ height: 40, borderBottom: `1px solid ${t.border}`, background: t.bar }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: t.label }}>
            Signal Queue
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", color: "#f59e0b" }}>
            Locked
          </span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: t.label }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      {/* Blurred signals + overlay */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Fake signal rows — blurred */}
        <div className="flex flex-col" style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
          {FAKE_SIGNALS.map((sig, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: `1px solid ${t.border}`, background: i % 2 === 0 ? "transparent" : t.inset }}>
              {/* Score dots */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold"
                  style={{ background: t.cDim, border: `1px solid ${t.cEdge}`, color: t.c }}>
                  {sig.fit}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold truncate" style={{ color: t.text }}>{sig.company}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: t.inset, border: `1px solid ${t.border}`, color: t.textSub }}>
                    {sig.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: t.textSub }}>████████ ████ ████████ ████████ ███████</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: sig.disp === "Billable" ? "rgba(52,211,153,0.10)" : sig.disp === "Intent" ? "rgba(251,191,36,0.10)" : "rgba(148,163,184,0.10)",
                      border: sig.disp === "Billable" ? "1px solid rgba(52,211,153,0.22)" : sig.disp === "Intent" ? "1px solid rgba(251,191,36,0.22)" : "1px solid rgba(148,163,184,0.20)",
                      color: sig.disp === "Billable" ? "#34d399" : sig.disp === "Intent" ? "#fbbf24" : "#94a3b8" }}>
                    {sig.disp}
                  </span>
                  <span className="text-[10px]" style={{ color: t.label }}>████████ · ████████</span>
                </div>
              </div>
            </div>
          ))}
          {/* Extra blurred rows for depth */}
          {[0, 1, 2].map((i) => (
            <div key={`pad-${i}`} className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: `1px solid ${t.border}`, opacity: 0.4 - i * 0.12 }}>
              <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: t.inset }} />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 rounded" style={{ background: t.textFaint, width: `${60 - i * 8}%` }} />
                <div className="h-2.5 rounded" style={{ background: t.textFaint, width: `${80 - i * 10}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: t.light ? "rgba(244,244,248,0.72)" : "rgba(7,7,14,0.72)", backdropFilter: "blur(2px)" }}>
          <div className="flex flex-col items-center gap-3 px-8 text-center max-w-xs">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", boxShadow: "0 0 24px rgba(245,158,11,0.10)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: t.text }}>
                Live signals are locked
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: t.textSub }}>
                Your ICP profile is configured. Activate your workspace to start receiving scored, routed signals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Activation Panel ────────────────────────────────────────────
const UNLOCKS = [
  { icon: "📡", label: "Live signal delivery",   sub: "Scored and de-duped in real time" },
  { icon: "👤", label: "Contact intelligence",   sub: "Full name, title, LinkedIn profile" },
  { icon: "🔗", label: "Source URLs & evidence", sub: "Direct links to every signal source" },
  { icon: "🗃️", label: "CRM sync",               sub: "Push verified signals to Salesforce/HubSpot" },
  { icon: "💬", label: "Slack routing",           sub: "Signal alerts delivered to your team" },
];

function ActivationPanel({ workspaceName, t }: { workspaceName: string; t: T }) {
  return (
    <div className="flex flex-col overflow-y-auto" style={{ padding: "16px 14px" }}>
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: t.label }}>
          Next Step
        </p>
        <p className="text-[14px] font-bold leading-snug" style={{ color: t.text }}>
          Activate {workspaceName}
        </p>
        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: t.textSub }}>
          Your ICP is ready. Book a 20-minute call to activate live signal delivery.
        </p>
      </div>

      {/* Unlock list */}
      <div className="flex flex-col gap-2 mb-5">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: t.label }}>
          What activates
        </p>
        {UNLOCKS.map(({ icon, label, sub }) => (
          <div key={label} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2"
            style={{ background: t.inset, border: `1px solid ${t.borderCard}` }}>
            <span className="text-[15px] mt-0.5 shrink-0">{icon}</span>
            <div>
              <p className="text-[11px] font-semibold" style={{ color: t.text }}>{label}</p>
              <p className="text-[10px]" style={{ color: t.textSub }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <a
        href="https://calendly.com/platos-io/15min"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-[13px] font-bold transition-all"
        style={{
          background: `linear-gradient(135deg, ${t.c}, ${t.light ? "#0077a8" : "#04a8bb"})`,
          color: "#07070e",
          boxShadow: t.shadowGlow,
          textDecoration: "none",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
        Book activation call
      </a>

      {/* Footer note */}
      <p className="text-center text-[10px] mt-3 leading-relaxed" style={{ color: t.label }}>
        20 min · No commitment · ICP reviewed live
      </p>
    </div>
  );
}

// ── Mobile preview ──────────────────────────────────────────────
function MobilePreview({ workspace, icp, t, onToggleTheme }: {
  workspace: WorkspaceContext;
  icp: IcpConfig | null;
  t: T;
  onToggleTheme: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Mobile header */}
      <header className="flex items-center justify-between px-4 shrink-0 border-b"
        style={{ height: 50, borderColor: t.border, background: t.bar }}>
        <div className="flex items-center gap-2">
          <PlatosLogo t={t} />
          <span className="font-bold text-sm tracking-tight" style={{ color: t.text }}>Plato's</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle t={t} onToggle={onToggleTheme} />
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", color: "#f59e0b" }}>
            Preview
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4 pb-8">
        {/* ICP card */}
        {icp && (
          <div className="rounded-xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.borderCard}`, boxShadow: t.shadowMd }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: t.border }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: t.label }}>
                Your ICP Profile
              </p>
            </div>
            <div className="p-4">
              <IcpPanel icp={icp} t={t} />
            </div>
          </div>
        )}

        {/* Locked signal preview */}
        <div className="rounded-xl overflow-hidden relative" style={{ background: t.card, border: `1px solid ${t.borderCard}`, boxShadow: t.shadowMd, height: 200 }}>
          <div style={{ filter: "blur(4px)", userSelect: "none", pointerEvents: "none" }}>
            {FAKE_SIGNALS.slice(0, 3).map((sig, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: t.cDim, color: t.c }}>{sig.fit}</div>
                <div>
                  <p className="text-[12px] font-medium" style={{ color: t.text }}>{sig.company}</p>
                  <p className="text-[10px]" style={{ color: t.textSub }}>{sig.source} · {sig.disp}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: t.light ? "rgba(244,244,248,0.75)" : "rgba(7,7,14,0.75)", backdropFilter: "blur(2px)" }}>
            <div className="flex flex-col items-center gap-2 text-center px-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <p className="text-[11px] font-semibold" style={{ color: t.text }}>Signal queue locked</p>
            </div>
          </div>
        </div>

        {/* Activation CTA */}
        <div className="rounded-xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.borderCard}`, boxShadow: t.shadowMd }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: t.border }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: t.label }}>
              Activate {workspace.name}
            </p>
          </div>
          <div className="p-4">
            <ActivationPanel workspaceName={workspace.name} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
interface Props {
  workspace: WorkspaceContext;
}

export function WorkspacePreview({ workspace }: Props) {
  const [isLight, setIsLight] = useState(false);
  const t = isLight ? LIGHT : DARK;
  const icp = workspace.icpConfig ?? null;

  return (
    <div className="h-screen w-screen overflow-hidden"
      style={{ background: t.page, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ════  MOBILE  ════ */}
      <div className="flex flex-col h-full md:hidden overflow-y-auto">
        <MobilePreview
          workspace={workspace}
          icp={icp}
          t={t}
          onToggleTheme={() => setIsLight((v) => !v)}
        />
      </div>

      {/* ════  DESKTOP  ════ */}
      <div className="hidden md:flex flex-col h-full">

        {/* Top bar */}
        <header className="flex items-center justify-between px-5 shrink-0"
          style={{
            height: 46,
            borderBottom: `1px solid ${t.border}`,
            background: t.light
              ? "linear-gradient(to bottom, #ffffff, #fafafd)"
              : "linear-gradient(to bottom, #0d0d20, #0a0a14)",
            boxShadow: t.light
              ? "0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)"
              : "0 1px 0 rgba(255,255,255,0.04), 0 2px 12px rgba(0,0,0,0.4)",
          }}>
          <div className="flex items-center gap-2.5">
            <PlatosLogo t={t} />
            <span className="font-bold text-sm tracking-tight" style={{ color: t.text }}>Plato's</span>
            <span style={{ color: t.label }} className="mx-1.5 text-sm">/</span>
            <span className="text-sm font-medium" style={{ color: t.textSub }}>{workspace.name}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle t={t} onToggle={() => setIsLight((v) => !v)} />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.26)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>Preview</span>
            </div>
          </div>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 min-h-0">

          {/* Left — ICP profile */}
          <div className="shrink-0 flex flex-col overflow-hidden"
            style={{ width: 280, borderRight: `1px solid ${t.border}` }}>
            <div className="flex items-center px-4 shrink-0"
              style={{ height: 40, borderBottom: `1px solid ${t.border}`, background: t.bar }}>
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: t.label }}>
                ICP Profile
              </span>
            </div>
            {icp ? (
              <IcpPanel icp={icp} t={t} />
            ) : (
              <div className="flex-1 flex items-center justify-center px-6 text-center">
                <p className="text-[12px]" style={{ color: t.textSub }}>
                  ICP configuration pending. Contact your Plato's rep to complete setup.
                </p>
              </div>
            )}
          </div>

          {/* Middle — Blurred signal queue */}
          <div className="flex-1 min-w-0">
            <BlurredQueuePanel t={t} />
          </div>

          {/* Right — Activation */}
          <div className="shrink-0 flex flex-col overflow-hidden"
            style={{ width: 264, borderLeft: `1px solid ${t.border}` }}>
            <div className="flex items-center px-4 shrink-0"
              style={{ height: 40, borderBottom: `1px solid ${t.border}`, background: t.bar }}>
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: t.label }}>
                Activate
              </span>
            </div>
            <ActivationPanel workspaceName={workspace.name} t={t} />
          </div>

        </div>
      </div>
    </div>
  );
}
