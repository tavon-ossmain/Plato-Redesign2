import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";

// ── Types ─────────────────────────────────────────────────────────
interface Source {
  id: number;
  workspaceId: string;
  name: string;
  yield: number;
  status: string;
}

interface ScraperJob {
  id: number;
  status: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
}

interface SourceConfig {
  id: number;
  workspaceId: string;
  sourceType: string;
  status: string;
  keywords: string[];
  disqualifiers: string[];
  targetTitles: string[];
  targetIndustries: string[];
  companySizeRange: string | null;
  confidenceThreshold: number;
  dailyLimit: number;
  runFrequency: string;
  createdFrom: string;
  jobs: ScraperJob[];
}

interface Workspace {
  id: string;
  name: string;
  ownerEmail: string | null;
  plan: string;
  status: string;
  quota: number;
  used: number;
  deliveryMode: string;
  slackWebhookUrl: string | null;
  deliveryEmail: string | null;
  adminNotes: string | null;
  activatedAt: string | null;
  createdAt: string;
  icpConfig: {
    normalizedIcp: string;
    signalSources: string[];
    confidence: number;
    modelUsed: string;
  } | null;
  sources: Source[];
  sourceConfigs: SourceConfig[];
}

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  active:  { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.30)",  text: "#34d399" },
  preview: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.30)",  text: "#f59e0b" },
  paused:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.30)",   text: "#ef4444" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.preview;
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {status}
    </span>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SOURCE_DISPLAY: Record<string, string> = {
  linkedin:  "LinkedIn",
  reddit:    "Reddit",
  g2:        "G2 Reviews",
  jobboards: "Job Boards",
  web:       "Web Scrape",
};

const SOURCE_CONFIG_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  active:          { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.30)",  text: "#34d399" },
  preview_paused:  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.30)",  text: "#f59e0b" },
  paused:          { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.30)",   text: "#ef4444" },
  disabled:        { bg: "rgba(90,90,120,0.12)",   border: "rgba(90,90,120,0.30)",   text: "#5a5a78" },
};

// ── Source config card ─────────────────────────────────────────────
function SourceConfigCard({
  config,
  onSave,
}: {
  config: SourceConfig;
  onSave: (id: number, patch: Record<string, unknown>) => Promise<void>;
}) {
  const [dailyLimit, setDailyLimit]   = useState(String(config.dailyLimit));
  const [threshold, setThreshold]     = useState(String(Math.round(config.confidenceThreshold * 100)));
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [expanded, setExpanded]       = useState(false);

  const statusColor = SOURCE_CONFIG_STATUS_COLORS[config.status] ?? SOURCE_CONFIG_STATUS_COLORS.preview_paused;
  const label       = SOURCE_DISPLAY[config.sourceType] ?? config.sourceType;
  const job         = config.jobs[0];

  const inputStyle: React.CSSProperties = {
    background: "#07070e", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 5, color: "#e8eaf0", padding: "5px 8px",
    fontSize: 11, outline: "none", width: "100%",
  };

  async function handleSave() {
    setSaving(true);
    await onSave(config.id, {
      dailyLimit:          parseInt(dailyLimit, 10) || config.dailyLimit,
      confidenceThreshold: (parseInt(threshold, 10) || Math.round(config.confidenceThreshold * 100)) / 100,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleEnabled() {
    const next = config.status === "disabled" ? "preview_paused" : "disabled";
    await onSave(config.id, { status: next });
  }

  return (
    <div className="rounded-lg overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: "#f4f4f6" }}>{label}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ background: statusColor.bg, border: `1px solid ${statusColor.border}`, color: statusColor.text }}>
            {config.status.replace("_", " ")}
          </span>
          {job && (
            <span className="text-[9px]" style={{ color: "#5a5a78" }}>
              job: {job.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); void toggleEnabled(); }}
            className="text-[10px] px-2 py-0.5 rounded transition-all"
            style={{
              background: config.status === "disabled" ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${config.status === "disabled" ? "rgba(52,211,153,0.22)" : "rgba(239,68,68,0.22)"}`,
              color: config.status === "disabled" ? "#34d399" : "#ef4444",
            }}>
            {config.status === "disabled" ? "Enable" : "Disable"}
          </button>
          <span style={{ color: "#5a5a78", fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="grid grid-cols-2 gap-2 pt-2.5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#5a5a78" }}>Daily Limit</p>
              <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)}
                style={inputStyle} min={1} max={1000} />
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#5a5a78" }}>Min Confidence %</p>
              <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)}
                style={inputStyle} min={0} max={100} />
            </div>
          </div>

          {config.keywords.length > 0 && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#5a5a78" }}>Keywords ({config.keywords.length})</p>
              <div className="flex flex-wrap gap-1">
                {config.keywords.slice(0, 6).map((k) => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(6,208,228,0.06)", border: "1px solid rgba(6,208,228,0.14)", color: "#06d0e4" }}>
                    {k}
                  </span>
                ))}
                {config.keywords.length > 6 && (
                  <span className="text-[10px]" style={{ color: "#5a5a78" }}>+{config.keywords.length - 6} more</span>
                )}
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-1.5 rounded text-[11px] font-semibold transition-all"
            style={{
              background: saved ? "rgba(52,211,153,0.10)" : "rgba(6,208,228,0.08)",
              border: `1px solid ${saved ? "rgba(52,211,153,0.28)" : "rgba(6,208,228,0.20)"}`,
              color: saved ? "#34d399" : "#06d0e4",
              opacity: saving ? 0.6 : 1,
            }}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save source settings"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Edit drawer for a single workspace ───────────────────────────
function WorkspaceDrawer({
  ws,
  onClose,
  onSave,
  onSaveSourceConfig,
}: {
  ws: Workspace;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onSaveSourceConfig: (id: number, patch: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    status:          ws.status,
    plan:            ws.plan,
    quota:           String(ws.quota),
    deliveryMode:    ws.deliveryMode,
    slackWebhookUrl: ws.slackWebhookUrl ?? "",
    deliveryEmail:   ws.deliveryEmail ?? "",
    adminNotes:      ws.adminNotes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    await onSave(ws.id, {
      status:          form.status,
      plan:            form.plan,
      quota:           parseInt(form.quota, 10) || ws.quota,
      deliveryMode:    form.deliveryMode,
      slackWebhookUrl: form.slackWebhookUrl,
      deliveryEmail:   form.deliveryEmail,
      adminNotes:      form.adminNotes,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    background: "#111128", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6, color: "#e8eaf0", padding: "6px 10px",
    fontSize: 12, width: "100%", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.08em", color: "#5a5a78", marginBottom: 4, display: "block",
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="h-full overflow-y-auto flex flex-col"
        style={{ width: 440, background: "#0d0d20", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#f4f4f6" }}>{ws.name}</p>
            <p className="text-[11px]" style={{ color: "#5a5a78" }}>{ws.ownerEmail}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded"
            style={{ background: "rgba(255,255,255,0.05)", color: "#5a5a78" }}>✕</button>
        </div>

        <div className="flex flex-col gap-5 p-5">

          {/* ICP summary */}
          {ws.icpConfig && (
            <div className="rounded-lg p-3" style={{ background: "rgba(6,208,228,0.06)", border: "1px solid rgba(6,208,228,0.14)" }}>
              <p style={labelStyle}>ICP · {Math.round(ws.icpConfig.confidence * 100)}% confidence · {ws.icpConfig.modelUsed}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: "#9898b0" }}>{ws.icpConfig.normalizedIcp}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {ws.sources.map((s) => (
                  <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(6,208,228,0.08)", border: "1px solid rgba(6,208,228,0.18)", color: "#06d0e4" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <div className="flex gap-2">
              {(["preview", "active", "paused"] as const).map((s) => {
                const c = STATUS_COLORS[s];
                const active = form.status === s;
                return (
                  <button key={s} onClick={() => set("status", s)}
                    className="flex-1 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest transition-all"
                    style={{
                      background: active ? c.bg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? c.border : "rgba(255,255,255,0.06)"}`,
                      color: active ? c.text : "#5a5a78",
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
            {ws.activatedAt && (
              <p className="text-[10px] mt-1.5" style={{ color: "#5a5a78" }}>
                Activated {fmtDate(ws.activatedAt)}
              </p>
            )}
          </div>

          {/* Plan + Quota */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Plan</label>
              <select value={form.plan} onChange={(e) => set("plan", e.target.value)} style={selectStyle}>
                {["Starter", "Growth", "Scale", "Enterprise"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Weekly Quota</label>
              <input type="number" value={form.quota} onChange={(e) => set("quota", e.target.value)}
                style={inputStyle} min={1} max={10000} />
            </div>
          </div>

          {/* Delivery mode */}
          <div>
            <label style={labelStyle}>Delivery Mode</label>
            <div className="flex gap-2">
              {[
                { v: "diy",     label: "DIY Signals" },
                { v: "managed", label: "STRIX Managed" },
              ].map(({ v, label }) => (
                <button key={v} onClick={() => set("deliveryMode", v)}
                  className="flex-1 py-1.5 rounded text-[11px] font-semibold transition-all"
                  style={{
                    background: form.deliveryMode === v ? "rgba(6,208,228,0.10)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${form.deliveryMode === v ? "rgba(6,208,228,0.28)" : "rgba(255,255,255,0.06)"}`,
                    color: form.deliveryMode === v ? "#06d0e4" : "#5a5a78",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery destinations */}
          <div>
            <label style={labelStyle}>Slack Webhook URL</label>
            <input value={form.slackWebhookUrl} onChange={(e) => set("slackWebhookUrl", e.target.value)}
              placeholder="https://hooks.slack.com/..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Delivery Email</label>
            <input value={form.deliveryEmail} onChange={(e) => set("deliveryEmail", e.target.value)}
              placeholder="signals@client.com" style={inputStyle} />
          </div>

          {/* Admin notes */}
          <div>
            <label style={labelStyle}>Internal Notes</label>
            <textarea value={form.adminNotes} onChange={(e) => set("adminNotes", e.target.value)}
              rows={4} placeholder="Client notes, call summary, next steps…"
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {/* Source configs */}
          {ws.sourceConfigs.length > 0 && (
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>
                Signal Sources ({ws.sourceConfigs.length})
              </label>
              <div className="flex flex-col gap-2">
                {ws.sourceConfigs.map((cfg) => (
                  <SourceConfigCard
                    key={cfg.id}
                    config={cfg}
                    onSave={onSaveSourceConfig}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-lg p-3 flex flex-col gap-1.5"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: "#5a5a78" }}>Workspace ID</span>
              <span className="font-mono" style={{ color: "#9898b0" }}>{ws.id}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: "#5a5a78" }}>Created</span>
              <span style={{ color: "#9898b0" }}>{fmtDate(ws.createdAt)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: "#5a5a78" }}>Used / Quota</span>
              <span style={{ color: "#9898b0" }}>{ws.used} / {ws.quota}</span>
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-lg text-[13px] font-bold transition-all"
            style={{
              background: saved ? "rgba(52,211,153,0.15)" : "rgba(6,208,228,0.12)",
              border: `1px solid ${saved ? "rgba(52,211,153,0.35)" : "rgba(6,208,228,0.28)"}`,
              color: saved ? "#34d399" : "#06d0e4",
              opacity: saving ? 0.6 : 1,
            }}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main admin panel ──────────────────────────────────────────────
export function AdminPanel() {
  const { user } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading]       = useState(true);
  const [forbidden, setForbidden]   = useState(false);
  const [selected, setSelected]     = useState<Workspace | null>(null);

  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/admin/workspaces`, { credentials: "include" });
      if (res.status === 401 || res.status === 403) { setForbidden(true); return; }
      const data: unknown = await res.json();
      setWorkspaces(Array.isArray(data) ? (data as Workspace[]) : []);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(id: string, patch: Record<string, unknown>) {
    await fetch(`${baseUrl}/api/admin/workspaces/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
    setSelected((prev) => prev?.id === id ? { ...prev, ...patch } as Workspace : prev);
  }

  async function handleSaveSourceConfig(configId: number, patch: Record<string, unknown>) {
    await fetch(`${baseUrl}/api/admin/source-configs/${configId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
    // Refresh selected workspace's sourceConfigs from the reloaded list
    setSelected((prev) => {
      if (!prev) return prev;
      const fresh = workspaces.find((w) => w.id === prev.id);
      return fresh ?? prev;
    });
  }

  if (forbidden) {
    return (
      <div className="h-screen w-screen flex items-center justify-center"
        style={{ background: "#07070e", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="text-[14px] font-semibold" style={{ color: "#f4f4f6" }}>Not authorized</p>
          <p className="text-[12px]" style={{ color: "#5a5a78" }}>
            {user?.primaryEmailAddress?.emailAddress ?? "This account"} does not have admin access.
          </p>
        </div>
      </div>
    );
  }

  const counts = {
    active:  workspaces.filter((w) => w.status === "active").length,
    preview: workspaces.filter((w) => w.status === "preview").length,
    paused:  workspaces.filter((w) => w.status === "paused").length,
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: "#07070e", fontFamily: "'Inter', system-ui, sans-serif", color: "#f4f4f6" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 shrink-0"
        style={{ height: 48, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0a0a14" }}>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold tracking-tight">Plato's Admin</span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.30)", color: "#a78bfa" }}>
            Internal
          </span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: "Active",   count: counts.active,  color: "#34d399" },
            { label: "Preview",  count: counts.preview, color: "#f59e0b" },
            { label: "Paused",   count: counts.paused,  color: "#ef4444" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{count}</span>
              <span className="text-[10px]" style={{ color: "#5a5a78" }}>{label}</span>
            </div>
          ))}
          <button onClick={load} className="text-[11px] px-3 py-1 rounded"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#5a5a78" }}>
            Refresh
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: "#06d0e4", borderRightColor: "rgba(6,208,228,0.3)" }} />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[13px]" style={{ color: "#5a5a78" }}>No workspaces yet.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Company", "Email", "Plan", "Status", "Mode", "Quota", "Sources", "Created", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "#5a5a78", background: "#0a0a14", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws, i) => (
                <tr key={ws.id}
                  onClick={() => setSelected(ws)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(6,208,228,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
                >
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "#f4f4f6" }}>{ws.name}</td>
                  <td className="px-4 py-2.5" style={{ color: "#9898b0" }}>{ws.ownerEmail ?? "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#9898b0" }}>{ws.plan}</td>
                  <td className="px-4 py-2.5"><StatusPill status={ws.status} /></td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: ws.deliveryMode === "managed" ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${ws.deliveryMode === "managed" ? "rgba(124,58,237,0.28)" : "rgba(255,255,255,0.06)"}`,
                        color: ws.deliveryMode === "managed" ? "#a78bfa" : "#5a5a78",
                      }}>
                      {ws.deliveryMode === "managed" ? "STRIX" : "DIY"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums" style={{ color: "#9898b0" }}>
                    {ws.used}/{ws.quota}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "#9898b0" }}>
                    {ws.sources.length > 0
                      ? ws.sources.map((s) => s.name).join(", ")
                      : ws.icpConfig?.signalSources.join(", ") ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "#5a5a78" }}>
                    {fmtDate(ws.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[11px] px-2.5 py-1 rounded"
                      style={{ background: "rgba(6,208,228,0.06)", border: "1px solid rgba(6,208,228,0.14)", color: "#06d0e4" }}>
                      Edit →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <WorkspaceDrawer
          ws={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onSaveSourceConfig={handleSaveSourceConfig}
        />
      )}
    </div>
  );
}
