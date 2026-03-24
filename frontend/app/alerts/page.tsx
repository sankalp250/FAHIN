"use client";

import { useState } from "react";
import { AlertTriangle, MapPin, Clock, TrendingUp, BellRing, Filter } from "lucide-react";

const ALERTS = [
  { id:"1", sector:"Sector-45", city:"Gurugram", disease:"Dengue",     probability:0.84, peakDays:5,  type:"hospital_alert",  status:"delivered", sentAt:"2h ago",  env:"High humidity 88% + AQI 142", severity:"critical" },
  { id:"2", sector:"Sector-17", city:"Gurugram", disease:"Unknown",    probability:0.72, peakDays:3,  type:"authority_alert", status:"delivered", sentAt:"20m ago", env:"Unusual symptom cluster detected", severity:"high" },
  { id:"3", sector:"Sector-32", city:"Gurugram", disease:"Influenza",  probability:0.67, peakDays:8,  type:"hospital_alert",  status:"delivered", sentAt:"4h ago",  env:"Seasonal risk elevation", severity:"high" },
  { id:"4", sector:"Sector-21", city:"Gurugram", disease:"Malaria",    probability:0.51, peakDays:12, type:"hospital_alert",  status:"sent",      sentAt:"1d ago",  env:"Mosquito risk index: 0.73", severity:"moderate" },
  { id:"5", sector:"Sector-8",  city:"Gurugram", disease:"Dengue",     probability:0.38, peakDays:18, type:"public_alert",    status:"sent",      sentAt:"2d ago",  env:"Rainfall spike detected", severity:"low" },
];

const SEV = {
  critical: { label:"Critical", bg:"rgba(239,68,68,0.08)",   border:"rgba(239,68,68,0.2)",   accent:"#EF4444",  badge:"rgba(239,68,68,0.12)" },
  high:     { label:"High",     bg:"rgba(249,115,22,0.08)",  border:"rgba(249,115,22,0.2)",  accent:"#F97316",  badge:"rgba(249,115,22,0.12)" },
  moderate: { label:"Moderate", bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.2)",  accent:"#F59E0B",  badge:"rgba(245,158,11,0.12)" },
  low:      { label:"Low",      bg:"rgba(59,130,246,0.06)",  border:"rgba(59,130,246,0.15)", accent:"#3B82F6",  badge:"rgba(59,130,246,0.1)" },
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all"|"critical"|"high"|"moderate">("all");
  const filtered = filter==="all" ? ALERTS : ALERTS.filter(a => a.severity===filter || (filter==="high"&&a.severity==="critical"));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display font-bold text-3xl text-ink">Outbreak Alerts</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{background:"linear-gradient(135deg,#EF4444,#DC2626)"}}>
              {ALERTS.length} active
            </span>
          </div>
          <p className="text-ink-soft text-sm">AI-predicted outbreaks across Gurugram sectors</p>
        </div>
        <div className="glass rounded-2xl px-4 py-2 flex items-center gap-2">
          <BellRing size={14} color="#F59E0B" />
          <span className="text-xs text-ink-soft font-medium">Push alerts enabled</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter size={14} color="#94A3B8" />
        {(["all","critical","high","moderate"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="btn-pill text-xs capitalize transition-all"
            style={filter===f
              ? {background:"linear-gradient(135deg,#F59E0B,#F97316)",color:"#fff",boxShadow:"0 3px 10px rgba(245,158,11,0.3)"}
              : {background:"#EEF0F5",color:"#64748B",boxShadow:"2px 2px 5px #d1d4dc,-2px -2px 5px #ffffff"}
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <div className="space-y-4">
        {filtered.map(a => {
          const s = SEV[a.severity as keyof typeof SEV] ?? SEV.low;
          return (
            <div key={a.id}
              className="rounded-3xl p-5 transition-all hover:scale-[1.005]"
              style={{background:s.bg, border:`1px solid ${s.border}`, backdropFilter:"blur(12px)"}}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{background:`${s.accent}18`}}>
                    <AlertTriangle size={20} color={s.accent} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-bold text-lg text-ink">{a.disease}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:s.accent}}>
                        {s.label}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize" style={{background:s.badge,color:s.accent}}>
                        {a.type.replace(/_/g," ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-soft">
                      <span className="flex items-center gap-1"><MapPin size={11} />{a.sector}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{a.sentAt}</span>
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px]" style={{background:"rgba(16,185,129,0.1)",color:"#10B981"}}>{a.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-3xl" style={{color:s.accent}}>{Math.round(a.probability*100)}%</div>
                  <div className="text-xs text-ink-soft">probability</div>
                </div>
              </div>

              {/* Progress */}
              <div className="h-1.5 bg-black/6 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${Math.round(a.probability*100)}%`, background:`linear-gradient(90deg,${s.accent}88,${s.accent})`}} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-ink-soft">
                  <span className="flex items-center gap-1">
                    <TrendingUp size={11} color={s.accent} />
                    Peak expected in <strong className="text-ink ml-1">{a.peakDays} days</strong>
                  </span>
                  <span>·</span>
                  <span>{a.env}</span>
                </div>
                <button className="text-xs font-semibold" style={{color:s.accent}}>
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
