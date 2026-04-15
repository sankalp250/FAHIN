"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Upload, Shield, Activity, Database, CheckCircle2, Clock, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthContext";

const HOSPITALS = [
  { name:"Medanta Hospital",      sector:"Sector-38", status:"active", fl_round:14, accuracy:0.934, samples:1250, dp:"ε=1.0", lastSync:"5m ago"  },
  { name:"Artemis Hospital",      sector:"Sector-51", status:"active", fl_round:14, accuracy:0.921, samples:980,  dp:"ε=1.0", lastSync:"8m ago"  },
  { name:"Max Hospital",          sector:"Sector-19", status:"active", fl_round:13, accuracy:0.907, samples:840,  dp:"ε=2.0", lastSync:"20m ago" },
  { name:"Columbia Asia",         sector:"Sector-23", status:"syncing",fl_round:14, accuracy:0.898, samples:620,  dp:"ε=1.0", lastSync:"now"     },
  { name:"Paras Hospital",        sector:"Sector-47", status:"active", fl_round:12, accuracy:0.883, samples:510,  dp:"ε=1.5", lastSync:"1h ago"  },
  { name:"Aarvy Healthcare",      sector:"Sector-14", status:"offline",fl_round:10, accuracy:0.871, samples:320,  dp:"ε=1.0", lastSync:"4h ago"  },
];

const STATS = [
  { sector:"Sector-45", disease:"Dengue",    admissions:23, active:87, icu:8,  date:"Today"     },
  { sector:"Sector-32", disease:"Influenza", admissions:45, active:142,icu:3,  date:"Today"     },
  { sector:"Sector-17", disease:"Unknown",   admissions:12, active:38, icu:5,  date:"Today"     },
  { sector:"Sector-21", disease:"Malaria",   admissions:8,  active:29, icu:1,  date:"Yesterday" },
];

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"hospitals"|"stats"|"fl">("hospitals");
  const [submitForm, setSubmitForm] = useState({ disease:"Dengue", admissions:"", icu:"", sector:"Sector-45" });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink">Hospital Network</h1>
          <p className="text-ink-soft mt-1 text-sm">Federated hospital network management & aggregated statistics</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-2xl px-4 py-2.5">
          <Shield size={14} color="#10B981" />
          <span className="text-xs font-semibold text-safe">FL Round 14 · 4/6 hospitals active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-black/5 rounded-2xl p-1 w-fit">
        {(["hospitals","stats","fl"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={tab===t
              ? {background:"#fff",color:"#1E293B",boxShadow:"2px 2px 8px #d1d4dc,-2px -2px 8px #ffffff"}
              : {color:"#94A3B8"}
            }
          >
            {t==="fl"?"Federated Learning":t}
          </button>
        ))}
      </div>

      {/* ── Tab: Hospitals ── */}
      {tab==="hospitals" && (
        <div className="neu rounded-3xl p-6 bg-surface">
          <h2 className="font-display font-semibold text-xl text-ink mb-5">Connected Hospitals</h2>
          <div className="grid grid-cols-2 gap-4">
            {HOSPITALS.map(h => (
              <div key={h.name} className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
                style={{background:h.status==="offline"?"rgba(239,68,68,0.04)":"rgba(248,249,252,0.8)",
                        border:`1px solid ${h.status==="offline"?"rgba(239,68,68,0.15)":h.status==="syncing"?"rgba(245,158,11,0.2)":"rgba(0,0,0,0.06)"}`}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:"rgba(59,130,246,0.1)"}}>
                      <Building2 size={18} color="#3B82F6" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-ink">{h.name}</div>
                      <div className="text-xs text-ink-soft">{h.sector}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={h.status==="active"
                      ? {background:"rgba(16,185,129,0.12)",color:"#10B981"}
                      : h.status==="syncing"
                      ? {background:"rgba(245,158,11,0.12)",color:"#F59E0B"}
                      : {background:"rgba(239,68,68,0.12)",color:"#EF4444"}
                    }
                  >{h.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-ink-soft">FL Round</span><br/><span className="font-bold text-ink">#{h.fl_round}</span></div>
                  <div><span className="text-ink-soft">Accuracy</span><br/><span className="font-bold text-safe">{(h.accuracy*100).toFixed(1)}%</span></div>
                  <div><span className="text-ink-soft">DP Budget</span><br/><span className="font-bold text-ink">{h.dp}</span></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-ink-soft">{h.samples.toLocaleString()} training samples</span>
                  <span className="flex items-center gap-1 text-ink-soft"><Clock size={10} />{h.lastSync}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Hospital Stats ── */}
      {tab==="stats" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 neu rounded-3xl p-6 bg-surface">
            <h2 className="font-display font-semibold text-xl text-ink mb-5">Admission Reports</h2>
            <div className="space-y-3">
              {STATS.map((s,i) => (
                <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
                  <div>
                    <div className="text-sm font-semibold text-ink">{s.sector}</div>
                    <div className="text-xs text-ink-soft">{s.disease} · {s.date}</div>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 rounded-xl py-2"><div className="font-bold text-blue-600">{s.admissions}</div><div className="text-[10px] text-ink-soft">New</div></div>
                    <div className="bg-orange-50 rounded-xl py-2"><div className="font-bold text-warn">{s.active}</div><div className="text-[10px] text-ink-soft">Active</div></div>
                    <div className="bg-red-50 rounded-xl py-2"><div className="font-bold text-danger">{s.icu}</div><div className="text-[10px] text-ink-soft">ICU</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit stats form */}
          <div className="neu rounded-3xl p-5 bg-surface">
            <h2 className="font-display font-semibold text-ink mb-4">Submit Daily Stats</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-soft mb-1.5 block">Disease Category</label>
                <select className="w-full rounded-2xl px-4 py-2.5 text-sm text-ink outline-none"
                  style={{background:"#EEF0F5",boxShadow:"inset 3px 3px 6px #d1d4dc,inset -3px -3px 6px #ffffff"}}
                  value={submitForm.disease} onChange={e=>setSubmitForm(p=>({...p,disease:e.target.value}))}>
                  {["Dengue","Influenza","Malaria","Typhoid","COVID-19","Respiratory","Other"].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              {[{k:"admissions",l:"New Admissions"},{k:"icu",l:"ICU Occupied"}].map(({k,l})=>(
                <div key={k}>
                  <label className="text-xs font-semibold text-ink-soft mb-1.5 block">{l}</label>
                  <input type="number" className="w-full rounded-2xl px-4 py-2.5 text-sm text-ink outline-none"
                    style={{background:"#EEF0F5",boxShadow:"inset 3px 3px 6px #d1d4dc,inset -3px -3px 6px #ffffff"}}
                    placeholder="0" value={(submitForm as any)[k]}
                    onChange={e=>setSubmitForm(p=>({...p,[k]:e.target.value}))} />
                </div>
              ))}
              <button 
                onClick={async () => {
                  try {
                    await api.hospitals.submitStats({
                      disease: submitForm.disease,
                      new_admissions: parseInt(submitForm.admissions),
                      icu_occupied: parseInt(submitForm.icu),
                      city_sector: user?.city_sector || "Sector-45",
                      report_date: new Date().toISOString().split('T')[0]
                    });
                    alert("Stats submitted successfully");
                    setSubmitForm({ ...submitForm, admissions: "", icu: "" });
                  } catch (err) {
                    console.error(err);
                    alert("Submission failed");
                  }
                }}
                className="btn-pill w-full py-3 text-sm flex items-center justify-center gap-2"
                style={{background:"linear-gradient(135deg,#F59E0B,#F97316)",color:"#fff",boxShadow:"0 4px 15px rgba(245,158,11,0.35)",borderRadius:"9999px"}}>
                <Upload size={14} /> Submit Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Federated Learning ── */}
      {tab==="fl" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 neu rounded-3xl p-6 bg-surface">
            <h2 className="font-display font-semibold text-xl text-ink mb-2">FL Round Progress</h2>
            <p className="text-sm text-ink-soft mb-6">Round 14 of 20 · Disease Classifier model</p>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-ink-soft mb-2">
                <span>Round 14 / 20</span><span>70% complete</span>
              </div>
              <div className="h-3 bg-black/8 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:"70%",background:"linear-gradient(90deg,#F59E0B,#F97316)",boxShadow:"0 0 10px rgba(245,158,11,0.4)"}} />
              </div>
            </div>

            {/* Hospital participation */}
            <div className="space-y-3">
              {HOSPITALS.map(h => (
                <div key={h.name} className="flex items-center gap-4 glass rounded-2xl p-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"rgba(59,130,246,0.1)"}}>
                    <Building2 size={15} color="#3B82F6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink">{h.name}</div>
                    <div className="text-xs text-ink-soft">{h.samples} samples · {h.dp}</div>
                  </div>
                  <div className="w-32 h-1.5 bg-black/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-safe" style={{width:`${h.accuracy*100}%`}} />
                  </div>
                  <span className="text-xs font-bold text-safe w-12 text-right">{(h.accuracy*100).toFixed(1)}%</span>
                  {h.status==="active"
                    ? <CheckCircle2 size={16} color="#10B981" />
                    : h.status==="syncing"
                    ? <Activity size={16} color="#F59E0B" className="animate-pulse" />
                    : <Clock size={16} color="#94A3B8" />
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="neu rounded-3xl p-5 bg-surface">
              <h3 className="font-display font-semibold text-ink mb-4">FL Configuration</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label:"Algorithm",      value:"FedAvg" },
                  { label:"Model",          value:"Disease Classifier" },
                  { label:"Privacy (DP)",   value:"ε=1.0, δ=1e-5" },
                  { label:"Min clients",    value:"3" },
                  { label:"Local epochs",   value:"5 per round" },
                  { label:"Aggregation",    value:"Weighted average" },
                ].map(({label,value})=>(
                  <div key={label} className="flex justify-between py-2 border-b border-black/5 last:border-0">
                    <span className="text-ink-soft">{label}</span>
                    <span className="font-semibold text-ink">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-4 flex items-start gap-3">
              <Shield size={16} color="#10B981" className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-ink mb-1">Privacy guarantee</div>
                <div className="text-[11px] text-ink-soft">Raw patient data never leaves hospital servers. Only DP-noised model weights are transmitted.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
