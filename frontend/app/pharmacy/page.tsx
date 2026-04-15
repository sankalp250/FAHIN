"use client";

import { useState, useEffect } from "react";
import { Pill, TrendingUp, TrendingDown, AlertCircle, Plus, BarChart3, Loader2, ShieldCheck } from "lucide-react";
import { useRouter} from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthContext";

const FLAG_STYLES: any = {
  critical: { label:"🚨 Critical spike", bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.2)", badge:"#EF4444" },
  spike:    { label:"⚠️ Spike detected", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)", badge:"#F59E0B" },
  normal:   { label:"✓ Normal",          bg:"rgba(248,249,252,1)",   border:"rgba(0,0,0,0.06)",    badge:"#94A3B8" },
};

export default function PharmacyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ medicine: "", quantity: "", sector: "Sector-45", category: "Antipyretic" });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setForm(p => ({ ...p, sector: user.city_sector || "Sector-45" }));
      fetchAnomalies();
    }
  }, [user, authLoading]);

  const fetchAnomalies = async () => {
    try {
      const data = await api.pharmacy.spikes(user?.city || "Gurugram");
      setSales(data);
    } catch (err) {
      console.error("Failed to fetch pharmacy spikes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.medicine || !form.quantity) return;
    setSubmitting(true);
    try {
      await api.pharmacy.submit({
        medicine_name: form.medicine,
        quantity_sold: parseInt(form.quantity),
        city_sector: form.sector,
        city: user?.city || "Gurugram",
        sale_date: new Date().toISOString().split('T')[0]
      });
      setForm({ ...form, medicine: "", quantity: "" });
      fetchAnomalies();
    } catch (err) {
      console.error("Failed to submit sales", err);
    } finally {
      setSubmitting(false);
    }
  };

  const spikes = sales.filter(s => s.deviation_score >= 1.5).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-accent" size={32} />
      <p className="text-ink-soft text-sm">Accessing pharmacy network...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink">Pharmacy Sales</h1>
          <p className="text-ink-soft mt-1 text-sm">Medicine sales anomaly detection across {user?.city || "Gurugram"} sectors</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass rounded-2xl px-4 py-2 flex items-center gap-2">
            <AlertCircle size={14} color="#F59E0B" />
            <span className="text-xs font-semibold text-ink-soft">{spikes} anomalies detected today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:"Sales Reports Today", value: sales.length,  sub:`Across ${user?.city || "Gurugram"}`,     accent:"#3B82F6",  icon:BarChart3 },
          { label:"Anomalies Flagged",   value: String(spikes), sub:"Above 1.5× baseline",accent:"#F59E0B",  icon:TrendingUp },
          { label:"System Health",     value:"Optimal",   sub:"Analysis agents online", accent:"#10B981", icon:ShieldCheck },
        ].map(({ label, value, sub, accent, icon: Icon }: any) => (
          <div key={label} className="neu rounded-3xl p-5 bg-surface flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-soft font-medium">{label}</span>
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{background:`${accent}15`}}>
                <Icon size={17} color={accent} />
              </div>
            </div>
            <div className="font-display font-bold text-3xl text-ink">{value}</div>
            <div className="text-xs text-ink-soft">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 neu rounded-3xl p-6 bg-surface">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-xl text-ink">Sales Anomaly Feed</h2>
            <button onClick={fetchAnomalies} className="text-xs text-accent font-bold">Refresh Feed</button>
          </div>
          <div className="space-y-3">
            {sales.length === 0 ? (
              <p className="text-ink-soft text-sm text-center py-10">No significant sales anomalies detected recently.</p>
            ) : sales.map((s, i) => {
              const flag = s.deviation_score >= 3 ? "critical" : s.deviation_score >= 1.5 ? "spike" : "normal";
              const f = FLAG_STYLES[flag];
              const deviationPct = Math.round(s.deviation_score * 100);
              return (
                <div key={i} className="rounded-2xl p-4 transition-all"
                  style={{background:f.bg, border:`1px solid ${f.border}`}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${f.badge}18`}}>
                        <Pill size={15} color={f.badge} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">{s.medicine_name}</div>
                        <div className="text-xs text-ink-soft">{s.category || "General"} · {s.city_sector}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:f.badge}}>
                      {f.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-ink-soft">Sold: </span>
                      <span className="font-bold text-ink">{s.quantity_sold} units</span>
                    </div>
                    <div>
                      <span className="text-ink-soft">Baseline: </span>
                      <span className="font-semibold text-ink">{Math.round(s.baseline_avg_30d || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.deviation_score > 0.5
                        ? <TrendingUp size={12} color={f.badge} />
                        : <TrendingDown size={12} color="#10B981" />
                      }
                      <span className="font-bold" style={{color: s.deviation_score > 0.5 ? f.badge : "#10B981"}}>
                        {s.deviation_score > 0
                          ? `+${deviationPct}% dev`
                          : "Normal range"
                        }
                      </span>
                    </div>
                    <span className="text-ink-soft ml-auto">{new Date(s.sale_date).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="neu rounded-3xl p-5 bg-surface h-fit">
          <h2 className="font-display font-semibold text-ink mb-4">Submit Sales Data</h2>
          <div className="space-y-4">
            {[
              { label:"Medicine Name", key:"medicine", placeholder:"e.g. Paracetamol 500mg" },
              { label:"Quantity Sold", key:"quantity", placeholder:"e.g. 480" },
            ].map(({ label, key, placeholder }: any) => (
              <div key={key}>
                <label className="text-xs font-semibold text-ink-soft mb-1.5 block">{label}</label>
                <input
                  className="w-full rounded-2xl px-4 py-2.5 text-sm text-ink outline-none transition-all"
                  style={{background:"#EEF0F5", boxShadow:"inset 3px 3px 6px #d1d4dc,inset -3px -3px 6px #ffffff"}}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-ink-soft mb-1.5 block">Sector</label>
              <select
                className="w-full rounded-2xl px-4 py-2.5 text-sm text-ink outline-none"
                style={{background:"#EEF0F5",boxShadow:"inset 3px 3px 6px #d1d4dc,inset -3px -3px 6px #ffffff"}}
                value={form.sector}
                onChange={e => setForm(p => ({...p, sector: e.target.value}))}
              >
                {["Sector-45","Sector-32","Sector-21","Sector-17","Sector-8","Sector-3"].map(s =>
                  <option key={s}>{s}</option>
                )}
              </select>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting||!form.medicine||!form.quantity}
              className="btn-pill w-full py-3 flex items-center justify-center gap-2 text-sm transition-all shadow-glow"
              style={(!form.medicine||!form.quantity||submitting)
                ? {background:"#E2E8F0",color:"#94A3B8",cursor:"not-allowed",borderRadius:"9999px"}
                : {background:"linear-gradient(135deg,#F59E0B,#F97316)",color:"#fff",borderRadius:"9999px"}
              }
            >
              {submitting ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} 
              {submitting ? "Submitting..." : "Submit Sales"}
            </button>
          </div>
          <div className="mt-4 glass rounded-2xl p-3">
            <p className="text-[10px] text-ink-soft text-center leading-relaxed">
              Data is automatically processed for anomaly detection. PII is never stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
