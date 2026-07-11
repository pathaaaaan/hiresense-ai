interface ATSGaugeProps {
  score: number; // 0-100
  size?: number;
}

function bandColor(score: number) {
  if (score >= 75) return { stroke: "#14E8C4", label: "Strong match" };
  if (score >= 50) return { stroke: "#FFB020", label: "Needs work" };
  return { stroke: "#FF5C6C", label: "High risk" };
}

/**
 * Signature element: renders the ATS score as a radar-style "read" rather
 * than a generic progress ring — a scan sweep behind a clean progress arc,
 * echoing the product's core metaphor (scanning a resume for signal).
 */
export function ATSGauge({ score, size = 200 }: ATSGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const { stroke, label } = bandColor(clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* rotating scan sweep, clipped to the circle */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden opacity-40 animate-sweep"
        style={{
          background: `conic-gradient(from 0deg, ${stroke}55, transparent 35%)`,
        }}
      />

      <svg width={size} height={size} className="relative -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#232C38"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-4xl font-semibold text-ink">{Math.round(clamped)}</span>
        <span className="text-xs text-ink-muted mt-1">{label}</span>
      </div>
    </div>
  );
}
