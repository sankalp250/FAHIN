"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Activity, MapPin, Brain, Thermometer, Wind, Droplets, ChevronRight, Zap, Clock } from "lucide-react";

interface SectorRisk { sector: string; disease: string; probability: number; trend: "rising" | "stable" | "falling"; reports: number; }
interface Alert { id: string; sector: string; disease: string; probability: number; peakDays: number; age: string; }

const SECTORS: SectorRisk[] = [
  { sector: "Sector-45", disease: "Dengue",       probability: 0.84, trend: "rising",  reports: 312 },
  { sector: "Sector-32", disease: "Influenza",    probability: 0.67, trend: "rising",  reports: 187 },
  { sector: "Sector-17", disease: "Unknown",      probability: 0.72, trend: "rising",  reports: 94  },
  { sector: "Sector-21", disease: "Malaria",      probability: 0.51, trend: "stable",  reports: 143 },
  { sector: "Sector-8",  disease: "Dengue",       probability: 0.38, trend: "falling", reports: 78  },
  { sector: "Sector-3",  disease: "Typhoid",      probability: 0.29, trend: "stable",  reports: 55  },
  { sector: "Sector-56", disease: "Respiratory",  probability: 0.15, trend: "falling", reports: 31  },
  { sector: "Sector-12", disease: "—",            probability: 0.07, trend: "stable",  reports: 12  },
];

const ALERTS: Alert[] = [
  { id: "1", sector: "Sector-45", disease: "Dengue",    probability: 0.84, peakDays: 5, age: "2h ago" },
  { id: "2", sector: "Sector-17", disease: "Unknown",   probability: 0.72, peakDays: 3, age: "20m ago" },
  { id: "3", sector: "Sector-32", disease: "Influenza", probability: 0.67, peakDays: 8, age: "4h ago" },
];

function getRisk(p: number) {
  if (p >= 0.8) return { label: "Critical", color: "#EF4444" };
  if (p >= 0.6) return { label: "High",     color: "#F97316" };
  if (p >= 0.4) return { label: "Moderate", color: "#F59E0B" };
  if (p >= 0.2) return { label: "Low",      color: "#3B82F6" };
  return             { label: "Safe",       color: "#10B981" };
}

function barColor(p: number) {
  if (p >= 0.6) return "linear-gradient(90deg,#F59E0B,#EF4444)";
  if (p >= 0.3) return "linear-gradient(90deg,#3B82F6,#F59E0B)";
  return "linear-gradient(90deg,#10B981,#3B82F6)";
}

export default function DashboardPage() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 10000); return () => clearInterval(t); }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink">City Dashboard</h1>
          <p className="text-ink-soft mt-1 text-sm">Gurugram · Federated Health Intelligence</p>
        </div>
        <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
          <Clock size={13} color="#64748B" />
          <span className="text-xs text-ink-soft font-medium">{time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
          <span className="text-ink-soft/40">·</span>
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          <span className="text-xs text-safe font-medium">Live</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: AlertTriangle, label: "Active Alerts",     value: "3",     sub: "Requires action",    accent: "#EF4444" },
          { icon: MapPin,        label: "High-Risk Sectors", value: "3",     sub: "Probability > 60%",  accent: "#F97316" },
          { icon: Activity,      label: "Reports Today",     value: "1,842", sub: "Citizens + pharma",  accent: "#3B82F6" },
          { icon: Brain,         label: "Models Online",     value: "4/4",   sub: "FL round 14 active", accent: "#8B5CF6" },
        ].map(({ icon: Icon, label, value, sub, accent }) => (
          <div key={label} className="neu rounded-3xl p-5 bg-surface flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-soft font-medium">{label}</span>
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{background:`${accent}18`}}>
                <Icon size={17} color={accent} />
              </div>
            </div>
            <div className="font-display font-bold text-3xl text-ink leading-none">{value}</div>
            <div className="text-xs text-ink-soft">{sub}</div>
          </div>
        ))}
      </div>

      {/* Env strip */}
      <div className="glass rounded-3xl p-4 mb-8 grid grid-cols-4 gap-4">
        {[
          { icon: Thermometer, label: "Temperature", value: "34.2°C",   color: "#EF4444" },
          { icon: Droplets,    label: "Humidity",    value: "88%",       color: "#3B82F6" },
          { icon: Wind,        label: "AQI",         value: "142",       color: "#F97316" },
          { icon: Zap,         label: "Mosquito Risk", value: "High",    color: "#8B5CF6" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{background:`${color}15`}}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div className="text-xs text-ink-soft">{label}</div>
              <div className="font-display font-bold text-ink text-base leading-tight">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sector heatmap */}
        <div className="col-span-2 neu rounded-3xl p-6 bg-surface">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-xl text-ink">Sector Risk Heatmap</h2>
            <span className="text-xs text-ink-soft bg-black/5 rounded-xl px-3 py-1">Updated 5m ago</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {SECTORS.map(s => {
              const { label, color } = getRisk(s.probability);
              return (
                <div key={s.sector} className="bg-bg rounded-2xl p-3 neu-sm hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-ink">{s.sector}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:color}}>
                      {label}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-soft mb-2">{s.disease}</div>
                  <div className="h-1 bg-black/8 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{width:`${Math.round(s.probability*100)}%`,background:barColor(s.probability)}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-base text-ink">{Math.round(s.probability*100)}%</span>
                    <span className="text-[9px]" style={{color}}>
                      {s.trend==="rising"?"↑":s.trend==="falling"?"↓":"→"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5">
            <span className="text-[10px] text-ink-soft mr-1">Risk:</span>
            {["Safe","Low","Moderate","High","Critical"].map((l,i) => {
              const colors=["#10B981","#3B82F6","#F59E0B","#F97316","#EF4444"];
              return <span key={l} className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{background:colors[i]}}>{l}</span>;
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Alerts */}
          <div className="neu rounded-3xl p-5 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Active Alerts</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:"rgba(239,68,68,0.12)",color:"#EF4444"}}>{ALERTS.length}</span>
            </div>
            <div className="space-y-3">
              {ALERTS.map(a => {
                const sev = a.probability>=0.8?"high":a.probability>=0.6?"medium":"low";
                const ac = {high:"#EF4444",medium:"#F97316",low:"#F59E0B"}[sev];
                return (
                  <div key={a.id} className="rounded-2xl p-3 flex items-center gap-3" style={{background:`${ac}08`,border:`1px solid ${ac}25`}}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${ac}18`}}>
                      <AlertTriangle size={15} color={ac} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">{a.disease}</div>
                      <div className="text-[11px] text-ink-soft">{a.sector} · peak in {a.peakDays}d</div>
                    </div>
                    <div className="font-display font-bold text-lg flex-shrink-0" style={{color:ac}}>{Math.round(a.probability*100)}%</div>
                  </div>
                );
              })}
            </div>
            <button className="btn-pill btn-accent w-full mt-4 text-sm flex items-center justify-center gap-1.5">
              View All <ChevronRight size={14} />
            </button>
          </div>

          {/* 7-day forecast */}
          <div className="neu rounded-3xl p-5 bg-surface">
            <h2 className="font-display font-semibold text-ink mb-4">7-Day Forecast</h2>
            <div className="space-y-3">
              {SECTORS.slice(0,5).map(s => {
                const { color } = getRisk(s.probability);
                return (
                  <div key={s.sector} className="flex items-center gap-3">
                    <span className="text-xs text-ink-soft w-20 truncate">{s.sector}</span>
                    <div className="flex-1 h-1.5 bg-black/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${Math.round(s.probability*100)}%`,background:color}} />
                    </div>
                    <span className="text-xs font-bold text-ink w-8 text-right">{Math.round(s.probability*100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
