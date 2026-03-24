type RiskLevel = "critical" | "high" | "moderate" | "low" | "safe";

const CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  critical: { label: "Critical", color: "#EF4444" },
  high:     { label: "High",     color: "#F97316" },
  moderate: { label: "Moderate", color: "#F59E0B" },
  low:      { label: "Low",      color: "#3B82F6" },
  safe:     { label: "Safe",     color: "#10B981" },
};

export function getRiskLevel(probability: number): RiskLevel {
  if (probability >= 0.8) return "critical";
  if (probability >= 0.6) return "high";
  if (probability >= 0.4) return "moderate";
  if (probability >= 0.2) return "low";
  return "safe";
}

export default function RiskBadge({ probability, size = "sm" }: { probability: number; size?: "sm" | "md" }) {
  const level = getRiskLevel(probability);
  const { label, color } = CONFIG[level];
  const padding = size === "md" ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`font-bold rounded-full text-white ${padding}`}
      style={{ background: color }}
    >
      {label}
    </span>
  );
}
