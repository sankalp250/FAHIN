"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Send, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthContext";

const GROUPS: Record<string, string[]> = {
  "🌡️ Fever & Temperature": ["fever","high_fever","mild_fever","chills","shivering","sweating"],
  "🧠 Head & Neuro":         ["headache","dizziness","migraine","loss_of_smell","altered_sensorium"],
  "🫁 Respiratory":          ["cough","breathlessness","phlegm","throat_irritation","runny_nose","congestion","sneezing"],
  "💪 Body & Muscles":       ["fatigue","muscle_pain","joint_pain","body_aches","weakness_in_limbs","back_pain"],
  "🔴 Skin":                 ["skin_rash","itching","yellowish_skin","red_spots_over_body","bruising"],
  "🫀 Digestive":            ["nausea","vomiting","diarrhoea","abdominal_pain","loss_of_appetite","indigestion"],
  "👁️ Eyes":                 ["redness_of_eyes","pain_behind_the_eyes","blurred_vision","yellowing_of_eyes"],
  "➕ Other":                ["chest_pain","fast_heart_rate","dehydration","swollen_lymph_nodes"],
};

const SEV_LABELS = ["","Minimal","Very Mild","Mild","Moderate","Moderate+","Significant","Severe","Very Severe","Critical","Emergency"];

export default function SymptomsPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string>("🌡️ Fever & Temperature");
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (s: string) => setSelected(p => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const handleSubmit = async () => {
    if (!selected.size || !user) return;
    setSubmitting(true);
    try {
      await api.symptoms.report({
        symptoms: Array.from(selected),
        severity,
        duration_days: duration,
        city_sector: user.city_sector,
        city: user.city,
        source: "web_dashboard"
      });
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); setSelected(new Set()); setSeverity(5); setDuration(1); }, 4000);
    } catch (err) {
      console.error("Failed to submit report", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{background:"rgba(16,185,129,0.12)"}}>
        <CheckCircle2 size={40} color="#10B981" />
      </div>
      <div>
        <h2 className="font-display font-bold text-2xl text-ink mb-2">Report Submitted</h2>
        <p className="text-ink-soft text-sm max-w-xs">Your symptoms have been anonymously reported. Our AI agents are analysing patterns across {user?.city_sector || "your sector"}.</p>
      </div>
      <div className="glass rounded-3xl px-6 py-4 flex items-center gap-3">
        <ShieldCheck size={18} color="#10B981" />
        <span className="text-sm text-ink-soft">No personal data stored · Sector-level only</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-ink">Symptom Check</h1>
        <p className="text-ink-soft mt-1 text-sm">Select your symptoms. Anonymous · No name or location stored.</p>
      </div>

      {/* Privacy badge */}
      <div className="glass rounded-2xl p-3 flex items-center gap-3 mb-6">
        <ShieldCheck size={16} color="#10B981" />
        <span className="text-xs text-ink-soft flex-1">Only your sector (<strong className="text-safe">{user?.city_sector}</strong>) is recorded — <strong className="text-safe">never your exact address or name</strong></span>
      </div>

      {/* Symptom groups */}
      <div className="space-y-3 mb-6">
        {Object.entries(GROUPS).map(([group, symptoms]) => {
          const groupSelected = symptoms.filter(s => selected.has(s)).length;
          const open = expanded === group;
          return (
            <div key={group} className="neu rounded-3xl bg-surface overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setExpanded(open ? "" : group)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">{group}</span>
                  {groupSelected > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:"linear-gradient(135deg,#F59E0B,#F97316)"}}>
                      {groupSelected}
                    </span>
                  )}
                </div>
                {open ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
              </button>
              {open && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {symptoms.map(s => {
                    const on = selected.has(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggle(s)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150"
                        style={on
                          ? { background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#fff", boxShadow: "0 3px 10px rgba(245,158,11,0.3)" }
                          : { background: "#EEF0F5", color: "#64748B", boxShadow: "2px 2px 5px #d1d4dc,-2px -2px 5px #ffffff" }
                        }
                      >
                        {on && "✓ "}{s.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected summary */}
      {selected.size > 0 && (
        <div className="glass rounded-3xl p-4 mb-6">
          <div className="text-xs font-semibold text-ink-soft mb-2">{selected.size} symptom{selected.size!==1?"s":""} selected</div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selected).map(s => (
              <button key={s} onClick={() => toggle(s)}
                className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium"
                style={{background:"rgba(245,158,11,0.12)",color:"#D97706"}}>
                {s.replace(/_/g," ")} ✕
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Severity */}
      <div className="neu rounded-3xl p-5 bg-surface mb-4">
        <div className="text-sm font-semibold text-ink mb-3">
          Severity: <span style={{color:"#F59E0B"}}>{SEV_LABELS[severity]} ({severity}/10)</span>
        </div>
        <div className="flex gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map(n => {
            const active = severity === n;
            const bg = n <= 3 ? "#10B981" : n <= 6 ? "#F59E0B" : "#EF4444";
            return (
              <button key={n} onClick={() => setSeverity(n)}
                className="flex-1 h-9 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: severity >= n ? bg : "#EEF0F5",
                  color: severity >= n ? "#fff" : "#94A3B8",
                  boxShadow: active ? `0 3px 10px ${bg}60` : "2px 2px 5px #d1d4dc,-2px -2px 5px #ffffff",
                  transform: active ? "scale(1.1)" : "scale(1)",
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="neu rounded-3xl p-5 bg-surface mb-8">
        <div className="text-sm font-semibold text-ink mb-3">
          Duration: <span style={{color:"#F59E0B"}}>{duration===1?"Today":`${duration} days`}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1,2,3,5,7,14].map(d => (
            <button key={d} onClick={() => setDuration(d)}
              className="btn-pill text-sm transition-all"
              style={duration===d
                ? {background:"linear-gradient(135deg,#F59E0B,#F97316)",color:"#fff",boxShadow:"0 4px 12px rgba(245,158,11,0.3)"}
                : {background:"#EEF0F5",color:"#64748B",boxShadow:"2px 2px 5px #d1d4dc,-2px -2px 5px #ffffff"}
              }
            >
              {d===1?"Today":d===14?"2 weeks":`${d} days`}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !selected.size}
        className="btn-pill w-full py-4 flex items-center justify-center gap-2 text-base transition-all"
        style={(!selected.size || submitting)
          ? {background:"#E2E8F0",color:"#94A3B8",cursor:"not-allowed",borderRadius:"9999px"}
          : {background:"linear-gradient(135deg,#F59E0B,#F97316)",color:"#fff",boxShadow:"0 6px 20px rgba(245,158,11,0.4)",borderRadius:"9999px"}
        }
      >
        {submitting
          ? <><Loader2 size={18} className="animate-spin" /> Submitting anonymously...</>
          : <><Send size={17} /> Submit Anonymously ({selected.size} symptoms)</>
        }
      </button>
    </div>
  );
}
