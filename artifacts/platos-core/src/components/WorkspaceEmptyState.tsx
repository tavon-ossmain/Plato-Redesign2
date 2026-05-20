/**
 * WorkspaceEmptyState — shown when no workspace is found for the signed-in user.
 * Provides guidance on how to get started via platos.agency.
 */

export function WorkspaceEmptyState() {
  return (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{ background: "#07070e", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div
        className="flex flex-col items-center text-center max-w-sm px-6 py-10 rounded-2xl"
        style={{
          background: "linear-gradient(145deg,#111128 0%,#0e0e20 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "rgba(6,208,228,0.08)",
            border: "1px solid rgba(6,208,228,0.22)",
            boxShadow: "0 0 24px rgba(6,208,228,0.10)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V18h8v-2.9c1.8-1.4 3-3.6 3-6.1C19 5 16 2 12 2z"
              fill="#06d0e4"
              opacity="0.9"
            />
            <path
              d="M9 18h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
              fill="#06d0e4"
              opacity="0.45"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-[18px] font-bold mb-2" style={{ color: "#f4f4f6" }}>
          No workspace found
        </h1>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: "#9898b0" }}>
          This account isn't linked to a Plato's workspace yet. Submit your ICP brief at{" "}
          <strong style={{ color: "#f4f4f6" }}>platos.agency</strong> to get set up.
        </p>

        {/* CTA */}
        <a
          href="https://platos.agency"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg px-5 py-2.5 text-[13px] font-bold transition-all"
          style={{
            background: "linear-gradient(135deg, #06d0e4, #04a8bb)",
            color: "#07070e",
            boxShadow:
              "0 0 24px rgba(6,208,228,0.14), 0 4px 12px rgba(0,0,0,0.60), 0 0 0 1px rgba(6,208,228,0.22)",
            textDecoration: "none",
          }}
        >
          Get started at platos.agency
        </a>

        <p className="text-[11px] mt-4" style={{ color: "#5a5a78" }}>
          Already submitted? Make sure you sign in with the same email address.
        </p>
      </div>
    </div>
  );
}
