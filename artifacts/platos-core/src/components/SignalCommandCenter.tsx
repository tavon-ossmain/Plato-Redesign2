/**
 * Plato's Core — Signal Command Center
 * Full light / dark mode with consistent contrast throughout.
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

// ── Theme contract ──────────────────────────────────────────────
interface T {
  light: boolean;
  page: string;
  bar: string;
  rail: string;
  card: string;
  inset: string;
  border: string;
  borderCard: string;
  label: string;       // muted label text
  text: string;        // primary text
  textSub: string;     // secondary text
  textFaint: string;   // very faint text / dividers
  shadowSm: string;
  shadowMd: string;
  shadowGlow: string;  // cyan CTA glow
  c: string;           // cyan accent
  cDim: string;
  cMed: string;
  cEdge: string;
  cStrong: string;
}

const DARK: T = {
  light: false,
  page:        "#07070e",
  bar:         "#0a0a14",
  rail:        "linear-gradient(180deg,#0b0b1a 0%,#09091400 100%)",
  card:        "linear-gradient(145deg,#111128 0%,#0e0e20 100%)",
  inset:       "linear-gradient(145deg,#0d0d1e 0%,#0b0b18 100%)",
  border:      "rgba(255,255,255,0.04)",
  borderCard:  "rgba(255,255,255,0.06)",
  label:       "#5a5a78",
  text:        "#f4f4f6",
  textSub:     "#9898b0",
  textFaint:   "#2a2a3e",
  shadowSm:    "0 1px 3px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
  shadowMd:    "0 4px 12px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.05)",
  shadowGlow:  "0 0 24px rgba(6,208,228,0.14), 0 4px 12px rgba(0,0,0,0.60), 0 0 0 1px rgba(6,208,228,0.22)",
  c:           "#06d0e4",
  cDim:        "rgba(6,208,228,0.08)",
  cMed:        "rgba(6,208,228,0.15)",
  cEdge:       "rgba(6,208,228,0.22)",
  cStrong:     "rgba(6,208,228,0.38)",
};

const LIGHT: T = {
  light: true,
  page:        "#f2f3f7",
  bar:         "#ffffff",
  rail:        "linear-gradient(180deg,#ffffff 0%,#f7f7fc 100%)",
  card:        "linear-gradient(145deg,#ffffff 0%,#fafafd 100%)",
  inset:       "linear-gradient(145deg,#f5f5fa 0%,#ededf5 100%)",
  border:      "rgba(0,0,0,0.07)",
  borderCard:  "rgba(0,0,0,0.08)",
  label:       "#8888a4",
  text:        "#111118",
  textSub:     "#4a4a62",
  textFaint:   "#d4d4e0",
  shadowSm:    "0 1px 3px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)",
  shadowMd:    "0 4px 12px rgba(0,0,0,0.11), 0 0 0 1px rgba(0,0,0,0.06)",
  shadowGlow:  "0 0 24px rgba(0,153,168,0.20), 0 4px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,153,168,0.28)",
  c:           "#0099a8",
  cDim:        "rgba(0,153,168,0.08)",
  cMed:        "rgba(0,153,168,0.14)",
  cEdge:       "rgba(0,153,168,0.22)",
  cStrong:     "rgba(0,153,168,0.38)",
};

const R = 8;

// ── Static helpers ──────────────────────────────────────────────
const PROOF_STEPS = [
  { key: "captured", label: "Signal captured" },
  { key: "verified", label: "Source verified" },
  { key: "crm",      label: "CRM / dedupe checked" },
  { key: "model",    label: "Model path chosen" },
  { key: "routed",   label: "Routed to owner" },
  { key: "feedback", label: "Feedback received" },
];

// Disposition pill colours — two sets for dark/light
const DISP_DARK: Record<string, { label:string; bg:string; border:string; text:string; dot:string; shadow:string }> = {
  billable_opportunity: { label:"Billable Opportunity", bg:"rgba(52,211,153,0.10)",  border:"rgba(52,211,153,0.28)",  text:"#34d399", dot:"#34d399", shadow:"0 0 10px rgba(52,211,153,0.25)" },
  intent_update:        { label:"Intent Update",        bg:"rgba(34,211,238,0.10)",  border:"rgba(34,211,238,0.28)",  text:"#22d3ee", dot:"#22d3ee", shadow:"0 0 10px rgba(34,211,238,0.25)" },
  watchlist:            { label:"Watchlist",            bg:"rgba(251,191,36,0.10)",  border:"rgba(251,191,36,0.28)",  text:"#fbbf24", dot:"#fbbf24", shadow:"0 0 10px rgba(251,191,36,0.20)" },
  suppressed:           { label:"Suppressed",           bg:"rgba(113,113,122,0.08)", border:"rgba(113,113,122,0.22)", text:"#71717a", dot:"#71717a", shadow:"0 0 6px rgba(113,113,122,0.15)" },
};
const DISP_LIGHT: Record<string, { label:string; bg:string; border:string; text:string; dot:string; shadow:string }> = {
  billable_opportunity: { label:"Billable Opportunity", bg:"rgba(5,150,105,0.09)",  border:"rgba(5,150,105,0.22)",  text:"#059669", dot:"#059669", shadow:"0 0 8px rgba(5,150,105,0.18)" },
  intent_update:        { label:"Intent Update",        bg:"rgba(8,145,178,0.09)",  border:"rgba(8,145,178,0.22)",  text:"#0891b2", dot:"#0891b2", shadow:"0 0 8px rgba(8,145,178,0.18)" },
  watchlist:            { label:"Watchlist",            bg:"rgba(161,98,7,0.08)",   border:"rgba(161,98,7,0.22)",   text:"#92400e", dot:"#b45309", shadow:"0 0 8px rgba(161,98,7,0.15)"  },
  suppressed:           { label:"Suppressed",           bg:"rgba(113,113,122,0.07)",border:"rgba(113,113,122,0.18)",text:"#525262", dot:"#71717a", shadow:"none"                           },
};

function dispMeta(d: string, t: T) {
  const map = t.light ? DISP_LIGHT : DISP_DARK;
  return map[d] ?? (t.light ? DISP_LIGHT.suppressed : DISP_DARK.suppressed);
}

// Score colours — dark vs light
function scoreColor(n: number, light: boolean) {
  if (light) {
    if (n >= 85) return "#059669";
    if (n >= 70) return "#0891b2";
    if (n >= 55) return "#92400e";
    return "#dc2626";
  }
  if (n >= 85) return "#34d399";
  if (n >= 70) return "#22d3ee";
  if (n >= 55) return "#fbbf24";
  return "#f87171";
}
function scoreGlow(n: number, light: boolean) {
  if (light) {
    if (n >= 85) return "0 0 14px rgba(5,150,105,0.25)";
    if (n >= 70) return "0 0 14px rgba(8,145,178,0.25)";
    if (n >= 55) return "0 0 10px rgba(161,98,7,0.18)";
    return "0 0 10px rgba(220,38,38,0.18)";
  }
  if (n >= 85) return "0 0 18px rgba(52,211,153,0.35)";
  if (n >= 70) return "0 0 18px rgba(34,211,238,0.35)";
  if (n >= 55) return "0 0 18px rgba(251,191,36,0.30)";
  return "0 0 18px rgba(248,113,113,0.30)";
}

// Status dot colours
const STATUS_DOT_DARK: Record<string,string>  = { healthy:"#34d399", degraded:"#fbbf24", error:"#f87171" };
const STATUS_DOT_LIGHT: Record<string,string> = { healthy:"#16a34a", degraded:"#ca8a04", error:"#dc2626" };
const STATUS_GLOW_DARK: Record<string,string>  = { healthy:"0 0 6px rgba(52,211,153,0.5)",  degraded:"0 0 6px rgba(251,191,36,0.5)",  error:"0 0 6px rgba(248,113,113,0.5)"  };
const STATUS_GLOW_LIGHT: Record<string,string> = { healthy:"0 0 5px rgba(22,163,74,0.35)",  degraded:"0 0 5px rgba(202,138,4,0.35)",  error:"0 0 5px rgba(220,38,38,0.35)"   };

function statusDot(s: string, light: boolean)  { return (light ? STATUS_DOT_LIGHT : STATUS_DOT_DARK)[s]  ?? (light ? "#71717a" : "#71717a"); }
function statusGlow(s: string, light: boolean) { return (light ? STATUS_GLOW_LIGHT : STATUS_GLOW_DARK)[s] ?? "none"; }

// Company badge palettes
const BADGE_DARK = [
  { bg:"rgba(6,208,228,0.14)",   text:"#06d0e4", glow:"0 0 12px rgba(6,208,228,0.2)"    },
  { bg:"rgba(52,211,153,0.14)",  text:"#34d399", glow:"0 0 12px rgba(52,211,153,0.2)"   },
  { bg:"rgba(139,92,246,0.14)",  text:"#a78bfa", glow:"0 0 12px rgba(139,92,246,0.2)"   },
  { bg:"rgba(251,191,36,0.14)",  text:"#fbbf24", glow:"0 0 12px rgba(251,191,36,0.2)"   },
  { bg:"rgba(248,113,113,0.14)", text:"#f87171", glow:"0 0 12px rgba(248,113,113,0.2)"  },
];
const BADGE_LIGHT = [
  { bg:"rgba(0,153,168,0.10)",   text:"#0891b2", glow:"0 0 10px rgba(0,153,168,0.15)"   },
  { bg:"rgba(5,150,105,0.10)",   text:"#059669", glow:"0 0 10px rgba(5,150,105,0.15)"   },
  { bg:"rgba(109,40,217,0.10)",  text:"#7c3aed", glow:"0 0 10px rgba(109,40,217,0.15)"  },
  { bg:"rgba(161,98,7,0.10)",    text:"#92400e", glow:"0 0 10px rgba(161,98,7,0.15)"    },
  { bg:"rgba(185,28,28,0.10)",   text:"#dc2626", glow:"0 0 10px rgba(185,28,28,0.15)"   },
];

function badgePalette(name: string, light: boolean) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const arr = light ? BADGE_LIGHT : BADGE_DARK;
  return arr[h % arr.length];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ── Signal type ─────────────────────────────────────────────────
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

// ── Shared sub-components ───────────────────────────────────────
function SectionLabel({ children, t }: { children: React.ReactNode; t: T }) {
  return (
    <div className="text-[9px] uppercase tracking-widest mb-2.5 font-semibold"
      style={{ color: t.label, letterSpacing: "0.15em" }}>
      {children}
    </div>
  );
}

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
      style={{
        background: t.card,
        border: `1px solid ${t.borderCard}`,
        boxShadow: t.shadowSm,
        color: t.label,
      }}
    >
      {t.light ? (
        // Moon
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
        </svg>
      ) : (
        // Sun
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

function CompanyBadge({ name, size = 28, t }: { name: string; size?: number; t: T }) {
  const p = badgePalette(name, t.light);
  return (
    <div className="shrink-0 flex items-center justify-center font-bold"
      style={{
        width: size, height: size,
        background: p.bg,
        border: `1px solid ${p.text}30`,
        color: p.text,
        borderRadius: R,
        fontSize: size > 28 ? 12 : 10,
        letterSpacing: "0.02em",
        boxShadow: `${p.glow}, inset 0 1px 0 rgba(255,255,255,${t.light ? "0.6" : "0.06"})`,
      }}>
      {initials(name)}
    </div>
  );
}

function DispositionPill({ d, t }: { d: string; t: T }) {
  const m = dispMeta(d, t);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: m.bg,
        border: `1px solid ${m.border}`,
        color: m.text,
        borderRadius: 20,
        lineHeight: "1.4",
        boxShadow: m.shadow,
        letterSpacing: "0.01em",
      }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: m.dot, boxShadow: `0 0 5px ${m.dot}` }} />
      {m.label}
    </span>
  );
}

function ScoreKPI({ value, label, t }: { value: number; label: string; t: T }) {
  const c  = scoreColor(value, t.light);
  const g  = scoreGlow(value, t.light);
  return (
    <div className="flex flex-col items-center py-5 relative overflow-hidden"
      style={{
        background: t.card,
        border: `1px solid ${t.borderCard}`,
        borderRadius: R,
        boxShadow: t.shadowMd,
      }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${c}${t.light ? "18" : "10"} 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />
      <span className="text-[34px] font-bold tabular-nums leading-none mb-1.5 relative"
        style={{ color: c, textShadow: t.light ? "none" : g }}>
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-widest relative"
        style={{ color: t.label, letterSpacing: "0.14em" }}>
        {label}
      </span>
    </div>
  );
}

function SkeletonRow({ t }: { t: T }) {
  const bg1 = t.light ? "#e8e8f0" : "#13132a";
  const bg2 = t.light ? "#f0f0f8" : "#0f0f22";
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b"
      style={{ borderColor: t.border }}>
      <div className="w-7 h-7 rounded shrink-0" style={{ background: bg1, borderRadius: R }} />
      <div className="flex-1">
        <div className="h-2.5 w-32 rounded mb-2" style={{ background: bg1 }} />
        <div className="h-2 w-24 rounded" style={{ background: bg2 }} />
      </div>
      <div className="flex gap-1.5">
        <div className="h-2.5 w-6 rounded" style={{ background: bg1 }} />
        <div className="h-2.5 w-6 rounded" style={{ background: bg1 }} />
      </div>
    </div>
  );
}

function ProofStrip({ done, t }: { done: Set<string>; t: T }) {
  return (
    <div className="flex items-center gap-1">
      {PROOF_STEPS.map((step, i) => {
        const isDone = done.has(step.key);
        const isNext = !isDone && PROOF_STEPS.slice(0, i).every((s) => done.has(s.key));
        const trackDone = t.light
          ? `linear-gradient(90deg, ${t.c}cc, ${t.c}88)`
          : `linear-gradient(90deg, ${t.c}cc, ${t.c}88)`;
        const trackNext   = t.light ? `${t.c}20` : `${t.c}22`;
        const trackInert  = t.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)";
        const dotDone     = t.c;
        const dotNext     = t.light ? "#e8e8f4" : "#1e1e38";
        const dotInert    = t.light ? "#ebebf4" : "#12121e";
        const dotBorderNext  = t.light ? `${t.c}45` : `${t.c}35`;
        const dotBorderInert = t.light ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.06)";
        return (
          <div key={step.key} className="relative group flex-1">
            <div className="w-full h-[3px] rounded-full transition-all"
              style={{
                background: isDone ? trackDone : isNext ? trackNext : trackInert,
                boxShadow: isDone ? `0 0 6px ${t.c}50` : "none",
              }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: isDone ? dotDone : isNext ? dotNext : dotInert,
                border: `1px solid ${isDone ? t.c : isNext ? dotBorderNext : dotBorderInert}`,
                boxShadow: isDone ? `0 0 8px ${t.c}80, 0 0 2px ${t.c}` : "none",
              }} />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
              style={{
                background: t.card,
                border: `1px solid ${t.borderCard}`,
                color: isDone ? t.text : t.label,
                boxShadow: t.shadowMd,
              }}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatRow({ label, val, hi, t }: { label: string; val: string; hi: boolean; t: T }) {
  return (
    <div className="flex justify-between items-center mb-2 last:mb-0">
      <span className="text-[10px]" style={{ color: t.label }}>{label}</span>
      <span className="text-[11px] font-semibold tabular-nums"
        style={{ color: hi ? t.text : t.textFaint }}>
        {val}
      </span>
    </div>
  );
}

// ── Mobile Detail ───────────────────────────────────────────────
function MobileDetail({
  sig, isRouted, feedbackKey, done,
  onRoute, onFeedback, onBack, isAssigning, t,
}: {
  sig: Signal; isRouted: boolean; feedbackKey: string | null; done: Set<string>;
  onRoute: () => void; onFeedback: (key: string) => void;
  onBack: () => void; isAssigning: boolean; t: T;
}) {
  const routedBadgeBg     = t.light ? "rgba(5,150,105,0.09)"  : "rgba(52,211,153,0.10)";
  const routedBadgeBorder = t.light ? "rgba(5,150,105,0.22)"  : "rgba(52,211,153,0.25)";
  const routedBadgeText   = t.light ? "#059669"               : "#34d399";
  const routedBadgeGlow   = t.light ? "0 0 8px rgba(5,150,105,0.15)" : "0 0 8px rgba(52,211,153,0.2)";

  return (
    <div className="flex flex-col h-full" style={{ background: t.page }}>
      {/* Detail header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: t.border, background: t.bar, boxShadow: t.light ? "0 1px 0 rgba(0,0,0,0.06)" : "0 1px 0 rgba(255,255,255,0.04)" }}>
        <button onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: t.card, border: `1px solid ${t.borderCard}`, boxShadow: t.shadowSm }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.label} strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: t.text }}>{sig.company}</div>
          <div className="text-[10px]" style={{ color: t.label }}>{sig.contact.name} · {sig.source}</div>
        </div>
        <CompanyBadge name={sig.company} size={32} t={t} />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <DispositionPill d={sig.disposition} t={t} />
            {isRouted && (
              <span className="text-[11px] px-2.5 py-1 font-semibold"
                style={{ background: routedBadgeBg, border: `1px solid ${routedBadgeBorder}`, color: routedBadgeText, borderRadius: 20, boxShadow: routedBadgeGlow }}>
                → {sig.owner.split(" ")[0]}
              </span>
            )}
            <span className="text-xs font-semibold" style={{ color: t.c }}>{sig.contact.name}</span>
            <span style={{ color: t.textFaint }}>·</span>
            <span className="text-xs" style={{ color: t.textSub }}>{sig.contact.title}</span>
          </div>

          {/* Evidence */}
          <div className="mb-3 p-4 relative overflow-hidden"
            style={{
              background: t.inset,
              border: `1px solid ${t.borderCard}`,
              borderLeft: `3px solid ${t.c}`,
              borderRadius: R,
              boxShadow: `${t.shadowMd}, inset 0 0 40px rgba(${t.light ? "0,153,168" : "6,208,228"},0.03)`,
            }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, rgba(${t.light ? "0,153,168" : "6,208,228"},${t.light ? "0.04" : "0.04"}) 0%, transparent 50%)`,
              pointerEvents: "none",
            }} />
            <SectionLabel t={t}>Source Evidence · {sig.source}</SectionLabel>
            <p className="text-sm leading-relaxed italic mb-3 relative" style={{ color: t.text }}>
              &ldquo;{sig.evidenceSnippet}&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-3 border-t text-[10px] relative"
              style={{ borderColor: t.border }}>
              <span style={{ color: t.label }}>Seen {formatTime(sig.seenAt)}</span>
              <span style={{ color: t.textFaint }}>·</span>
              <span className="truncate" style={{ color: t.c, opacity: 0.75 }}>{sig.sourceUrl}</span>
            </div>
          </div>

          {/* Why Now */}
          <div className="mb-4 p-3.5"
            style={{ background: t.inset, border: `1px solid ${t.borderCard}`, borderRadius: R, boxShadow: t.shadowSm }}>
            <SectionLabel t={t}>Why Now</SectionLabel>
            <p className="text-sm leading-relaxed" style={{ color: t.textSub }}>{sig.whyNow}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <ScoreKPI value={sig.fitScore}        label="Fit"        t={t} />
            <ScoreKPI value={sig.confidenceScore} label="Confidence" t={t} />
            <ScoreKPI value={sig.freshnessScore}  label="Freshness"  t={t} />
          </div>

          {/* Proof */}
          <div className="mb-4 p-3.5"
            style={{ background: t.inset, border: `1px solid ${t.borderCard}`, borderRadius: R, boxShadow: t.shadowSm }}>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel t={t}>Proof</SectionLabel>
              <span className="text-[9px] font-mono" style={{ color: t.label }}>
                {PROOF_STEPS.filter((s) => done.has(s.key)).length}/{PROOF_STEPS.length}
              </span>
            </div>
            <ProofStrip done={done} t={t} />
          </div>

          {/* Mark As */}
          <div className="mb-4">
            <SectionLabel t={t}>Mark As</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "duplicate",      label: "Duplicate"      },
                { key: "outdated",       label: "Outdated"       },
                { key: "better_contact", label: "Better Contact" },
                { key: "watchlist",      label: "Watchlist"      },
              ].map((item) => {
                const isActive = feedbackKey === item.key;
                return (
                  <button key={item.key} onClick={() => onFeedback(item.key)}
                    className="px-3 py-3 text-sm font-medium text-left transition-all"
                    style={{
                      background: isActive ? t.card : t.card,
                      border: isActive ? `1px solid ${t.borderCard}` : `1px solid ${t.border}`,
                      color: isActive ? t.text : t.label,
                      borderRadius: R,
                      boxShadow: isActive ? t.shadowMd : t.shadowSm,
                    }}>
                    {isActive && <span className="mr-2" style={{ color: t.light ? "#059669" : "#34d399" }}>✓</span>}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {feedbackKey && (
              <div className="mt-2 px-3 py-2 text-[10px] text-center"
                style={{ background: t.inset, border: `1px solid ${t.borderCard}`, borderRadius: R, color: t.label }}>
                Feedback sent · {feedbackKey.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="shrink-0 px-4 py-3 border-t"
        style={{ borderColor: t.border, background: t.bar, boxShadow: t.light ? "0 -1px 0 rgba(0,0,0,0.06)" : "0 -1px 0 rgba(255,255,255,0.04)" }}>
        <button onClick={onRoute} disabled={isAssigning}
          className="w-full py-3.5 text-sm font-bold mb-2 transition-all"
          style={{
            background: isRouted ? t.cDim : `linear-gradient(135deg, ${t.cMed} 0%, ${t.cDim} 100%)`,
            border: `1px solid ${isRouted ? t.cEdge : t.cStrong}`,
            color: t.c,
            borderRadius: R,
            boxShadow: isRouted ? "none" : t.shadowGlow,
            opacity: isAssigning ? 0.6 : 1,
            letterSpacing: "0.01em",
          }}>
          {isRouted ? <><span style={{ opacity: 0.45, marginRight: 8 }}>✓</span>Re-route to Owner</> : "Route to Owner →"}
        </button>
        <div className="flex gap-2">
          <button className="flex-1 py-3 text-sm font-medium"
            style={{ background: t.cDim, border: `1px solid ${t.cEdge}`, color: t.c, borderRadius: R, opacity: 0.85 }}>
            Start Outreach
          </button>
          <a href={sig.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-3 text-sm font-medium text-center"
            style={{ background: t.card, border: `1px solid ${t.borderCard}`, color: t.label, borderRadius: R, boxShadow: t.shadowSm }}>
            View Source
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Mobile List ─────────────────────────────────────────────────
function MobileList({
  signals, isLoading, isError, filter, filters, routedMap, t,
  onSelect, onFilter,
}: {
  signals: Signal[]; isLoading: boolean; isError: boolean;
  filter: string | null;
  filters: { key: string | null; label: string; count: number }[];
  routedMap: Record<string, boolean>;
  t: T;
  onSelect: (s: Signal) => void;
  onFilter: (k: string | null) => void;
}) {
  const routedBadgeBg     = t.light ? "rgba(5,150,105,0.09)"  : "rgba(52,211,153,0.10)";
  const routedBadgeBorder = t.light ? "rgba(5,150,105,0.20)"  : "rgba(52,211,153,0.22)";
  const routedBadgeText   = t.light ? "#059669"               : "#34d399";
  const routedBadgeGlow   = t.light ? "0 0 6px rgba(5,150,105,0.15)" : "0 0 6px rgba(52,211,153,0.18)";

  return (
    <div className="flex flex-col h-full" style={{ background: t.page }}>
      {/* Filter tabs */}
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 border-b overflow-x-auto"
        style={{ borderColor: t.border, background: t.bar }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1"
          style={{
            background: `linear-gradient(135deg, ${t.cMed} 0%, ${t.cDim} 100%)`,
            border: `1px solid ${t.cEdge}`,
            color: t.c,
            borderRadius: 20,
            boxShadow: t.light ? `0 0 12px rgba(0,153,168,0.12)` : `0 0 12px rgba(6,208,228,0.12)`,
          }}>
          <span style={{ fontSize: 6 }}>●</span>
          Feed
        </div>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button key={String(f.key)} onClick={() => onFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs shrink-0 transition-all"
              style={{
                background: active ? t.card : "transparent",
                border: active ? `1px solid ${t.borderCard}` : "1px solid transparent",
                color: active ? t.text : t.label,
                borderRadius: 20,
                boxShadow: active ? t.shadowSm : "none",
                fontWeight: active ? 600 : 400,
              }}>
              {f.label}
              <span className="text-[9px] font-mono px-1.5 rounded-full"
                style={{
                  background: t.light
                    ? (active ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.04)")
                    : (active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"),
                  color: active ? t.textSub : t.label,
                  minWidth: 18, textAlign: "center",
                }}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <><SkeletonRow t={t} /><SkeletonRow t={t} /><SkeletonRow t={t} /></>}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="text-sm font-medium mb-1" style={{ color: t.light ? "#dc2626" : "#f87171" }}>⚠ Could not load signals</div>
            <div className="text-xs" style={{ color: t.label }}>Check API connectivity and retry.</div>
          </div>
        )}

        {!isLoading && !isError && signals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No signals in queue</div>
            <div className="text-xs text-center" style={{ color: t.label }}>
              {filter ? "Try a different filter." : "New signals will appear here as they're verified."}
            </div>
          </div>
        )}

        {!isLoading && !isError && signals.map((sig) => {
          const m = dispMeta(sig.disposition, t);
          const isRouted = routedMap[sig.id] ?? sig.route === "routed";
          return (
            <button key={sig.id} onClick={() => onSelect(sig)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left border-b active:opacity-70 transition-opacity"
              style={{ borderColor: t.border, background: "transparent" }}>
              <CompanyBadge name={sig.company} size={36} t={t} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold truncate" style={{ color: t.text }}>{sig.company}</span>
                  {isRouted && (
                    <span className="text-[10px] px-1.5 py-0.5 font-semibold shrink-0"
                      style={{ background: routedBadgeBg, border: `1px solid ${routedBadgeBorder}`, color: routedBadgeText, borderRadius: 20, boxShadow: routedBadgeGlow }}>
                      → {sig.owner.split(" ")[0]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: m.text }}>{m.label}</span>
                  <span style={{ color: t.textFaint, fontSize: 10 }}>·</span>
                  <span className="text-[11px] truncate" style={{ color: t.textSub }}>{sig.contact.name}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: t.label }}>{formatTime(sig.seenAt)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore, t.light) }}>{sig.fitScore}</span>
                  <span style={{ color: t.label, fontSize: 10 }}>·</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore, t.light) }}>{sig.confidenceScore}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.label} strokeWidth="2.5" strokeLinecap="round">
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
export function SignalCommandCenter({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useGetWorkspaceDashboard(workspaceId);
  const { data: rawSignals, isLoading: pipelineLoading, isError: pipelineError } = useGetWorkspacePipeline(workspaceId);

  const assignMutation   = useAssignOpportunity();
  const feedbackMutation = useSubmitFeedback();

  const [isLight,           setIsLight]           = useState(false);
  const [routedOverrides,   setRoutedOverrides]   = useState<Record<string, boolean>>({});
  const [feedbackOverrides, setFeedbackOverrides] = useState<Record<string, string>>({});
  const [filter,            setFilter]            = useState<string | null>(null);
  const [mobileDetail,      setMobileDetail]      = useState<Signal | null>(null);
  const [selected,          setSelected]          = useState<Signal | null>(null);

  const t = isLight ? LIGHT : DARK;

  const signals: Signal[] = (rawSignals as Signal[] | undefined) ?? [];
  const allSignals = filter ? signals.filter((s) => s.disposition === filter) : signals;
  const activeSig  = mobileDetail ?? selected ?? signals[0] ?? null;

  function countByDisp(key: string) { return signals.filter((s) => s.disposition === key).length; }

  const FILTERS = [
    { key: null,                   label: "All",     count: signals.length },
    { key: "billable_opportunity", label: "Billable", count: countByDisp("billable_opportunity") },
    { key: "intent_update",        label: "Intent",   count: countByDisp("intent_update") },
    { key: "watchlist",            label: "Watch",    count: countByDisp("watchlist") },
  ];

  function getIsRouted(sig: Signal) { return routedOverrides[sig.id] ?? sig.route === "routed"; }
  function getFeedbackKey(sig: Signal): string | null { return feedbackOverrides[sig.id] ?? sig.feedback ?? null; }

  function handleRoute(sig: Signal) {
    setRoutedOverrides((p) => ({ ...p, [sig.id]: true }));
    assignMutation.mutate(
      { workspaceId: workspaceId, opportunityId: sig.id, data: { owner: sig.owner } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWorkspacePipelineQueryKey(workspaceId) }) },
    );
  }

  function handleFeedback(sig: Signal, key: string) {
    setFeedbackOverrides((p) => ({ ...p, [sig.id]: key }));
    feedbackMutation.mutate(
      { data: { signalId: sig.id, workspaceId: workspaceId, feedback: key } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWorkspacePipelineQueryKey(workspaceId) }) },
    );
  }

  function getDoneSet(sig: Signal | null): Set<string> {
    const d = new Set<string>(["captured", "verified", "crm", "model"]);
    if (sig && getIsRouted(sig)) d.add("routed");
    if (sig && getFeedbackKey(sig)) d.add("feedback");
    return d;
  }

  const ws = { name: "Acme Corp", quota: dashboard?.quota ?? 200, used: dashboard?.used ?? 0 };
  const quotaPct  = Math.round((ws.used / ws.quota) * 100);
  const quotaColor = t.light
    ? (quotaPct > 90 ? "#dc2626" : quotaPct > 70 ? "#ca8a04" : t.c)
    : (quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : t.c);

  const routedBadgeBg     = t.light ? "rgba(5,150,105,0.09)"  : "rgba(52,211,153,0.10)";
  const routedBadgeBorder = t.light ? "rgba(5,150,105,0.22)"  : "rgba(52,211,153,0.22)";
  const routedBadgeText   = t.light ? "#059669"               : "#34d399";
  const routedBadgeGlow   = t.light ? "0 0 6px rgba(5,150,105,0.15)" : "0 0 6px rgba(52,211,153,0.2)";
  const checkColor        = t.light ? "#059669" : "#34d399";

  return (
    <div className="h-screen w-screen overflow-hidden"
      style={{ background: t.page, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ════  MOBILE  ════ */}
      <div className="flex flex-col h-full md:hidden">
        <header className="flex items-center justify-between px-4 shrink-0 border-b"
          style={{ height: 50, borderColor: t.border, background: t.bar, boxShadow: t.light ? "0 1px 0 rgba(0,0,0,0.06)" : "0 1px 0 rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2">
            <PlatosLogo t={t} />
            <span className="font-bold text-sm tracking-tight" style={{ color: t.text }}>Plato's</span>
            {mobileDetail && (
              <>
                <span style={{ color: t.label }} className="mx-1 text-sm">/</span>
                <span className="text-sm truncate max-w-[140px]" style={{ color: t.textSub }}>{mobileDetail.company}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle t={t} onToggle={() => setIsLight((v) => !v)} />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: t.cDim, border: `1px solid ${t.cEdge}` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.c, boxShadow: `0 0 6px ${t.c}` }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.c }}>Live</span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: t.card, border: `1px solid ${t.borderCard}`, boxShadow: t.shadowSm, color: t.textSub }}>
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
              t={t}
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
              t={t}
            />
          )}
        </div>
      </div>

      {/* ════  DESKTOP  ════ */}
      <div className="hidden md:flex flex-col h-full">

        {/* Top bar */}
        <header className="flex items-center justify-between px-5 shrink-0"
          style={{
            height: 46,
            borderBottom: `1px solid ${t.border}`,
            background: t.light
              ? `linear-gradient(to bottom, #ffffff, #fafafd)`
              : `linear-gradient(to bottom, #0d0d20, ${t.bar})`,
            boxShadow: t.light ? "0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)" : "0 1px 0 rgba(255,255,255,0.04), 0 2px 12px rgba(0,0,0,0.4)",
          }}>
          <div className="flex items-center gap-2.5">
            <PlatosLogo t={t} />
            <span className="font-bold text-sm tracking-tight" style={{ color: t.text }}>Plato's</span>
            <span style={{ color: t.label }} className="mx-1.5 text-sm">/</span>
            <span className="text-sm font-medium" style={{ color: t.textSub }}>Signal Command Center</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle t={t} onToggle={() => setIsLight((v) => !v)} />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: t.cDim, border: `1px solid ${t.cEdge}`, boxShadow: `0 0 16px rgba(${t.light ? "0,153,168" : "6,208,228"},0.10)` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.c, boxShadow: `0 0 6px ${t.c}` }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.c }}>Live</span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: t.card, border: `1px solid ${t.borderCard}`, boxShadow: t.shadowSm, color: t.textSub }}>
              AR
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">

          {/* Left Rail */}
          <aside className="flex flex-col shrink-0 border-r overflow-y-auto"
            style={{ width: 200, borderColor: t.border, background: t.rail }}>

            <div className="px-4 py-4 border-b" style={{ borderColor: t.border }}>
              <SectionLabel t={t}>Workspace</SectionLabel>
              <div className="text-sm font-bold leading-tight" style={{ color: t.text }}>{ws.name}</div>
              <div className="text-[10px] mt-0.5 font-medium" style={{ color: t.label }}>Growth plan</div>
            </div>

            <div className="px-4 py-4 border-b" style={{ borderColor: t.border }}>
              <SectionLabel t={t}>Weekly Quota</SectionLabel>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-[30px] font-bold tabular-nums leading-none" style={{ color: t.text }}>
                  {ws.used}
                </span>
                <span className="text-xs font-medium" style={{ color: t.label }}>/ {ws.quota}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2"
                style={{ background: t.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${quotaPct}%`,
                    background: `linear-gradient(90deg, ${quotaColor}cc, ${quotaColor})`,
                    boxShadow: `0 0 8px ${quotaColor}${t.light ? "60" : "80"}`,
                  }} />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-medium" style={{ color: t.label }}>{quotaPct}% used</span>
                <span className="text-[10px] font-medium" style={{ color: t.label }}>{ws.quota - ws.used} left</span>
              </div>
            </div>

            <div className="px-4 py-4 border-b" style={{ borderColor: t.border }}>
              <SectionLabel t={t}>Source Health</SectionLabel>
              {dashLoading
                ? <div className="h-2 w-24 rounded" style={{ background: t.light ? "#e8e8f0" : "#13132a" }} />
                : (dashboard?.sources ?? []).map((s) => (
                    <div key={s.name} className="flex items-center justify-between mb-3 last:mb-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: statusDot(s.status, t.light), boxShadow: statusGlow(s.status, t.light) }} />
                        <span className="text-[11px] font-medium" style={{ color: t.textSub }}>{s.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold" style={{ color: t.label }}>{s.yield}%</span>
                    </div>
                  ))}
            </div>

            <div className="px-4 py-4">
              <SectionLabel t={t}>Signal Health</SectionLabel>
              <StatRow label="Billable Opps"    val={dashboard?.billableOpportunities?.toString() ?? "—"} hi={true}  t={t} />
              <StatRow label="Intent Updates"   val={dashboard?.intentUpdates?.toString() ?? "—"}          hi={false} t={t} />
              <StatRow label="Dupes Suppressed" val={dashboard?.duplicatesSuppressed?.toString() ?? "—"}  hi={false} t={t} />
              <StatRow label="Raw Scanned"      val={dashboard?.rawScanned?.toLocaleString() ?? "—"}      hi={false} t={t} />
            </div>
          </aside>

          {/* Center */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">

            {/* Queue header */}
            <div className="border-b shrink-0"
              style={{
                borderColor: t.border,
                background: t.light ? `linear-gradient(to bottom, #fafafd, #f7f7fc)` : `linear-gradient(to bottom, #0b0b1a, #09091200)`,
              }}>
              <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: t.border }}>
                {/* Feed pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: `linear-gradient(135deg, ${t.cMed} 0%, ${t.cDim} 100%)`,
                    border: `1px solid ${t.cEdge}`,
                    color: t.c,
                    borderRadius: 20,
                    boxShadow: `0 0 14px rgba(${t.light ? "0,153,168" : "6,208,228"},0.12)`,
                  }}>
                  <span style={{ fontSize: 6 }}>●</span>
                  Signal Feed
                </div>
                <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: t.label }}>
                  Detected · Verified · Routed
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                      <button key={String(f.key)} onClick={() => setFilter(f.key)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] transition-all"
                        style={{
                          background: active ? t.card : "transparent",
                          border: active ? `1px solid ${t.borderCard}` : "1px solid transparent",
                          color: active ? t.text : t.label,
                          borderRadius: 20,
                          boxShadow: active ? t.shadowSm : "none",
                          fontWeight: active ? 600 : 400,
                        }}>
                        {f.label}
                        <span className="text-[9px] font-mono px-1.5 rounded-full"
                          style={{
                            background: t.light
                              ? (active ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.04)")
                              : (active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"),
                            color: active ? t.textSub : t.label,
                            minWidth: 18, textAlign: "center",
                          }}>
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Signal rows */}
              <div className="overflow-y-auto" style={{ maxHeight: 172 }}>
                {pipelineLoading && <><SkeletonRow t={t} /><SkeletonRow t={t} /><SkeletonRow t={t} /><SkeletonRow t={t} /></>}
                {!pipelineLoading && pipelineError && (
                  <div className="flex flex-col items-center justify-center py-6 px-4">
                    <div className="text-sm font-medium mb-1" style={{ color: t.light ? "#dc2626" : "#f87171" }}>⚠ Could not load signals</div>
                    <div className="text-[10px]" style={{ color: t.label }}>Check API connectivity and retry.</div>
                  </div>
                )}
                {!pipelineLoading && !pipelineError && allSignals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="text-xs font-medium mb-1" style={{ color: t.textSub }}>No signals in queue</div>
                    <div className="text-[10px] text-center max-w-48" style={{ color: t.label }}>
                      {filter ? "Try a different filter or check source health." : "New signals will appear here as they're verified."}
                    </div>
                  </div>
                )}
                {!pipelineLoading && !pipelineError && allSignals.map((sig) => {
                  const m = dispMeta(sig.disposition, t);
                  const isActive  = (selected ?? signals[0])?.id === sig.id;
                  const isRouted_ = getIsRouted(sig);
                  return (
                    <button key={sig.id} onClick={() => setSelected(sig)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b transition-all"
                      style={{
                        borderColor: t.border,
                        background: isActive
                          ? t.light
                            ? `linear-gradient(90deg, rgba(0,153,168,0.06) 0%, rgba(0,153,168,0.02) 60%, transparent 100%)`
                            : `linear-gradient(90deg, rgba(6,208,228,0.06) 0%, rgba(6,208,228,0.02) 60%, transparent 100%)`
                          : "transparent",
                        borderLeft: `2px solid ${isActive ? t.c : "transparent"}`,
                      }}>
                      <CompanyBadge name={sig.company} t={t} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold truncate" style={{ color: isActive ? t.text : t.textSub }}>{sig.company}</span>
                          <span className="text-[10px] font-semibold shrink-0" style={{ color: m.text }}>{m.label}</span>
                          {isRouted_ && (
                            <span className="text-[9px] px-1.5 py-0.5 font-semibold shrink-0"
                              style={{ background: routedBadgeBg, border: `1px solid ${routedBadgeBorder}`, color: routedBadgeText, borderRadius: 20, boxShadow: routedBadgeGlow }}>
                              → {sig.owner.split(" ")[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] block truncate font-medium" style={{ color: t.label }}>
                          {sig.contact.name} · {sig.source} · {formatTime(sig.seenAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore, t.light) }}>{sig.fitScore}</span>
                        <span style={{ color: t.label, fontSize: 10 }}>·</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore, t.light) }}>{sig.confidenceScore}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signal detail */}
            {activeSig && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-5">
                    <CompanyBadge name={activeSig.company} size={40} t={t} />
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold tracking-tight leading-tight mb-2" style={{ color: t.text }}>{activeSig.company}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DispositionPill d={activeSig.disposition} t={t} />
                        {activeSig.dedupeStatus === "duplicate" && (
                          <span className="text-[10px] px-2.5 py-1 font-semibold"
                            style={{
                              background: t.light ? "rgba(161,98,7,0.09)" : "rgba(251,191,36,0.10)",
                              border: t.light ? "1px solid rgba(161,98,7,0.22)" : "1px solid rgba(251,191,36,0.25)",
                              color: t.light ? "#92400e" : "#fbbf24",
                              borderRadius: 20,
                            }}>
                            Duplicate
                          </span>
                        )}
                        {activeSig.crmStatus === "clean" && activeSig.dedupeStatus === "unique" && (
                          <span className="text-[10px] px-2.5 py-1 font-medium"
                            style={{ background: t.card, border: `1px solid ${t.borderCard}`, color: t.label, borderRadius: 20, boxShadow: t.shadowSm }}>
                            CRM Clean
                          </span>
                        )}
                        <span className="text-xs font-semibold" style={{ color: t.c }}>{activeSig.contact.name}</span>
                        <span style={{ color: t.textFaint }}>·</span>
                        <span className="text-xs" style={{ color: t.textSub }}>{activeSig.contact.title}</span>
                        <span style={{ color: t.textFaint }}>·</span>
                        <span className="text-xs" style={{ color: t.textSub }}>{activeSig.source}</span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="mb-3 p-4 relative overflow-hidden"
                    style={{
                      background: t.inset,
                      border: `1px solid ${t.borderCard}`,
                      borderLeft: `3px solid ${t.c}`,
                      borderRadius: R,
                      boxShadow: `${t.shadowMd}, inset 0 0 60px rgba(${t.light ? "0,153,168" : "6,208,228"},0.025)`,
                    }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: `linear-gradient(135deg, rgba(${t.light ? "0,153,168" : "6,208,228"},${t.light ? "0.03" : "0.035"}) 0%, transparent 45%)`,
                      pointerEvents: "none",
                    }} />
                    <SectionLabel t={t}>Source Evidence · {activeSig.source}</SectionLabel>
                    <p className="text-sm leading-relaxed italic mb-3 relative" style={{ color: t.text }}>
                      &ldquo;{activeSig.evidenceSnippet}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t text-[10px] relative"
                      style={{ borderColor: t.border }}>
                      <span style={{ color: t.label }}>Seen {formatTime(activeSig.seenAt)}</span>
                      <span style={{ color: t.textFaint }}>·</span>
                      <span style={{ color: t.label }}>Verified {formatTime(activeSig.lastVerifiedAt)}</span>
                      <span style={{ color: t.textFaint }}>·</span>
                      <span className="truncate" style={{ color: t.c, opacity: 0.75 }}>{activeSig.sourceUrl}</span>
                    </div>
                  </div>

                  {/* Why Now */}
                  <div className="mb-4 p-3.5"
                    style={{ background: t.inset, border: `1px solid ${t.borderCard}`, borderRadius: R, boxShadow: t.shadowSm }}>
                    <SectionLabel t={t}>Why Now</SectionLabel>
                    <p className="text-xs leading-relaxed" style={{ color: t.textSub }}>{activeSig.whyNow}</p>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <ScoreKPI value={activeSig.fitScore}        label="Fit Score"  t={t} />
                    <ScoreKPI value={activeSig.confidenceScore} label="Confidence" t={t} />
                    <ScoreKPI value={activeSig.freshnessScore}  label="Freshness"  t={t} />
                  </div>

                  {/* Route info */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5"
                      style={{ background: t.inset, border: `1px solid ${t.borderCard}`, borderRadius: R, boxShadow: t.shadowSm }}>
                      <SectionLabel t={t}>Recommended Channel</SectionLabel>
                      <div className="text-xs font-medium" style={{ color: t.textSub }}>{activeSig.recommendedChannel}</div>
                    </div>
                    <div className="p-3.5"
                      style={{ background: t.inset, border: `1px solid ${t.borderCard}`, borderRadius: R, boxShadow: t.shadowSm }}>
                      <SectionLabel t={t}>Owner</SectionLabel>
                      <div className="text-xs font-semibold"
                        style={{ color: getIsRouted(activeSig) ? (t.light ? "#059669" : "#34d399") : t.textFaint }}>
                        {getIsRouted(activeSig) ? activeSig.owner : "Unassigned"}
                        {getIsRouted(activeSig) && (
                          <span className="font-normal" style={{ color: t.light ? "#05966960" : "#34d39960" }}> · Routed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Rail */}
          <aside className="flex flex-col shrink-0 border-l overflow-y-auto"
            style={{ width: 260, borderColor: t.border, background: t.rail }}>

            {/* Primary CTA */}
            <div className="px-4 py-4 border-b" style={{ borderColor: t.border }}>
              <button
                onClick={() => activeSig && handleRoute(activeSig)}
                disabled={!activeSig || assignMutation.isPending}
                className="w-full px-4 py-3 text-sm font-bold text-left transition-all mb-2.5"
                style={{
                  background: activeSig && getIsRouted(activeSig)
                    ? t.cDim
                    : `linear-gradient(135deg, ${t.cMed} 0%, ${t.cDim} 100%)`,
                  border: `1px solid ${activeSig && getIsRouted(activeSig) ? t.cEdge : t.cStrong}`,
                  color: t.c,
                  borderRadius: R,
                  boxShadow: activeSig && getIsRouted(activeSig) ? "none" : t.shadowGlow,
                  opacity: !activeSig || assignMutation.isPending ? 0.6 : 1,
                  letterSpacing: "0.01em",
                }}>
                {activeSig && getIsRouted(activeSig)
                  ? <><span style={{ opacity: 0.4, marginRight: 8 }}>✓</span>Re-route to Owner</>
                  : "Route to Owner →"}
              </button>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2.5 text-xs font-semibold text-left"
                  style={{ background: t.cDim, border: `1px solid ${t.cEdge}`, color: t.c, borderRadius: R, opacity: 0.85 }}>
                  Start Outreach
                </button>
                {activeSig ? (
                  <a href={activeSig.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 px-3 py-2.5 text-xs font-medium text-center"
                    style={{ background: t.card, border: `1px solid ${t.borderCard}`, color: t.label, borderRadius: R, boxShadow: t.shadowSm }}>
                    View Source
                  </a>
                ) : (
                  <button className="flex-1 px-3 py-2.5 text-xs font-medium"
                    style={{ background: t.card, border: `1px solid ${t.borderCard}`, color: t.label, borderRadius: R, boxShadow: t.shadowSm }}>
                    View Source
                  </button>
                )}
              </div>
            </div>

            {/* Proof */}
            <div className="px-4 py-3.5 border-b" style={{ borderColor: t.border }}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel t={t}>Proof Chain</SectionLabel>
                <span className="text-[9px] font-mono font-semibold" style={{ color: t.label }}>
                  {activeSig ? PROOF_STEPS.filter((s) => getDoneSet(activeSig).has(s.key)).length : 4}/{PROOF_STEPS.length}
                </span>
              </div>
              <ProofStrip done={getDoneSet(activeSig)} t={t} />
            </div>

            {/* Mark As */}
            <div className="px-4 py-4 border-b" style={{ borderColor: t.border }}>
              <SectionLabel t={t}>Mark As</SectionLabel>
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
                      className="w-full px-3 py-2.5 text-xs font-medium text-left transition-all"
                      style={{
                        background: t.card,
                        border: isActive ? `1px solid ${t.borderCard}` : `1px solid ${t.border}`,
                        color: isActive ? t.text : t.label,
                        borderRadius: R,
                        boxShadow: isActive ? t.shadowMd : t.shadowSm,
                      }}>
                      {isActive && <span className="mr-2" style={{ color: checkColor }}>✓</span>}
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {activeSig && getFeedbackKey(activeSig) && (
                <div className="mt-2.5 px-3 py-2 text-[10px] text-center"
                  style={{ background: t.inset, border: `1px solid ${t.borderCard}`, borderRadius: R, color: t.label }}>
                  Feedback sent · {getFeedbackKey(activeSig)!.replace(/_/g, " ")}
                </div>
              )}
            </div>

            {/* Source Yield */}
            <div className="px-4 py-4">
              <SectionLabel t={t}>Source Yield</SectionLabel>
              {dashLoading
                ? <div className="h-2 w-full rounded" style={{ background: t.light ? "#e8e8f0" : "#13132a" }} />
                : (dashboard?.sources ?? []).map((src) => {
                    const dot = statusDot(src.status, t.light);
                    return (
                      <div key={src.name} className="mb-3.5 last:mb-0">
                        <div className="flex justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: dot, boxShadow: statusGlow(src.status, t.light) }} />
                            <span className="text-[10px] font-medium" style={{ color: t.textSub }}>{src.name}</span>
                          </div>
                          <span className="text-[10px] font-mono font-semibold" style={{ color: t.label }}>{src.yield}%</span>
                        </div>
                        <div className="h-[3px] rounded-full overflow-hidden"
                          style={{ background: t.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${src.yield}%`,
                              background: `linear-gradient(90deg, ${dot}99, ${dot})`,
                              boxShadow: `0 0 6px ${dot}60`,
                            }} />
                        </div>
                      </div>
                    );
                  })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
