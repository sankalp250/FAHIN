"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface DataPoint {
  date: string;
  cases: number;
  predicted?: number;
}

interface DiseaseChartProps {
  data: DataPoint[];
  disease: string;
  color?: string;
  showPrediction?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-2xl px-3 py-2 text-sm">
      <div className="font-semibold text-ink mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-soft capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DiseaseChart({ data, disease, color = "#F59E0B", showPrediction = false }: DiseaseChartProps) {
  return (
    <div className="neu rounded-3xl p-5 bg-surface">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-ink">{disease} — 14-day Trend</h3>
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            Reported
          </span>
          {showPrediction && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-ink-soft/40" />
              Forecast
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${disease}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="cases" stroke={color} strokeWidth={2}
            fill={`url(#grad-${disease})`} dot={false} activeDot={{ r: 4, fill: color }} />
          {showPrediction && (
            <Line type="monotone" dataKey="predicted" stroke="#94A3B8" strokeWidth={1.5}
              strokeDasharray="5 5" dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
