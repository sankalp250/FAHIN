"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import StatWidget from '@/components/dashboard/StatWidget';
import Heatmap from '@/components/dashboard/Heatmap';
import GlassCard from '@/components/ui/GlassCard';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import PillButton from '@/components/ui/PillButton';
import { cn } from '@/lib/utils';

const DashboardPage = () => {
  const router = useRouter();
  const { data: metrics, error: metricsError } = useSWR('/dashboard/metrics', fetcher);
  const { data: heatmapData, error: heatmapError } = useSWR('/dashboard/heatmap', fetcher);
  const { data: recentAlerts, error: alertsError } = useSWR('/reports/symptom-summaries', fetcher);
  const { data: weatherData, error: weatherError } = useSWR('/dashboard/weather', fetcher);
  const { data: hospitalsData, error: hospitalsError } = useSWR('/hospitals', fetcher);
  const { data: infrastructureMap, error: infraError } = useSWR('/triage/infrastructure-map', fetcher);
  const { data: recommendations, error: recoError } = useSWR('/triage/recommendations', fetcher);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);

  // Calculate Readiness Stats
  const totalBeds = hospitalsData?.reduce((acc: number, h: any) => acc + h.icu_beds_total, 0) || 0;
  const availBeds = hospitalsData?.reduce((acc: number, h: any) => acc + h.icu_beds_available, 0) || 0;
  const avgOxygen = hospitalsData?.length > 0 
    ? (hospitalsData.reduce((acc: number, h: any) => acc + h.oxygen_status, 0) / hospitalsData.length).toFixed(1)
    : "0";

  const activeCity = metrics?.city || "Kolkata";

  const handleGenerateAlert = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownloadReport = () => {
    if (!metrics || !heatmapData) return;
    
    const csvRows = [
      ["Metric", "Value"],
      ["City", activeCity],
      ["Active Cases", metrics.active_cases],
      ["Anomaly Status", metrics.anomaly_status],
      ["Risk Index", metrics.risk_index],
      ["AI Confirmations", metrics.ai_confirmations],
      [],
      ["Sector", "Anomaly Score", "Case Density", "Risk Level"]
    ];

    heatmapData.forEach((sector: any) => {
      csvRows.push([sector.name, sector.anomalyScore.toString(), sector.caseDensity.toString(), sector.riskLevel]);
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + csvRows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fahin_${activeCity.toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 pb-20 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full border border-accent/20">
                Health Intelligence Unit
             </div>
             <div 
               onClick={() => setIsLiveMode(!isLiveMode)}
               className={cn(
                 "flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer transition-all",
                 isLiveMode ? "bg-safe/10 border-safe/20 text-safe" : "bg-warn/10 border-warn/20 text-warn"
               )}
             >
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isLiveMode ? "bg-safe" : "bg-warn")} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isLiveMode ? "Live Mode" : "Test Environment"}</span>
             </div>
          </div>
          <h2 className="text-4xl font-extrabold font-display tracking-tight text-ink">
            City Command: <span className="text-accent">{activeCity}</span>
          </h2>
          <p className="text-ink-soft mt-1 font-medium">
            Monitoring health signals and environmental risk factors.
          </p>
        </div>
        <div className="flex gap-4">
          <PillButton variant="secondary" onClick={handleDownloadReport}>Download Report</PillButton>
          <PillButton onClick={handleGenerateAlert} disabled={isGenerating}>
            {isGenerating ? "Scanning Network..." : "Generate Alert"}
          </PillButton>
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatWidget 
          label="Total Active Cases" 
          value={metrics?.active_cases || "..."} 
          icon={Users} 
          trend={{ value: 12, isUp: true }} 
        />
        <StatWidget 
          label="Anomaly Status" 
          value={metrics?.anomaly_status || "..."} 
          icon={Activity} 
          color={metrics?.anomaly_status === 'High' ? "text-danger" : "text-safe"} 
        />
        
        {/* Weather Widget Integrated into Metrics Row */}
        <GlassCard className="relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={80} />
           </div>
           <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                 <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Environmental Risk</span>
                 {weatherData && (
                    <span className="text-[10px] font-black bg-accent/10 text-accent px-2 py-0.5 rounded-md">
                       {weatherData.description}
                    </span>
                 )}
              </div>
              <div className="mt-4">
                 <h4 className="text-3xl font-black text-ink">
                    {weatherData ? `${weatherData.temp}°C` : "--"}
                 </h4>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-ink-soft">Humidity: {weatherData?.humidity || 0}%</span>
                    <div className="w-1 h-1 rounded-full bg-ink/20" />
                    <span className={cn("text-xs font-bold", (weatherData?.risk_factor || 1) > 1.1 ? "text-danger" : "text-safe")}>
                       Risk: {weatherData?.risk_factor || 1.0}x
                    </span>
                 </div>
              </div>
           </div>
        </GlassCard>

        <StatWidget 
          label="AI Confirmations" 
          value={metrics?.ai_confirmations || "..."} 
          icon={AlertCircle} 
          trend={{ value: 5, isUp: false }} 
        />
      </div>

      {/* Main Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {heatmapData ? (
            <Heatmap data={heatmapData} city={activeCity} />
          ) : (
            <div className="h-[500px] flex items-center justify-center neu glass rounded-[40px]">
              <p className="text-ink-soft font-bold animate-pulse">Loading Live Heatmap Data...</p>
            </div>
          )}
        </div>
        
        <div className="space-y-8">
          <GlassCard className="h-full">
            <h3 className="text-xl font-bold font-display flex items-center gap-2 mb-6">
              <Clock className="text-accent" size={20} />
              Recent AI Signals
            </h3>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert: any, i: number) => (
                  <div key={i} className="flex gap-4 group cursor-pointer hover:bg-black/5 p-2 rounded-xl transition-all" onClick={() => router.push(`/records?sector=${alert.sector}`)}>
                    <div className={cn(
                      "w-1 h-12 rounded-full",
                      alert.risk === 'Critical' ? "bg-danger" : "bg-safe"
                    )} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm">{alert.sector}</h4>
                        <span className="text-[10px] font-bold text-ink-soft uppercase">{alert.time}</span>
                      </div>
                      <p className="text-sm text-ink-soft">{alert.disease}</p>
                    </div>
                    <ChevronRight size={16} className="text-ink-soft group-hover:text-accent self-center" />
                  </div>
                ))
              ) : (
                <p className="text-ink-soft text-sm text-center py-10 italic">No recent signals.</p>
              )}
            </div>
            <PillButton variant="secondary" className="w-full mt-8 text-sm" onClick={() => router.push('/alerts')}>
              View All Signals
            </PillButton>
          </GlassCard>
        </div>
      </div>
      {/* Bottom Row - Mini Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard 
          className="flex items-center gap-6 p-10 cursor-pointer group hover:bg-safe/5 transition-all"
          onClick={() => router.push('/hospitals')}
        >
          <div className="w-16 h-16 rounded-3xl bg-safe/10 flex items-center justify-center text-safe neu group-hover:scale-110 transition-transform">
            <ShieldAlert size={32} />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold font-display">Hospital Readiness</h4>
            <div className="flex gap-6 mt-2">
               <div>
                  <p className="text-[10px] font-black uppercase text-ink-soft mb-1">Oxygen</p>
                  <p className={cn(
                    "text-lg font-black",
                    parseFloat(avgOxygen) < 60 ? "text-danger" : "text-safe"
                  )}>{avgOxygen}%</p>
               </div>
               <div className="w-px h-8 bg-ink/10 self-center" />
               <div>
                  <p className="text-[10px] font-black uppercase text-ink-soft mb-1">ICU Beds</p>
                  <p className="text-lg font-black text-ink">{availBeds}/{totalBeds}</p>
               </div>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="flex items-center gap-6 p-10 cursor-pointer hover:bg-black/5 transition-all" onClick={() => router.push('/settings')}>
          <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center text-accent neu">
            <TrendingUp size={32} />
          </div>
          <div>
            <h4 className="text-xl font-bold font-display">System Status</h4>
            <p className="text-ink-soft text-sm">Connected to {activeCity} data cluster: {metrics ? "ONLINE" : "OFFLINE"}</p>
          </div>
        </GlassCard>
      </div>

      {/* Advanced AI Triage & Infrastructure Map */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Sector -> Hospital Mapping (Infrastructure Map) */}
        <div className="xl:col-span-8">
          <GlassCard className="h-full">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-2xl font-bold font-display">City Infrastructure Map</h3>
                  <p className="text-xs text-ink-soft mt-1">Live distribution of medical hubs across {activeCity} sectors.</p>
               </div>
               <div className="bg-black/5 px-4 py-2 rounded-xl border border-black/5">
                  <span className="text-[10px] font-black uppercase text-ink-soft">Active Hubs: {hospitalsData?.length || 0}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {infrastructureMap && Object.entries(infrastructureMap).map(([sector, hospitals]: [string, any]) => (
                <div key={sector} className="p-6 bg-white/30 rounded-3xl border border-black/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-accent flex items-center gap-2">
                       <MapPin size={14} />
                       {sector}
                    </h4>
                    <span className="text-[10px] font-black text-ink-soft uppercase">{hospitals.length} Hubs</span>
                  </div>
                  <div className="space-y-3">
                    {hospitals.map((h: any) => (
                      <div key={h.id} className="flex justify-between items-center p-3 bg-white/50 rounded-xl hover:bg-white transition-colors cursor-pointer group">
                        <div>
                          <p className="text-sm font-bold text-ink">{h.name}</p>
                          <p className="text-[10px] text-ink-soft uppercase font-black tracking-wider">ICU: {h.beds}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-ink-soft">O₂</p>
                              <p className={cn("text-xs font-black", h.oxygen < 50 ? "text-danger" : "text-safe")}>{h.oxygen}%</p>
                           </div>
                           <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", h.status === 'Stable' ? "bg-safe" : "bg-danger")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* AI Triage Recommender */}
        <div className="xl:col-span-4">
          <GlassCard className="h-full border-2 border-accent/20 bg-accent/[0.02]">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                   <Activity size={20} />
                </div>
                <div>
                   <h3 className="text-xl font-bold font-display">AI Triage Agent</h3>
                   <p className="text-[10px] font-black uppercase text-accent/60 tracking-widest leading-none mt-1">Optimization Engine</p>
                </div>
             </div>

             <div className="space-y-6">
                {recommendations && recommendations.map((reco: any, i: number) => (
                   <div key={i} className={cn(
                     "p-6 rounded-3xl border space-y-3 relative overflow-hidden",
                     reco.priority === 'High' ? "bg-danger/5 border-danger/20" : "bg-white/40 border-black/5"
                   )}>
                      <div className="flex justify-between items-center">
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                           reco.priority === 'High' ? "bg-danger text-white" : "bg-safe/10 text-safe"
                         )}>{reco.type}</span>
                         <span className="text-[10px] font-bold text-ink-soft uppercase">{reco.sector}</span>
                      </div>
                      <h4 className="font-bold text-ink leading-tight">{reco.reason}</h4>
                      <p className="text-xs text-ink-soft font-medium bg-white/40 p-3 rounded-xl border border-black/5">
                         {reco.action}
                      </p>
                      {reco.priority === 'High' && (
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                           <AlertCircle size={60} />
                        </div>
                      )}
                      <PillButton 
                        onClick={() => {
                          alert(`Emergency Allocation Authorized for ${reco.sector}. Responding units have been dispatched.`);
                          reco.priority = 'Low'; // Simulated state change
                        }}
                        className={cn(
                          "w-full text-xs py-3",
                          reco.priority === 'High' ? "bg-danger hover:bg-red-600" : "bg-accent"
                        )}
                      >
                         Authorize Allocation
                      </PillButton>
                   </div>
                ))}
             </div>
          </GlassCard>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
