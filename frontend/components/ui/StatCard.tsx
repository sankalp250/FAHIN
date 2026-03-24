import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  trend?: { value: string; up: boolean };
}

export default function StatCard({ icon: Icon, label, value, sub, accent, trend }: StatCardProps) {
  return (
    <div className="neu rounded-3xl p-5 bg-surface flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft font-medium">{label}</span>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <Icon size={17} color={accent} />
        </div>
      </div>
      <div className="font-display font-bold text-3xl text-ink leading-none">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-soft">{sub}</span>
        {trend && (
          <span className="text-xs font-semibold" style={{ color: trend.up ? "#EF4444" : "#10B981" }}>
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
