import React from "react";
import Target from "lucide-react/dist/esm/icons/target";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";

const TOPIC_LABELS = {
  client_communication: "Client Communication",
  scope_management: "Scope Management",
  delivery: "Delivery",
  quality_control: "Quality Control",
  platform_rules: "Platform Rules",
  business_basics: "Business Basics",
};

const label = (key) => TOPIC_LABELS[key] || String(key || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* Donut chart using SVG */
const DonutChart = ({ percent = 50, size = 110 }) => {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(140,80,255,0.25)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="url(#donutGrad)" strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <defs>
        <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6060ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <text x="50" y="46" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="'Hanken Grotesk',sans-serif">{percent}%</text>
      <text x="50" y="60" textAnchor="middle" fill="rgba(180,190,220,0.55)" fontSize="7" fontWeight="700" letterSpacing="1">ACCURACY</text>
    </svg>
  );
};

/* Radar polygon for topic card */
const RadarPolygon = ({ color = "#22c55e", points = [70, 55, 80, 65, 75] }) => {
  const n = points.length;
  const cx = 50; const cy = 50; const r = 38;
  const poly = points.map((v, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const d = (v / 100) * r;
    return `${cx + d * Math.cos(angle)},${cy + d * Math.sin(angle)}`;
  }).join(" ");
  const grid = [0.33, 0.66, 1].map(scale => {
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
    }).join(" ");
    return <polygon key={scale} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
  });
  return (
    <svg viewBox="0 0 100 100" width="70" height="70">
      {grid}
      <polygon points={poly} fill={`${color}22`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

const ProcessSummaryCard = ({ processSummary = {} }) => {
  const strong = processSummary?.strongTopics?.[0];
  const weak = processSummary?.weakTopics?.[0];
  const next = processSummary?.recommendedNextTopic;
  const accuracy = processSummary?.rollingAccuracy ?? null;
  const strongAcc = processSummary?.strongAccuracy ?? 78;
  const weakAcc = processSummary?.weakAccuracy ?? 28;
  const hasData = strong || weak || next || accuracy !== null;

  if (!hasData) {
    return (
      <div style={{ borderRadius: "18px", border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(145deg,rgba(8,10,24,0.98),rgba(5,7,18,0.98))", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(80,60,200,0.15)", border: "1px solid rgba(100,80,255,0.2)", display: "grid", placeItems: "center" }}>
            <Target className="size-5" style={{ color: "#818cf8" }} />
          </div>
          <div>
            <p style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6080ff" }}>Learning Summary</p>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>Best &amp; Weak Topics</h3>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "rgba(170,185,215,0.6)" }}>
          Complete a few practice quizzes to see your strong topics, weak topics, and next focus here.
        </p>
      </div>
    );
  }

  const acc = accuracy ?? 50;
  const incorrect = 100 - acc;

  return (
    <div style={{ borderRadius: "18px", border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(145deg,rgba(8,10,24,0.99),rgba(5,7,18,0.99))", overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.5)" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "2.8rem", height: "2.8rem", borderRadius: "0.85rem", background: "rgba(60,80,200,0.2)", border: "1px solid rgba(100,120,255,0.25)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="2">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12A10 10 0 0 1 12 2z" strokeDasharray="4 2" />
              <circle cx="12" cy="12" r="4" fill="#818cf8" opacity="0.3" />
              <circle cx="12" cy="12" r="1.5" fill="#818cf8" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#6080ff" }}>Learning Summary</p>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginTop: "0.15rem" }}>Best &amp; Weak Topics</h3>
          </div>
        </div>
        {accuracy !== null && (
          <button type="button" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: "999px", border: "1px solid rgba(100,120,255,0.3)", background: "rgba(60,80,200,0.15)", color: "#a0b0ff", fontSize: "0.8rem", fontWeight: 700, cursor: "default", flexShrink: 0 }}>
            <Target className="size-3.5" style={{ color: "#818cf8" }} />
            {acc}% accuracy
          </button>
        )}
      </div>

      <div style={{ padding: "0 1.5rem 1.5rem", display: "grid", gap: "1rem" }}>
        {/* Next Focus + Donut row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
          {next && (
            <div style={{ borderRadius: "14px", border: "1px solid rgba(255,193,7,0.18)", background: "linear-gradient(135deg,rgba(255,193,7,0.06),rgba(10,12,30,0.6))", padding: "1rem", position: "relative", overflow: "hidden" }}>
              {/* sonar rings */}
              <svg style={{ position: "absolute", right: "-0.5rem", top: "50%", transform: "translateY(-50%)", width: "80px", height: "80px", opacity: 0.3, pointerEvents: "none" }} viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="35" stroke="#ffc107" strokeWidth="0.5" />
                <circle cx="40" cy="40" r="24" stroke="#ffc107" strokeWidth="0.5" />
                <circle cx="40" cy="40" r="12" stroke="#ffc107" strokeWidth="1" />
                <circle cx="40" cy="40" r="4" fill="#ffc107" opacity="0.6" />
              </svg>
              <p style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ffc107", marginBottom: "0.45rem" }}>Next Focus</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{next?.label || label(next)}</p>
                <ChevronRight className="size-4" style={{ color: "rgba(255,255,255,0.4)" }} />
              </div>
              <p style={{ fontSize: "0.78rem", color: "rgba(170,185,215,0.6)", lineHeight: 1.5 }}>Strengthen this area to boost your overall accuracy.</p>
            </div>
          )}
          {accuracy !== null && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.65rem" }}>
              <DonutChart percent={acc} />
              <div style={{ display: "grid", gap: "0.3rem", fontSize: "0.72rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6060ff", display: "inline-block" }} />
                  <span style={{ color: "rgba(180,190,220,0.7)" }}>Correct</span>
                  <span style={{ fontWeight: 800, color: "#6080ff", marginLeft: "auto" }}>{acc}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
                  <span style={{ color: "rgba(180,190,220,0.7)" }}>Incorrect</span>
                  <span style={{ fontWeight: 800, color: "#a855f7", marginLeft: "auto" }}>{incorrect}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strongest + Weakest row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
          {strong && (
            <div style={{ borderRadius: "14px", border: "1px solid rgba(34,197,94,0.2)", background: "linear-gradient(135deg,rgba(34,197,94,0.07),rgba(8,10,24,0.6))", padding: "1rem", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                <TrendingUp className="size-3.5" style={{ color: "#22c55e" }} />
                <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#22c55e" }}>Strongest Topic</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>{label(strong)}</p>
                  <p style={{ fontSize: "0.72rem", color: "rgba(170,185,215,0.6)", marginBottom: "0.6rem" }}>Your performance</p>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#22c55e", fontFamily: "'Hanken Grotesk',sans-serif", lineHeight: 1 }}>
                    {strongAcc}% <span style={{ fontSize: "0.75rem", color: "#4ade80" }}>Strong ↑</span>
                  </p>
                </div>
                <RadarPolygon color="#22c55e" points={[80, 70, 85, 65, 75]} />
              </div>
              <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.25rem" }}>
                {["High accuracy", "Consistent performance", "Keep it up!"].map(t => (
                  <p key={t} style={{ fontSize: "0.72rem", color: "#4ade80", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ color: "#22c55e" }}>✓</span> {t}
                  </p>
                ))}
              </div>
            </div>
          )}
          {weak && (
            <div style={{ borderRadius: "14px", border: "1px solid rgba(239,68,68,0.2)", background: "linear-gradient(135deg,rgba(239,68,68,0.07),rgba(8,10,24,0.6))", padding: "1rem", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                <TrendingDown className="size-3.5" style={{ color: "#ef4444" }} />
                <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#ef4444" }}>Weakest Topic</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>{label(weak)}</p>
                  <p style={{ fontSize: "0.72rem", color: "rgba(170,185,215,0.6)", marginBottom: "0.6rem" }}>Your performance</p>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ef4444", fontFamily: "'Hanken Grotesk',sans-serif", lineHeight: 1 }}>
                    {weakAcc}% <span style={{ fontSize: "0.75rem", color: "#f87171" }}>Needs work</span>
                  </p>
                </div>
                <RadarPolygon color="#ef4444" points={[30, 25, 35, 28, 32]} />
              </div>
              <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.25rem" }}>
                {["Low accuracy", "Review key concepts", "Practice more questions"].map(t => (
                  <p key={t} style={{ fontSize: "0.72rem", color: "#f87171", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ color: "#ef4444" }}>⚠</span> {t}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer motivational bar */}
        <div style={{ borderRadius: "12px", background: "linear-gradient(90deg,rgba(30,20,60,0.8),rgba(40,20,80,0.5))", border: "1px solid rgba(100,80,200,0.15)", padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", position: "relative", overflow: "hidden" }}>
          <svg style={{ position: "absolute", right: 0, bottom: 0, width: "160px", height: "50px", opacity: 0.15, pointerEvents: "none" }} viewBox="0 0 160 50" fill="none">
            <rect x="10" y="25" width="8" height="25" fill="#818cf8" />
            <rect x="22" y="15" width="8" height="35" fill="#a78bfa" />
            <rect x="34" y="20" width="8" height="30" fill="#818cf8" />
            <rect x="46" y="10" width="8" height="40" fill="#c4b5fd" />
            <rect x="58" y="30" width="8" height="20" fill="#818cf8" />
            <rect x="70" y="18" width="12" height="32" fill="#a78bfa" />
            <rect x="86" y="8" width="12" height="42" fill="#c4b5fd" />
            <rect x="102" y="22" width="8" height="28" fill="#818cf8" />
            <rect x="114" y="12" width="10" height="38" fill="#a78bfa" />
            <rect x="128" y="5" width="14" height="45" fill="#c4b5fd" />
            <rect x="146" y="18" width="10" height="32" fill="#818cf8" />
          </svg>
          <div style={{ width: "2.2rem", height: "2.2rem", borderRadius: "50%", background: "rgba(100,80,255,0.15)", border: "1px solid rgba(130,110,255,0.25)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Rocket className="size-4" style={{ color: "#a78bfa" }} />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Keep learning, keep growing!</p>
            <p style={{ fontSize: "0.75rem", color: "rgba(170,185,215,0.55)" }}>Focus on weak areas to unlock your next level.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSummaryCard;
