"use client";

import { useState } from "react";
import { Pill, TrendingUp, TrendingDown, AlertCircle, Plus, BarChart3 } from "lucide-react";

const SALES = [
  { medicine:"Paracetamol 500mg", category:"Antipyretic",  sector:"Sector-45", sold:480, baseline:120, deviation:3.0, date:"Today",      flag:"spike" },
  { medicine:"Dengue Test Kit",    category:"Diagnostics",  sector:"Sector-45", sold:95,  baseline:12,  deviation:6.9, date:"Today",      flag:"critical" },
  { medicine:"ORS Sachets",        category:"Rehydration",  sector:"Sector-32", sold:320, baseline:85,  deviation:2.8, date:"Today",      flag:"spike" },
  { medicine:"Chloroquine",        category:"Antimalarial", sector:"Sector-21", sold:145, baseline:40,  deviation:2.6, date:"Today",      flag:"spike" },
  { medicine:"Amoxicillin 250mg",  category:"Antibiotic",   sector:"Sector-17", sold:210, baseline:180, deviation:0.2, date:"Today",      flag:"normal" },
  { medicine:"Cetirizine",         category:"Antihistamine",sector:"Sector-8",  sold:88,  baseline:75,  deviation:0.2, date:"Yesterday",  flag:"normal" },
  { medicine:"Ibuprofen 400mg",    category:"NSAID",        sector:"Sector-32", sold:155, baseline:130, deviation:0.2, date:"Yesterday",  flag:"normal" },
];

const FLAG_STYLES = {
  critical: { label:"🚨 Critical spike", bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.2)", badge:"#EF4444" },
  spike:    { label:"⚠️ Spike detected", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)", badge:"#F59E0B" },
  normal:   { label:"✓ Normal",          bg:"rgba(248,249,252,1)",   border:"rgba(0,0,0,0.06)",    badge:"#94A3B8" },
};

export default function PharmacyPage() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ medicine: "", quantity: "", sector: "Sector-45", category: "Antipyretic" });

  const spikes = SALES.filter(s => s.flag !== "normal").length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink">Pharmacy Sales</h1>
          <p className="text-ink-soft mt-1 text-sm">Medicine sales anomaly detection across city sectors</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass rounded-2xl px-4 py-2 flex items-center gap-2">
            <AlertCircle size={14} color="#F59E0B" />
            <span className="text-xs font-semibold text-ink-soft">{spikes} anomalies detected today</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:"Sales Reports Today", value:"24",  sub:"From 8 pharmacies",     accent:"#3B82F6",  icon:BarChart3 },
          { label:"Anomalies Flagged",   value: String(spikes), sub:"Above 2× baseline",accent:"#F59E0B",  icon:TrendingUp },
          { label:"Critical Spikes",     value:"1",   sub:"Require immediate alert", accent:"#EF4444", icon:AlertCircle },
        ].map(({ label, value, sub, accent, icon: Icon }) => (
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
        {/* Sales table */}
        <div className="col-span-2 neu rounded-3xl p-6 bg-surface">
          <h2 className="font-display font-semibold text-xl text-ink mb-5">Sales Anomaly Feed</h2>
          <div className="space-y-3">
            {SALES.map((s, i) => {
              const f = FLAG_STYLES[s.flag as keyof typeof FLAG_STYLES];
              const deviationPct = Math.round((s.deviation - 1) * 100);
              return (
                <div key={i} className="rounded-2xl p-4 transition-all"
                  style={{background:f.bg, border:`1px solid ${f.border}`}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${f.badge}18`}}>
                        <Pill size={15} color={f.badge} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">{s.medicine}</div>
                        <div className="text-xs text-ink-soft">{s.category} · {s.sector}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:f.badge}}>
                      {f.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-ink-soft">Sold: </span>
                      <span className="font-bold text-ink">{s.sold} units</span>
                    </div>
                    <div>
                      <span className="text-ink-soft">Baseline: </span>
                      <span className="font-semibold text-ink">{s.baseline}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.deviation > 1.5
                        ? <TrendingUp size={12} color={f.badge} />
                        : <TrendingDown size={12} color="#10B981" />
                      }
                      <span className="font-bold" style={{color: s.deviation>1.5 ? f.badge : "#10B981"}}>
                        {s.deviation > 1
                          ? `+${deviationPct}% above normal`
                          : "Normal range"
                        }
                      </span>
                    </div>
                    <span className="text-ink-soft ml-auto">{s.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit form */}
        <div className="neu rounded-3xl p-5 bg-surface">
          <h2 className="font-display font-semibold text-ink mb-4">Submit Sales Data</h2>
          <div className="space-y-4">
            {[
              { label:"Medicine Name", key:"medicine", placeholder:"e.g. Paracetamol 500mg" },
              { label:"Quantity Sold", key:"quantity", placeholder:"e.g. 480" },
            ].map(({ label, key, placeholder }) => (
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
              onClick={async() => { setSubmitting(true); await new Promise(r=>setTimeout(r,1200)); setSubmitting(false); setForm({medicine:"",quantity:"",sector:"Sector-45",category:"Antipyretic"}); }}
              disabled={submitting||!form.medicine||!form.quantity}
              className="btn-pill w-full py-3 flex items-center justify-center gap-2 text-sm transition-all"
              style={(!form.medicine||!form.quantity||submitting)
                ? {background:"#E2E8F0",color:"#94A3B8",cursor:"not-allowed",borderRadius:"9999px"}
                : {background:"linear-gradient(135deg,#F59E0B,#F97316)",color:"#fff",boxShadow:"0 4px 15px rgba(245,158,11,0.35)",borderRadius:"9999px"}
              }
            >
              <Plus size={15} /> {submitting ? "Submitting..." : "Submit Sales"}
            </button>
          </div>
          <div className="mt-4 glass rounded-2xl p-3">
            <p className="text-[10px] text-ink-soft text-center">
              Data aggregated only — no individual sales recorded
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
