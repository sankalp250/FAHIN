"use client";

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import PillButton from '@/components/ui/PillButton';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  AlertTriangle, 
  Stethoscope, 
  ShieldCheck, 
  ChevronRight,
  Activity,
  AlertCircle
} from 'lucide-react';

const HospitalPortal = () => {
  const { data: alerts, error } = useSWR('/alerts', fetcher);
  const { data: metrics } = useSWR('/dashboard/metrics', fetcher);

  const activeCity = metrics?.city || "Metropolis";

  const protocols = [
    { title: "Respiratory Isolation", level: "High", icon: ShieldCheck, description: "Mandatory masking and isolation for fever/cough cases." },
    { title: "Symptom Triage", level: "Standard", icon: Stethoscope, description: "Standard screening at all entry points." },
    { title: "Data Reporting", level: "Active", icon: Activity, description: "Hourly case sync with central FAHIN cluster." }
  ];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="px-3 py-1 bg-safe/10 text-safe text-[10px] font-black uppercase tracking-widest rounded-full border border-safe/20">
                Medical Network Active
             </div>
          </div>
          <h2 className="text-4xl font-extrabold font-display tracking-tight text-ink">
            Hospital Signal: <span className="text-accent">{activeCity}</span>
          </h2>
          <p className="text-ink-soft mt-1 font-medium">
            Emergency protocols and real-time outbreak synchronization for healthcare providers.
          </p>
        </div>
        <div className="flex gap-4">
          <PillButton 
            variant="secondary"
            onClick={() => {
              window.location.reload(); // Simple sync for now
            }}
          >
            Sync Data
          </PillButton>
          <PillButton
            onClick={() => {
              const sector = prompt("Which sector are you reporting for?");
              if (sector) {
                 alert(`Local case reported for ${sector}. Data is being synchronized with the City Command Center.`);
              }
            }}
          >
            Report Local Case
          </PillButton>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Active Alerts for Hospitals */}
        <div className="lg:col-span-8 space-y-8">
          <h3 className="text-2xl font-bold font-display px-2 flex items-center gap-3">
            <AlertTriangle className="text-danger" size={24} />
            Immediate Action Required
          </h3>
          
          {!alerts && !error ? (
            <div className="h-64 flex items-center justify-center neu glass rounded-3xl animate-pulse">
              <p className="text-ink-soft font-bold">Fetching Live Alerts...</p>
            </div>
          ) : alerts?.length === 0 ? (
            <GlassCard className="text-center py-20">
              <ShieldCheck size={48} className="mx-auto text-safe mb-4 opacity-20" />
              <p className="text-ink font-bold">No Active Outbreaks</p>
              <p className="text-sm text-ink-soft mt-1">Status: Stable across all sectors.</p>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {alerts?.map((alert: any) => (
                <GlassCard key={alert.id} className="relative overflow-hidden group">
                  <div className={cn(
                    "absolute top-0 left-0 w-1.5 h-full",
                    alert.severity === 'Critical' ? "bg-danger" : "bg-warn"
                  )} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center neu",
                        alert.severity === 'Critical' ? "bg-danger/10 text-danger" : "bg-warn/10 text-warn"
                      )}>
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold font-display">{alert.sector}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase text-white",
                            alert.severity === 'Critical' ? "bg-danger" : "bg-warn"
                          )}>{alert.severity} Risk</span>
                        </div>
                        <p className="text-sm text-danger font-black mt-1 uppercase tracking-tighter">Detected: {alert.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-ink-soft uppercase">Action Protocol</p>
                        <p className="text-sm font-bold text-ink">Phase 2: CONTAINMENT</p>
                      </div>
                      <ChevronRight size={20} className="text-ink-soft self-center" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          <div className="pt-10">
             <h3 className="text-2xl font-bold font-display px-2 mb-6">Medical Support Hotlines</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="flex items-center gap-4 py-6">
                   <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Building2 size={20} />
                   </div>
                   <div>
                      <p className="font-bold text-ink">Epidemiology Unit</p>
                      <p className="text-xs text-ink-soft">+91 033 2831 0092</p>
                   </div>
                </GlassCard>
                <GlassCard className="flex items-center gap-4 py-6">
                   <div className="w-10 h-10 rounded-full bg-safe/10 flex items-center justify-center text-safe">
                      <Activity size={20} />
                   </div>
                   <div>
                      <p className="font-bold text-ink">Emergency Sync</p>
                      <p className="text-xs text-ink-soft">sync-status: ACTIVE</p>
                   </div>
                </GlassCard>
             </div>
          </div>
        </div>

        {/* Protocols & Guidelines */}
        <div className="lg:col-span-4 space-y-8">
          <GlassCard className="bg-ink text-white neu">
            <h3 className="text-xl font-bold font-display flex items-center gap-3 mb-6">
              <ShieldCheck className="text-safe" size={20} />
              Active Protocols
            </h3>
            <div className="space-y-6">
               {protocols.map((p, i) => (
                 <div key={i} className="space-y-2 group cursor-pointer">
                    <div className="flex items-center gap-3">
                       <p className="text-xs font-black uppercase text-safe tracking-widest">{p.level}</p>
                       <div className="flex-1 h-px bg-white/10 group-hover:bg-safe/30 transition-colors" />
                    </div>
                    <div className="flex gap-4">
                       <p className="font-bold text-sm leading-tight flex-1">{p.title}</p>
                       <p className="text-[10px] opacity-60">ID: PR-0{i+1}</p>
                    </div>
                    <p className="text-xs opacity-60 leading-relaxed group-hover:opacity-100 transition-opacity">
                       {p.description}
                    </p>
                 </div>
               ))}
            </div>
            <PillButton variant="primary" className="w-full mt-10">Download Guideline PDF</PillButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default HospitalPortal;
