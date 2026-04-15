"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Activity, MapPin, Brain, Thermometer, Wind, Droplets, ChevronRight, Zap, Clock, Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthContext";

interface SectorRisk { sector: string; disease: string; probability: number; trend: "rising" | "stable" | "falling"; reports: number; }
interface Alert { id: string; sector: string; disease: string; probability: number; peakDays: number; sent_at: string; }

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
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [time, setTime] = useState(new Date());
  const [sectors, setSectors] = useState<SectorRisk[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 10000); return () => clearInterval(t); }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const city = user?.city || "Gurugram";
      
      const [heatmapData, statsData, alertsData] = await Promise.all([
        api.dashboard.heatmap(city),
        api.dashboard.stats(city),
        api.alerts.active(city)
      ]);

      if (heatmapData && heatmapData.sectors) {
        setSectors(heatmapData.sectors.map((s: any) => ({
          sector: s.sector,
          disease: s.top_disease || "Scanning...",
          probability: s.risk_score,
          trend: s.trend as any,
          reports: s.report_count_7d
        })));
      }

      setStats(statsData);
      
      if (alertsData) {
        setAlerts(alertsData.map((a: any) => ({
          id: a.id,
          sector: a.city_sector,
          disease: a.disease,
          probability: a.probability,
          peakDays: a.days_until_peak || 5,
          sent_at: a.sent_at
        })));
      }

    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading || (loading && !stats)) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-accent" size={40} />
      <p className="text-ink-soft font-medium">Synchronizing intelligence nodes...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink">City Dashboard</h1>
          <p className="text-ink-soft mt-1 text-sm">{user?.city || "Gurugram"} · Federated Health Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData} 
            disabled={refreshing}
            className="neu-sm w-10 h-10 rounded-2xl flex items-center justify-center bg-surface hover:scale-105 transition-transform"
          >
            <RefreshCcw size={16} className={refreshing ? "animate-spin text-accent" : "text-ink-soft"} />
          </button>
          <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
            <Clock size={13} color="#64748B" />
            <span className="text-xs text-ink-soft font-medium">{time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
            <span className="text-ink-soft/40">·</span>
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            <span className="text-xs text-safe font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: AlertTriangle, label: "Active Alerts",     value: stats?.active_alerts || 0,     sub: "Requires action",    accent: "#EF4444" },
          { icon: MapPin,        label: "High-Risk Sectors", value: sectors.filter(s => s.probability > 0.6).length,     sub: "Probability > 60%",  accent: "#F97316" },
          { icon: Activity,      label: "Reports Today",     value: stats?.total_reports_today || 0, sub: "Citizens + pharma",  accent: "#3B82F6" },
          { icon: Brain,         label: "Models Online",     value: `${stats?.models_online || 0}/4`,   sub: `FL round ${stats?.fl_round_current || 0} active`, accent: "#8B5CF6" },
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
            <span className="text-xs text-ink-soft bg-black/5 rounded-xl px-3 py-1">Updated just now</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {sectors.map(s => {
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
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Alerts */}
          <div className="neu rounded-3xl p-5 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Active Alerts</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:"rgba(239,68,68,0.12)",color:"#EF4444"}}>{alerts.length}</span>
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-ink-soft text-center py-4">No active alerts for this city.</p>
              ) : alerts.map(a => {
                const ac = a.probability>=0.8?"#EF4444":a.probability>=0.6?"#F97316":"#F59E0B";
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
          </div>
        </div>
      </div>
    </div>
  );
}
