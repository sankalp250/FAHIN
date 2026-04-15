"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, Clock, TrendingUp, BellRing, Filter, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, AlertResponse } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthContext";

const SEV = {
  critical: { label:"Critical", bg:"rgba(239,68,68,0.08)",   border:"rgba(239,68,68,0.2)",   accent:"#EF4444",  badge:"rgba(239,68,68,0.12)" },
  high:     { label:"High",     bg:"rgba(249,115,22,0.08)",  border:"rgba(249,115,22,0.2)",  accent:"#F97316",  badge:"rgba(249,115,22,0.12)" },
  moderate: { label:"Moderate", bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.2)",  accent:"#F59E0B",  badge:"rgba(245,158,11,0.12)" },
  low:      { label:"Low",      bg:"rgba(59,130,246,0.06)",  border:"rgba(59,130,246,0.15)", accent:"#3B82F6",  badge:"rgba(59,130,246,0.1)" },
};

export default function AlertsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"critical"|"high"|"moderate">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    const fetchAlerts = async () => {
      try {
        if (!user) return;
        const data = await api.alerts.active(user.city || "Gurugram");
        setAlerts(data);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAlerts();
  }, [user, authLoading]);

  const filtered = filter==="all" 
    ? alerts 
    : alerts.filter(a => {
        const severity = a.probability >= 0.8 ? "critical" : a.probability >= 0.6 ? "high" : "moderate";
        return severity === filter || (filter === "high" && severity === "critical");
      });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-accent" size={32} />
      <p className="text-ink-soft text-sm">Scanning sector status...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display font-bold text-3xl text-ink">Outbreak Alerts</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{background:"linear-gradient(135deg,#EF4444,#DC2626)"}}>
              {alerts.length} active
            </span>
          </div>
          <p className="text-ink-soft text-sm">AI-predicted outbreaks across {user?.city || "Gurugram"} sectors</p>
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
        {filtered.length === 0 ? (
          <div className="neu rounded-3xl p-10 bg-surface flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-safe/10 flex items-center justify-center">
              <TrendingUp className="rotate-180" size={24} color="#10B981" />
            </div>
            <p className="text-ink font-medium">No outbreaks detected at this severity level.</p>
          </div>
        ) : filtered.map(a => {
          const sevKey = a.probability >= 0.8 ? "critical" : a.probability >= 0.6 ? "high" : a.probability >= 0.4 ? "moderate" : "low";
          const s = SEV[sevKey as keyof typeof SEV] ?? SEV.low;
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
                        {a.alert_type?.replace(/_/g," ") || "Hospital Alert"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-soft">
                      <span className="flex items-center gap-1"><MapPin size={11} />{a.city_sector}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(a.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px]" style={{background:"rgba(16,185,129,0.1)",color:"#10B981"}}>sent</span>
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
                    Peak expected in <strong className="text-ink ml-1">{a.days_until_peak || 5} days</strong>
                  </span>
                  <span>·</span>
                  <span className="truncate max-w-[300px]">{a.message || "Unusual symptom cluster detected"}</span>
                </div>
                <button className="text-xs font-semibold" style={{color:s.accent}}>
                  View Analysis →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
