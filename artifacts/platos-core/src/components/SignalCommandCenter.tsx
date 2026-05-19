/**
 * Plato's Core — Signal Command Center
 * Polished: elevation, shadows, gradient CTAs, glows — HubSpot/SF Lightning feel.
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
const C_DIM    = "rgba(6,208,228,0.08)";
const C_MED    = "rgba(6,208,228,0.15)";
const C_EDGE   = "rgba(6,208,228,0.22)";
const C_STRONG = "rgba(6,208,228,0.38)";

const BG_PAGE  = "#07070e";
const BG_RAIL  = "#09091200";
const BG_BAR   = "#0a0a14";
const BG_CARD  = "linear-gradient(145deg, #111128 0%, #0e0e20 100%)";
const BG_INSET = "linear-gradient(145deg, #0d0d1e 0%, #0b0b18 100%)";
const BG_RAIL_SOLID = "#09091200";

const BORDER      = "rgba(255,255,255,0.04)";
const BORDER_CARD = "rgba(255,255,255,0.06)";
const BORDER_CARD_HOVER = "rgba(255,255,255,0.1)";
const LABEL_COLOR = "#5a5a78";
const R = 8;

// Elevation shadows
const SHADOW_SM   = "0 1px 3px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)";
const SHADOW_MD   = "0 4px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)";
const SHADOW_GLOW = `0 0 24px rgba(6,208,228,0.12), 0 4px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,208,228,0.2)`;
const SHADOW_PILL_GREEN  = "0 0 10px rgba(52,211,153,0.25)";
const SHADOW_PILL_CYAN   = "0 0 10px rgba(34,211,238,0.25)";
const SHADOW_PILL_YELLOW = "0 0 10px rgba(251,191,36,0.20)";
const SHADOW_PILL_GRAY   = "0 0 6px rgba(113,113,122,0.15)";

// ── Static data ─────────────────────────────────────────────────
const PROOF_STEPS = [
  { key: "captured", label: "Signal captured" },
  { key: "verified", label: "Source verified" },
  { key: "crm",      label: "CRM / dedupe checked" },
  { key: "model",    label: "Model path chosen" },
  { key: "routed",   label: "Routed to owner" },
  { key: "feedback", label: "Feedback received" },
];

const dispositionMeta: Record<string, {
  label: string; bg: string; border: string; text: string; dot: string; shadow: string;
}> = {
  billable_opportunity: {
    label: "Billable Opportunity",
    bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.28)", text: "#34d399", dot: "#34d399",
    shadow: SHADOW_PILL_GREEN,
  },
  intent_update: {
    label: "Intent Update",
    bg: "rgba(34,211,238,0.10)", border: "rgba(34,211,238,0.28)", text: "#22d3ee", dot: "#22d3ee",
    shadow: SHADOW_PILL_CYAN,
  },
  watchlist: {
    label: "Watchlist",
    bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.28)", text: "#fbbf24", dot: "#fbbf24",
    shadow: SHADOW_PILL_YELLOW,
  },
  suppressed: {
    label: "Suppressed",
    bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.22)", text: "#71717a", dot: "#71717a",
    shadow: SHADOW_PILL_GRAY,
  },
};

const statusDot: Record<string, string> = {
  healthy: "#34d399",
  degraded: "#fbbf24",
  error:    "#f87171",
};

const statusGlow: Record<string, string> = {
  healthy: "0 0 6px rgba(52,211,153,0.5)",
  degraded: "0 0 6px rgba(251,191,36,0.5)",
  error:    "0 0 6px rgba(248,113,113,0.5)",
};

// ── Utilities ───────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const BADGE_PALETTES = [
  { bg: "rgba(6,208,228,0.14)",    text: C,         glow: "0 0 12px rgba(6,208,228,0.2)"    },
  { bg: "rgba(52,211,153,0.14)",   text: "#34d399",  glow: "0 0 12px rgba(52,211,153,0.2)"  },
  { bg: "rgba(139,92,246,0.14)",   text: "#a78bfa",  glow: "0 0 12px rgba(139,92,246,0.2)"  },
  { bg: "rgba(251,191,36,0.14)",   text: "#fbbf24",  glow: "0 0 12px rgba(251,191,36,0.2)"  },
  { bg: "rgba(248,113,113,0.14)",  text: "#f87171",  glow: "0 0 12px rgba(248,113,113,0.2)" },
];
function badgePalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return BADGE_PALETTES[h % BADGE_PALETTES.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
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
function scoreGlow(n: number) {
  if (n >= 85) return "0 0 18px rgba(52,211,153,0.35)";
  if (n >= 70) return "0 0 18px rgba(34,211,238,0.35)";
  if (n >= 55) return "0 0 18px rgba(251,191,36,0.30)";
  return "0 0 18px rgba(248,113,113,0.30)";
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

// ── Sub-components ──────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[9px] uppercase tracking-widest mb-2.5 font-semibold"
      style={{ color: LABEL_COLOR, letterSpacing: "0.15em" }}
    >
      {children}
    </div>
  );
}

function PlatosLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V18h8v-2.9c1.8-1.4 3-3.6 3-6.1C19 5 16 2 12 2z"
        fill={C} opacity="0.9" />
      <path d="M9 18h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" fill={C} opacity="0.45" />
      <path d="M3 9h2M19 9h2" stroke={C} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
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
        border: `1px solid ${p.text}30`,
        color: p.text,
        borderRadius: R,
        fontSize: size > 28 ? 12 : 10,
        letterSpacing: "0.02em",
        boxShadow: `${p.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: m.bg,
        border: `1px solid ${m.border}`,
        color: m.text,
        borderRadius: 20,
        lineHeight: "1.4",
        boxShadow: m.shadow,
        letterSpacing: "0.01em",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
        background: m.dot,
        boxShadow: `0 0 5px ${m.dot}`,
      }} />
      {m.label}
    </span>
  );
}

function ScoreKPI({ value, label }: { value: number; label: string }) {
  const c = scoreColor(value);
  const g = scoreGlow(value);
  return (
    <div
      className="flex flex-col items-center py-5"
      style={{
        background: BG_CARD,
        border: `1px solid ${BORDER_CARD}`,
        borderRadius: R,
        boxShadow: SHADOW_MD,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${c}10 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />
      <span className="text-[34px] font-bold tabular-nums leading-none mb-1.5 relative"
        style={{ color: c, textShadow: g }}>
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-widest relative" style={{ color: LABEL_COLOR, letterSpacing: "0.14em" }}>
        {label}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
      <div className="w-7 h-7 rounded shrink-0" style={{ background: "#13132a", borderRadius: R }} />
      <div className="flex-1">
        <div className="h-2.5 w-32 rounded mb-2" style={{ background: "#13132a" }} />
        <div className="h-2 w-24 rounded" style={{ background: "#0f0f22" }} />
      </div>
      <div className="flex gap-1.5">
        <div className="h-2.5 w-6 rounded" style={{ background: "#13132a" }} />
        <div className="h-2.5 w-6 rounded" style={{ background: "#13132a" }} />
      </div>
    </div>
  );
}

function ProofStrip({ done }: { done: Set<string> }) {
  return (
    <div className="flex items-center gap-1">
      {PROOF_STEPS.map((step, i) => {
        const isDone = done.has(step.key);
        const isNext = !isDone && PROOF_STEPS.slice(0, i).every((s) => done.has(s.key));
        return (
          <div key={step.key} className="relative group flex-1">
            <div className="w-full h-[3px] rounded-full transition-all"
              style={{
                background: isDone
                  ? `linear-gradient(90deg, ${C}cc, ${C}88)`
                  : isNext ? `${C}22` : "rgba(255,255,255,0.05)",
                boxShadow: isDone ? `0 0 6px ${C}50` : "none",
              }} />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: isDone ? C : isNext ? "#1e1e38" : "#12121e",
                border: `1px solid ${isDone ? C : isNext ? `${C}35` : "rgba(255,255,255,0.06)"}`,
                boxShadow: isDone ? `0 0 8px ${C}80, 0 0 2px ${C}` : "none",
              }}
            />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
              style={{
                background: "#12121e",
                border: `1px solid ${BORDER_CARD}`,
                color: isDone ? "#d4d4d8" : LABEL_COLOR,
                boxShadow: SHADOW_MD,
              }}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatRow({ label, val, hi }: { label: string; val: string; hi: boolean }) {
  return (
    <div className="flex justify-between items-center mb-2 last:mb-0">
      <span className="text-[10px]" style={{ color: LABEL_COLOR }}>{label}</span>
      <span
        className="text-[11px] font-semibold tabular-nums"
        style={{ color: hi ? "#e4e4e7" : "#42425a" }}
      >
        {val}
      </span>
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
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: BORDER, background: BG_BAR, boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}>
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, boxShadow: SHADOW_SM }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{sig.company}</div>
          <div className="text-[10px]" style={{ color: LABEL_COLOR }}>{sig.contact.name} · {sig.source}</div>
        </div>
        <CompanyBadge name={sig.company} size={32} />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <DispositionPill d={sig.disposition} />
            {isRouted && (
              <span className="text-[11px] px-2.5 py-1 font-semibold"
                style={{
                  background: "rgba(52,211,153,0.10)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  color: "#34d399",
                  borderRadius: 20,
                  boxShadow: "0 0 8px rgba(52,211,153,0.2)",
                }}>
                → {sig.owner.split(" ")[0]}
              </span>
            )}
            <span className="text-xs font-semibold" style={{ color: C }}>{sig.contact.name}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{sig.contact.title}</span>
          </div>

          {/* Evidence */}
          <div className="mb-3 p-4 relative overflow-hidden"
            style={{
              background: BG_INSET,
              border: `1px solid ${BORDER_CARD}`,
              borderLeft: `3px solid ${C}`,
              borderRadius: R,
              boxShadow: `${SHADOW_MD}, inset 0 0 40px rgba(6,208,228,0.03)`,
            }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, rgba(6,208,228,0.04) 0%, transparent 50%)`,
              pointerEvents: "none",
            }} />
            <SectionLabel>Source Evidence · {sig.source}</SectionLabel>
            <p className="text-sm text-zinc-200 leading-relaxed italic mb-3 relative">
              &ldquo;{sig.evidenceSnippet}&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-3 border-t text-[10px] relative" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span style={{ color: LABEL_COLOR }}>Seen {formatTime(sig.seenAt)}</span>
              <span className="text-zinc-800">·</span>
              <span className="truncate" style={{ color: C, opacity: 0.7 }}>{sig.sourceUrl}</span>
            </div>
          </div>

          {/* Why Now */}
          <div className="mb-4 p-3.5"
            style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R, boxShadow: SHADOW_SM }}>
            <SectionLabel>Why Now</SectionLabel>
            <p className="text-sm text-zinc-300 leading-relaxed">{sig.whyNow}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <ScoreKPI value={sig.fitScore}        label="Fit"        />
            <ScoreKPI value={sig.confidenceScore} label="Confidence" />
            <ScoreKPI value={sig.freshnessScore}  label="Freshness"  />
          </div>

          {/* Proof */}
          <div className="mb-4 p-3.5" style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R, boxShadow: SHADOW_SM }}>
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
                const isActive = feedbackKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onFeedback(item.key)}
                    className="px-3 py-3 text-sm font-medium text-left transition-all"
                    style={{
                      background: isActive ? "linear-gradient(135deg, #1a1a30, #16162a)" : BG_CARD,
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : `1px solid ${BORDER_CARD}`,
                      color: isActive ? "#c4c4d4" : LABEL_COLOR,
                      borderRadius: R,
                      boxShadow: isActive ? SHADOW_MD : SHADOW_SM,
                    }}
                  >
                    {isActive && <span className="mr-2" style={{ color: "#34d399" }}>✓</span>}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {feedbackKey && (
              <div className="mt-2 px-3 py-2 text-[10px] text-center"
                style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R, color: LABEL_COLOR }}>
                Feedback sent · {feedbackKey.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: BORDER, background: BG_BAR, boxShadow: "0 -1px 0 rgba(255,255,255,0.04)" }}>
        <button
          onClick={onRoute}
          disabled={isAssigning}
          className="w-full py-3.5 text-sm font-bold mb-2 transition-all"
          style={{
            background: isRouted
              ? C_DIM
              : `linear-gradient(135deg, rgba(6,208,228,0.22) 0%, rgba(6,208,228,0.14) 100%)`,
            border: `1px solid ${isRouted ? C_EDGE : C_STRONG}`,
            color: C,
            borderRadius: R,
            boxShadow: isRouted ? "none" : SHADOW_GLOW,
            opacity: isAssigning ? 0.6 : 1,
            letterSpacing: "0.01em",
          }}
        >
          {isRouted ? <><span style={{ opacity: 0.45, marginRight: 8 }}>✓</span>Re-route to Owner</> : "Route to Owner →"}
        </button>
        <div className="flex gap-2">
          <button className="flex-1 py-3 text-sm font-medium"
            style={{
              background: C_DIM,
              border: `1px solid ${C_EDGE}`,
              color: C,
              borderRadius: R,
              opacity: 0.8,
            }}>
            Start Outreach
          </button>
          <a
            href={sig.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 text-sm font-medium text-center"
            style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: "#6b6b88", borderRadius: R, boxShadow: SHADOW_SM }}>
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
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1"
          style={{
            background: `linear-gradient(135deg, rgba(6,208,228,0.15) 0%, rgba(6,208,228,0.08) 100%)`,
            border: `1px solid ${C_EDGE}`,
            color: C,
            borderRadius: 20,
            boxShadow: `0 0 12px rgba(6,208,228,0.12)`,
          }}
        >
          <span style={{ fontSize: 6 }}>●</span>
          Feed
        </div>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={String(f.key)}
              onClick={() => onFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs shrink-0 transition-all"
              style={{
                background: active ? "linear-gradient(135deg, #1c1c35, #18182e)" : "transparent",
                border: active ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
                color: active ? "#d4d4d8" : LABEL_COLOR,
                borderRadius: 20,
                boxShadow: active ? SHADOW_SM : "none",
              }}
            >
              {f.label}
              <span className="text-[9px] font-mono px-1.5 rounded-full"
                style={{
                  background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                  color: active ? "#a1a1b4" : "#3a3a52",
                  minWidth: 18, textAlign: "center",
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
              style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, boxShadow: SHADOW_SM }}>
              <span style={{ color: LABEL_COLOR, fontSize: 18 }}>○</span>
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
              style={{ borderColor: "rgba(255,255,255,0.03)" }}
            >
              <CompanyBadge name={sig.company} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{sig.company}</span>
                  {isRouted && (
                    <span className="text-[10px] px-1.5 py-0.5 font-semibold shrink-0"
                      style={{
                        background: "rgba(52,211,153,0.10)",
                        border: "1px solid rgba(52,211,153,0.22)",
                        color: "#34d399",
                        borderRadius: 20,
                        boxShadow: "0 0 6px rgba(52,211,153,0.18)",
                      }}>
                      → {sig.owner.split(" ")[0]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: m.text }}>{m.label}</span>
                  <span style={{ color: LABEL_COLOR, fontSize: 10 }}>·</span>
                  <span className="text-[11px] text-zinc-500 truncate">{sig.contact.name}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: LABEL_COLOR }}>{formatTime(sig.seenAt)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore) }}>{sig.fitScore}</span>
                  <span style={{ color: LABEL_COLOR, fontSize: 10 }}>·</span>
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

  const assignMutation   = useAssignOpportunity();
  const feedbackMutation = useSubmitFeedback();

  const [routedOverrides,   setRoutedOverrides]   = useState<Record<string, boolean>>({});
  const [feedbackOverrides, setFeedbackOverrides] = useState<Record<string, string>>({});
  const [filter,            setFilter]            = useState<string | null>(null);
  const [mobileDetail,      setMobileDetail]      = useState<Signal | null>(null);
  const [selected,          setSelected]          = useState<Signal | null>(null);

  const signals: Signal[] = (rawSignals as Signal[] | undefined) ?? [];
  const allSignals = filter ? signals.filter((s) => s.disposition === filter) : signals;
  const activeSig  = mobileDetail ?? selected ?? signals[0] ?? null;

  function countByDisp(key: string) { return signals.filter((s) => s.disposition === key).length; }

  const FILTERS = [
    { key: null,                   label: "All",     count: signals.length },
    { key: "billable_opportunity", label: "Billable", count: countByDisp("billable_opportunity") },
    { key: "intent_update",        label: "Intent",  count: countByDisp("intent_update") },
    { key: "watchlist",            label: "Watch",   count: countByDisp("watchlist") },
  ];

  function getIsRouted(sig: Signal) { return routedOverrides[sig.id] ?? sig.route === "routed"; }
  function getFeedbackKey(sig: Signal): string | null { return feedbackOverrides[sig.id] ?? sig.feedback ?? null; }

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
    const d = new Set<string>(["captured", "verified", "crm", "model"]);
    if (sig && getIsRouted(sig)) d.add("routed");
    if (sig && getFeedbackKey(sig)) d.add("feedback");
    return d;
  }

  const ws = { name: "Acme Corp", quota: dashboard?.quota ?? 200, used: dashboard?.used ?? 0 };
  const quotaPct = Math.round((ws.used / ws.quota) * 100);
  const quotaColor = quotaPct > 90 ? "#f87171" : quotaPct > 70 ? "#fbbf24" : C;

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: BG_PAGE, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ════  MOBILE  ════ */}
      <div className="flex flex-col h-full md:hidden">
        <header className="flex items-center justify-between px-4 shrink-0 border-b"
          style={{ height: 50, borderColor: BORDER, background: BG_BAR }}>
          <div className="flex items-center gap-2">
            <PlatosLogo />
            <span className="text-white font-bold text-sm tracking-tight">Plato's</span>
            {mobileDetail && (
              <>
                <span style={{ color: LABEL_COLOR }} className="mx-1 text-sm">/</span>
                <span className="text-zinc-500 text-sm truncate max-w-[140px]">{mobileDetail.company}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(6,208,228,0.08)", border: `1px solid ${C_EDGE}` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C, boxShadow: `0 0 6px ${C}` }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C }}>Live</span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1a1a38, #14142a)", border: `1px solid ${BORDER_CARD}`, boxShadow: SHADOW_SM }}>
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

      {/* ════  DESKTOP  ════ */}
      <div className="hidden md:flex flex-col h-full">

        {/* Top bar */}
        <header
          className="flex items-center justify-between px-5 shrink-0"
          style={{
            height: 46,
            borderBottom: `1px solid ${BORDER}`,
            background: `linear-gradient(to bottom, #0d0d20, ${BG_BAR})`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 2px 12px rgba(0,0,0,0.4)",
          }}>
          <div className="flex items-center gap-2.5">
            <PlatosLogo />
            <span className="text-white font-bold text-sm tracking-tight">Plato's</span>
            <span style={{ color: LABEL_COLOR }} className="mx-1.5 text-sm">/</span>
            <span className="text-zinc-400 text-sm font-medium">Signal Command Center</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(6,208,228,0.08)",
                border: `1px solid ${C_EDGE}`,
                boxShadow: "0 0 16px rgba(6,208,228,0.10)",
              }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C, boxShadow: `0 0 6px ${C}` }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C }}>Live</span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #1e1e3c, #161628)",
                border: `1px solid ${BORDER_CARD}`,
                boxShadow: SHADOW_SM,
              }}>
              AR
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">

          {/* Left Rail */}
          <aside
            className="flex flex-col shrink-0 border-r overflow-y-auto"
            style={{
              width: 200,
              borderColor: BORDER,
              background: `linear-gradient(180deg, #0b0b1a 0%, #09091400 100%)`,
            }}>

            {/* Workspace */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER }}>
              <SectionLabel>Workspace</SectionLabel>
              <div className="text-sm font-bold text-white leading-tight">{ws.name}</div>
              <div className="text-[10px] mt-0.5 font-medium" style={{ color: LABEL_COLOR }}>Growth plan</div>
            </div>

            {/* Quota */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER }}>
              <SectionLabel>Weekly Quota</SectionLabel>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-[30px] font-bold text-white tabular-nums leading-none"
                  style={{ textShadow: quotaPct > 90 ? "0 0 20px rgba(248,113,113,0.4)" : "none" }}>
                  {ws.used}
                </span>
                <span className="text-xs font-medium" style={{ color: LABEL_COLOR }}>/ {ws.quota}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${quotaPct}%`,
                    background: `linear-gradient(90deg, ${quotaColor}cc, ${quotaColor})`,
                    boxShadow: `0 0 8px ${quotaColor}80`,
                  }} />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-medium" style={{ color: LABEL_COLOR }}>{quotaPct}% used</span>
                <span className="text-[10px] font-medium" style={{ color: LABEL_COLOR }}>{ws.quota - ws.used} left</span>
              </div>
            </div>

            {/* Source Health */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER }}>
              <SectionLabel>Source Health</SectionLabel>
              {dashLoading
                ? <div className="h-2 w-24 rounded" style={{ background: "#13132a" }} />
                : (dashboard?.sources ?? []).map((s) => (
                    <div key={s.name} className="flex items-center justify-between mb-3 last:mb-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: statusDot[s.status] ?? "#71717a", boxShadow: statusGlow[s.status] ?? "none" }} />
                        <span className="text-[11px] font-medium text-zinc-400">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold" style={{ color: LABEL_COLOR }}>{s.yield}%</span>
                    </div>
                  ))
              }
            </div>

            {/* Signal Health */}
            <div className="px-4 py-4">
              <SectionLabel>Signal Health</SectionLabel>
              <StatRow label="Billable Opps"    val={dashboard?.billableOpportunities?.toString() ?? "—"} hi={true}  />
              <StatRow label="Intent Updates"   val={dashboard?.intentUpdates?.toString() ?? "—"}          hi={false} />
              <StatRow label="Dupes Suppressed" val={dashboard?.duplicatesSuppressed?.toString() ?? "—"}  hi={false} />
              <StatRow label="Raw Scanned"      val={dashboard?.rawScanned?.toLocaleString() ?? "—"}      hi={false} />
            </div>
          </aside>

          {/* Center */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">

            {/* Queue header */}
            <div className="border-b shrink-0"
              style={{
                borderColor: BORDER,
                background: `linear-gradient(to bottom, #0b0b1a, #09091200)`,
              }}>
              <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: BORDER }}>
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: `linear-gradient(135deg, rgba(6,208,228,0.15) 0%, rgba(6,208,228,0.08) 100%)`,
                    border: `1px solid ${C_EDGE}`,
                    color: C,
                    borderRadius: 20,
                    boxShadow: `0 0 14px rgba(6,208,228,0.12)`,
                  }}>
                  <span style={{ fontSize: 6 }}>●</span>
                  Signal Feed
                </div>
                <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: LABEL_COLOR }}>
                  Detected · Verified · Routed
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                      <button key={String(f.key)} onClick={() => setFilter(f.key)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] transition-all"
                        style={{
                          background: active ? "linear-gradient(135deg, #1c1c35, #18182e)" : "transparent",
                          border: active ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
                          color: active ? "#d4d4d8" : LABEL_COLOR,
                          borderRadius: 20,
                          boxShadow: active ? SHADOW_SM : "none",
                          fontWeight: active ? 600 : 400,
                        }}>
                        {f.label}
                        <span className="text-[9px] font-mono px-1.5 rounded-full"
                          style={{
                            background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                            color: active ? "#a1a1b4" : "#3a3a52",
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
                {pipelineLoading && <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}
                {!pipelineLoading && pipelineError && (
                  <div className="flex flex-col items-center justify-center py-6 px-4">
                    <div className="text-red-400 text-sm mb-2">⚠ Could not load signals</div>
                    <div className="text-[10px]" style={{ color: LABEL_COLOR }}>Check API connectivity and retry.</div>
                  </div>
                )}
                {!pipelineLoading && !pipelineError && allSignals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                      style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, boxShadow: SHADOW_SM }}>
                      <span style={{ color: LABEL_COLOR, fontSize: 14 }}>○</span>
                    </div>
                    <div className="text-xs font-medium text-zinc-500 mb-1">No signals in queue</div>
                    <div className="text-[10px] text-center max-w-48" style={{ color: LABEL_COLOR }}>
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
                        borderColor: "rgba(255,255,255,0.03)",
                        background: isActive
                          ? `linear-gradient(90deg, rgba(6,208,228,0.06) 0%, rgba(6,208,228,0.02) 60%, transparent 100%)`
                          : "transparent",
                        borderLeft: `2px solid ${isActive ? C : "transparent"}`,
                        boxShadow: isActive ? `inset 3px 0 20px rgba(6,208,228,0.06)` : "none",
                      }}>
                      <CompanyBadge name={sig.company} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-zinc-300"}`}>
                            {sig.company}
                          </span>
                          <span className="text-[10px] font-semibold shrink-0" style={{ color: m.text }}>{m.label}</span>
                          {isRouted && (
                            <span className="text-[9px] px-1.5 py-0.5 font-semibold shrink-0"
                              style={{
                                background: "rgba(52,211,153,0.10)",
                                border: "1px solid rgba(52,211,153,0.22)",
                                color: "#34d399",
                                borderRadius: 20,
                                boxShadow: "0 0 6px rgba(52,211,153,0.2)",
                              }}>
                              → {sig.owner.split(" ")[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] block truncate font-medium" style={{ color: LABEL_COLOR }}>
                          {sig.contact.name} · {sig.source} · {formatTime(sig.seenAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.fitScore) }}>{sig.fitScore}</span>
                        <span style={{ color: LABEL_COLOR, fontSize: 10 }}>·</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(sig.confidenceScore) }}>{sig.confidenceScore}</span>
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
                    <CompanyBadge name={activeSig.company} size={40} />
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-white tracking-tight leading-tight mb-2">{activeSig.company}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DispositionPill d={activeSig.disposition} />
                        {activeSig.dedupeStatus === "duplicate" && (
                          <span className="text-[10px] px-2.5 py-1 font-semibold"
                            style={{
                              background: "rgba(251,191,36,0.10)",
                              border: "1px solid rgba(251,191,36,0.25)",
                              color: "#fbbf24",
                              borderRadius: 20,
                              boxShadow: "0 0 8px rgba(251,191,36,0.2)",
                            }}>
                            Duplicate
                          </span>
                        )}
                        {activeSig.crmStatus === "clean" && activeSig.dedupeStatus === "unique" && (
                          <span className="text-[10px] px-2.5 py-1 font-medium"
                            style={{
                              background: BG_CARD,
                              border: `1px solid ${BORDER_CARD}`,
                              color: LABEL_COLOR,
                              borderRadius: 20,
                              boxShadow: SHADOW_SM,
                            }}>
                            CRM Clean
                          </span>
                        )}
                        <span className="text-xs font-semibold" style={{ color: C }}>{activeSig.contact.name}</span>
                        <span style={{ color: LABEL_COLOR }}>·</span>
                        <span className="text-xs text-zinc-500">{activeSig.contact.title}</span>
                        <span style={{ color: LABEL_COLOR }}>·</span>
                        <span className="text-xs text-zinc-500">{activeSig.source}</span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="mb-3 p-4 relative overflow-hidden"
                    style={{
                      background: BG_INSET,
                      border: `1px solid ${BORDER_CARD}`,
                      borderLeft: `3px solid ${C}`,
                      borderRadius: R,
                      boxShadow: `${SHADOW_MD}, inset 0 0 60px rgba(6,208,228,0.025)`,
                    }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: `linear-gradient(135deg, rgba(6,208,228,0.035) 0%, transparent 45%)`,
                      pointerEvents: "none",
                    }} />
                    <SectionLabel>Source Evidence · {activeSig.source}</SectionLabel>
                    <p className="text-sm text-zinc-200 leading-relaxed italic mb-3 relative">
                      &ldquo;{activeSig.evidenceSnippet}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t text-[10px] relative"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span style={{ color: LABEL_COLOR }}>Seen {formatTime(activeSig.seenAt)}</span>
                      <span className="text-zinc-800">·</span>
                      <span style={{ color: LABEL_COLOR }}>Verified {formatTime(activeSig.lastVerifiedAt)}</span>
                      <span className="text-zinc-800">·</span>
                      <span className="truncate" style={{ color: C, opacity: 0.7 }}>{activeSig.sourceUrl}</span>
                    </div>
                  </div>

                  {/* Why Now */}
                  <div className="mb-4 p-3.5"
                    style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R, boxShadow: SHADOW_SM }}>
                    <SectionLabel>Why Now</SectionLabel>
                    <p className="text-xs text-zinc-300 leading-relaxed">{activeSig.whyNow}</p>
                  </div>

                  {/* Score KPIs */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <ScoreKPI value={activeSig.fitScore}        label="Fit Score"  />
                    <ScoreKPI value={activeSig.confidenceScore} label="Confidence" />
                    <ScoreKPI value={activeSig.freshnessScore}  label="Freshness"  />
                  </div>

                  {/* Route info */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5"
                      style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R, boxShadow: SHADOW_SM }}>
                      <SectionLabel>Recommended Channel</SectionLabel>
                      <div className="text-xs font-medium text-zinc-300">{activeSig.recommendedChannel}</div>
                    </div>
                    <div className="p-3.5"
                      style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R, boxShadow: SHADOW_SM }}>
                      <SectionLabel>Owner</SectionLabel>
                      <div className="text-xs font-semibold" style={{ color: getIsRouted(activeSig) ? "#34d399" : "#42425a" }}>
                        {getIsRouted(activeSig) ? activeSig.owner : "Unassigned"}
                        {getIsRouted(activeSig) && (
                          <span className="font-normal" style={{ color: "#34d39960" }}> · Routed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Rail */}
          <aside
            className="flex flex-col shrink-0 border-l overflow-y-auto"
            style={{
              width: 260,
              borderColor: BORDER,
              background: `linear-gradient(180deg, #0b0b1a 0%, #09091200 100%)`,
            }}>

            {/* Primary CTA */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER }}>
              <button
                onClick={() => activeSig && handleRoute(activeSig)}
                disabled={!activeSig || assignMutation.isPending}
                className="w-full px-4 py-3 text-sm font-bold text-left transition-all mb-2.5"
                style={{
                  background: activeSig && getIsRouted(activeSig)
                    ? C_DIM
                    : `linear-gradient(135deg, rgba(6,208,228,0.22) 0%, rgba(6,208,228,0.13) 100%)`,
                  border: `1px solid ${activeSig && getIsRouted(activeSig) ? C_EDGE : C_STRONG}`,
                  color: C,
                  borderRadius: R,
                  boxShadow: activeSig && getIsRouted(activeSig) ? "none" : SHADOW_GLOW,
                  opacity: !activeSig || assignMutation.isPending ? 0.6 : 1,
                  letterSpacing: "0.01em",
                }}>
                {activeSig && getIsRouted(activeSig)
                  ? <><span style={{ opacity: 0.4, marginRight: 8 }}>✓</span>Re-route to Owner</>
                  : "Route to Owner →"}
              </button>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2.5 text-xs font-semibold text-left"
                  style={{
                    background: C_DIM,
                    border: `1px solid ${C_EDGE}`,
                    color: C,
                    borderRadius: R,
                    opacity: 0.8,
                  }}>
                  Start Outreach
                </button>
                {activeSig ? (
                  <a href={activeSig.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 px-3 py-2.5 text-xs font-medium text-center"
                    style={{
                      background: BG_CARD,
                      border: `1px solid ${BORDER_CARD}`,
                      color: "#6b6b88",
                      borderRadius: R,
                      boxShadow: SHADOW_SM,
                    }}>
                    View Source
                  </a>
                ) : (
                  <button className="flex-1 px-3 py-2.5 text-xs font-medium"
                    style={{ background: BG_CARD, border: `1px solid ${BORDER_CARD}`, color: "#6b6b88", borderRadius: R, boxShadow: SHADOW_SM }}>
                    View Source
                  </button>
                )}
              </div>
            </div>

            {/* Proof */}
            <div className="px-4 py-3.5 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Proof Chain</SectionLabel>
                <span className="text-[9px] font-mono font-semibold" style={{ color: LABEL_COLOR }}>
                  {activeSig ? PROOF_STEPS.filter((s) => getDoneSet(activeSig).has(s.key)).length : 4}/{PROOF_STEPS.length}
                </span>
              </div>
              <ProofStrip done={getDoneSet(activeSig)} />
            </div>

            {/* Mark As */}
            <div className="px-4 py-4 border-b" style={{ borderColor: BORDER }}>
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
                      className="w-full px-3 py-2.5 text-xs font-medium text-left transition-all"
                      style={{
                        background: isActive ? "linear-gradient(135deg, #1a1a30, #16162a)" : BG_CARD,
                        border: isActive ? "1px solid rgba(255,255,255,0.1)" : `1px solid ${BORDER_CARD}`,
                        color: isActive ? "#c4c4d4" : LABEL_COLOR,
                        borderRadius: R,
                        boxShadow: isActive ? SHADOW_MD : SHADOW_SM,
                      }}>
                      {isActive && <span className="mr-2" style={{ color: "#34d399" }}>✓</span>}
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {activeSig && getFeedbackKey(activeSig) && (
                <div className="mt-2.5 px-3 py-2 text-[10px] text-center"
                  style={{ background: BG_INSET, border: `1px solid ${BORDER_CARD}`, borderRadius: R, color: LABEL_COLOR }}>
                  Feedback sent · {getFeedbackKey(activeSig)!.replace(/_/g, " ")}
                </div>
              )}
            </div>

            {/* Source Yield */}
            <div className="px-4 py-4">
              <SectionLabel>Source Yield</SectionLabel>
              {dashLoading
                ? <div className="h-2 w-full rounded" style={{ background: "#13132a" }} />
                : (dashboard?.sources ?? []).map((src) => {
                    const dot = statusDot[src.status] ?? "#71717a";
                    return (
                      <div key={src.name} className="mb-3.5 last:mb-0">
                        <div className="flex justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: dot, boxShadow: statusGlow[src.status] ?? "none" }} />
                            <span className="text-[10px] font-medium text-zinc-500">{src.name}</span>
                          </div>
                          <span className="text-[10px] font-mono font-semibold" style={{ color: LABEL_COLOR }}>{src.yield}%</span>
                        </div>
                        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${src.yield}%`,
                              background: `linear-gradient(90deg, ${dot}99, ${dot})`,
                              boxShadow: `0 0 6px ${dot}60`,
                            }} />
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
