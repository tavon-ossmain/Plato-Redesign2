import { useLocation } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#07070e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(ellipse at center, rgba(6,208,228,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo mark */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 36 28"
          fill="none"
          style={{ width: 48, height: 48, margin: "0 auto 1rem" }}
        >
          <polygon
            points="18,1 30,7 30,21 18,27 6,21 6,7"
            stroke="#06d0e4"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="18" cy="14" r="4" fill="#06d0e4" />
          <line x1="18" y1="10" x2="18" y2="3" stroke="#06d0e4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="18" x2="18" y2="25" stroke="#06d0e4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="14.5" y1="12" x2="8" y2="8.5" stroke="#06d0e4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="21.5" y1="16" x2="28" y2="19.5" stroke="#06d0e4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="21.5" y1="12" x2="28" y2="8.5" stroke="#06d0e4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="14.5" y1="16" x2="8" y2="19.5" stroke="#06d0e4" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "#06d0e4",
            textTransform: "uppercase",
          }}
        >
          Plato's Core
        </div>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.25rem)",
          fontWeight: 700,
          color: "#e8eaf0",
          textAlign: "center",
          lineHeight: 1.15,
          marginBottom: "1.25rem",
          maxWidth: 640,
          letterSpacing: "-0.02em",
        }}
      >
        Intent signals,{" "}
        <span style={{ color: "#06d0e4" }}>routed to the right rep</span>
        <br />before the window closes.
      </h1>

      <p
        style={{
          fontSize: "1.05rem",
          color: "#8892a4",
          textAlign: "center",
          maxWidth: 500,
          lineHeight: 1.7,
          marginBottom: "3rem",
        }}
      >
        Detect, score, and triage high-intent buying signals from LinkedIn, G2,
        Reddit, job boards, and web scrapes — all in one command center.
      </p>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => setLocation("/sign-up")}
          style={{
            padding: "0.75rem 2rem",
            background: "#06d0e4",
            color: "#07070e",
            border: "none",
            borderRadius: 8,
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "0.01em",
            boxShadow: "0 0 24px rgba(6,208,228,0.35)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 36px rgba(6,208,228,0.55)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 24px rgba(6,208,228,0.35)";
          }}
        >
          Get started
        </button>
        <button
          type="button"
          onClick={() => setLocation("/sign-in")}
          style={{
            padding: "0.75rem 2rem",
            background: "transparent",
            color: "#e8eaf0",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            fontSize: "0.95rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "0.01em",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(6,208,228,0.4)";
            (e.currentTarget as HTMLButtonElement).style.color = "#06d0e4";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "#e8eaf0";
          }}
        >
          Sign in
        </button>
      </div>

      {/* Footer note */}
      <p
        style={{
          position: "absolute",
          bottom: "1.5rem",
          fontSize: "0.75rem",
          color: "#3a3d4d",
          letterSpacing: "0.04em",
        }}
      >
        B2B intent signal triage &bull; Built for revenue teams
      </p>
    </div>
  );
}
