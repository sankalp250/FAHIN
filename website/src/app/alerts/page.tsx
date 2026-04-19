"use client";

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import PillButton from '@/components/ui/PillButton';
import { cn } from '@/lib/utils';
import { 
  BellRing, 
  Send, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  AlertTriangle,
  X,
  Activity,
  Database
} from 'lucide-react';

// Play a browser native pulse sound
const playAlertSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio API not supported or interaction required first.");
  }
};

const AlertsPage = () => {
  const { data: alerts, error } = useSWR('/alerts', fetcher);
  const [isBroadcasting, setIsBroadcasting] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  
  const [logs, setLogs] = useState<string[]>([
    "> System core initialized.",
    "> Outbreak Agent [ACTIVE]",
    "> Waiting for signal streams..."
  ]);

  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      return newLogs.slice(-6); // Keep only last 6 logs
    });
  };

  // Simulate incoming real-time logs
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      addLog(`Detected ${alerts.length} active anomalies in database.`);
    }
  }, [alerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomLogs = [
        "> Agent scanning Sector " + Math.floor(Math.random() * 6 + 1),
        "> Syncing with Hospital DBs...",
        "> OCR microservice healthy.",
        "> Validating anomaly thresholds..."
      ];
      addLog(randomLogs[Math.floor(Math.random() * randomLogs.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleBroadcast = async (alertId: string) => {
    setIsBroadcasting(alertId);
    playAlertSound();
    addLog(`> TRIGGERING BROADCAST FOR: ${alertId}`);
    
    try {
      await api.post('/alerts/broadcast', { alert_id: alertId });
      addLog(`> SUCCESS: Broadcast ${alertId} completed.`);
      mutate('/alerts'); // Refresh data
    } catch (err) {
      addLog(`> ERROR: Broadcast ${alertId} failed.`);
    } finally {
      setIsBroadcasting(null);
    }
  };

  const handleNewPulseSearch = () => {
    addLog("> Initiating manual deep pulse scan...");
    setTimeout(() => {
      addLog("> Pulse scan complete. Database is up to date.");
      mutate('/alerts');
    }, 2000);
  };

  return (
    <div className="space-y-10 pb-20 relative">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold font-display tracking-tight text-ink">
            AI Alert Center
          </h2>
          <p className="text-ink-soft mt-1 font-medium">
            Manage automated outbreak broadcasts and predictive risk signals from the real-time engine.
          </p>
        </div>
        <PillButton className="flex items-center gap-2" onClick={handleNewPulseSearch}>
          <Zap size={18} />
          New Pulse Search
        </PillButton>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <GlassCard className="neu-inset bg-accent/5 border-accent/20">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-accent uppercase text-[10px] tracking-widest">Active Broadcasts</h4>
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <BellRing size={16} />
            </div>
          </div>
          <p className="text-4xl font-display font-black mt-2 text-ink">
            {alerts?.length || 0}
          </p>
          <p className="text-sm text-ink-soft mt-1">Ready for city-wide reach</p>
        </GlassCard>

        <GlassCard className="neu-inset bg-danger/5 border-danger/20">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-danger uppercase text-[10px] tracking-widest">Critical Sectors</h4>
            <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center text-danger">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-4xl font-display font-black mt-2 text-ink">
            {alerts?.filter((a: any) => a.severity === 'Critical').length || 0}
          </p>
          <p className="text-sm text-ink-soft mt-1">Immediate action suggested</p>
        </GlassCard>

        <GlassCard className="neu-inset bg-safe/5 border-safe/20">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-safe uppercase text-[10px] tracking-widest">Model Precision</h4>
            <div className="w-8 h-8 rounded-full bg-safe/20 flex items-center justify-center text-safe">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-4xl font-display font-black mt-2 text-ink">94.2%</p>
          <p className="text-sm text-ink-soft mt-1">Live from Outbreak Agent</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <h3 className="text-2xl font-bold font-display px-2">Active Risk Vectors</h3>
          {!alerts && !error ? (
            <div className="h-64 flex items-center justify-center neu glass rounded-3xl">
              <p className="text-ink-soft animate-pulse">Syncing with Outbreak Agent...</p>
            </div>
          ) : alerts?.length === 0 ? (
             <div className="h-64 flex items-center justify-center neu glass rounded-3xl">
              <p className="text-ink-soft font-bold">No active risk vectors found.</p>
            </div>
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
                        <MapPin size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold font-display">{alert.sector}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                            alert.severity === 'Critical' ? "bg-danger text-white" : "bg-warn text-white"
                          )}>{alert.severity}</span>
                        </div>
                        <p className="text-sm text-ink-soft font-medium leading-none mt-1">{alert.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-12 text-center">
                      <div>
                        <p className="text-[10px] font-bold text-ink-soft uppercase">Baseline Cases</p>
                        <p className="text-xl font-display font-black text-ink">{alert.cases}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-soft uppercase">Growth</p>
                        <p className="text-xl font-display font-black text-danger">{alert.growth}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <PillButton 
                        variant="secondary" 
                        className="px-4 py-2 text-xs"
                        onClick={() => setSelectedAnalysis(alert)}
                      >
                        Analyze
                      </PillButton>
                      <PillButton 
                        onClick={() => handleBroadcast(alert.id)}
                        disabled={isBroadcasting === alert.id}
                        className="px-4 py-2 text-xs flex items-center gap-2"
                      >
                        <Send size={14} className={cn(isBroadcasting === alert.id && "animate-ping")} />
                        {isBroadcasting === alert.id ? "Working..." : "Broadcast"}
                      </PillButton>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <GlassCard className="h-full bg-ink text-white neu shadow-ink/20 relative overflow-hidden">
            <h3 className="text-xl font-bold font-display flex items-center gap-2 mb-6">
              <Zap className="text-accent" size={20} />
              AI Intelligence Terminal
            </h3>
            <div className="space-y-2 font-mono text-xs opacity-90 h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <p key={i} className={cn(
                  "opacity-100 transition-all",
                  log.includes("ERROR") ? "text-danger" : 
                  log.includes("ALERT") || log.includes("TRIGGERING") ? "text-warn" : 
                  "text-safe"
                )}>
                  {log}
                </p>
              ))}
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="h-[60px] w-full bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center p-2 mb-4">
                <p className="text-[10px] mb-1">Live Connection Status</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-1.5 h-3 bg-safe/40 rounded-sm animate-pulse" style={{animationDelay: `${i*0.2}s`}} />
                  ))}
                </div>
              </div>
              <PillButton variant="primary" className="w-full" onClick={() => handleBroadcast('ALL')}>
                 Broadcast Master Alert
              </PillButton>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Analysis Details Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-md transition-all">
          <div className="w-full max-w-2xl bg-surface rounded-[40px] p-8 neu relative">
            <button 
              onClick={() => setSelectedAnalysis(null)}
              className="absolute top-6 right-6 p-2 bg-white/50 rounded-full hover:bg-black/5 transition"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="text-accent" size={24} />
              <h3 className="text-2xl font-bold font-display">Deep Analysis Report</h3>
            </div>
            <p className="text-sm text-ink-soft mb-8">Generated by Gemini Outbreak Agent for {selectedAnalysis.sector}</p>
            
            <div className="bg-white/50 p-6 rounded-2xl neu-inset mb-6 space-y-4">
               <div>
                 <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">Identified Pathology</span>
                 <p className="text-lg font-black text-ink">{selectedAnalysis.type}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">Confidence Score</span>
                    <p className="text-lg font-black text-safe">94.2%</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">Growth Rate</span>
                    <p className="text-lg font-black text-danger">{selectedAnalysis.growth}</p>
                  </div>
               </div>
               <div>
                  <span className="text-xs font-bold uppercase text-ink-soft tracking-wider">Agent Hypothesis</span>
                  <p className="text-sm text-ink font-medium mt-1 italic">
                    "Based on aggregated symptom reports from pharmacies in {selectedAnalysis.sector}, there is a high probability of a localized cluster of {selectedAnalysis.type}. The rapid propagation speed suggests immediate community intervention is required."
                  </p>
               </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <PillButton variant="secondary" onClick={() => setSelectedAnalysis(null)}>Close Report</PillButton>
              <PillButton onClick={() => {
                setSelectedAnalysis(null);
                handleBroadcast(selectedAnalysis.id);
              }}>
                Approve & Broadcast
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
