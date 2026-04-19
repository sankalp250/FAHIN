"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Sector {
  id: string;
  name: string;
  anomalyScore: number;
  caseDensity: number;
  riskLevel: 'safe' | 'warning' | 'critical';
}

interface HeatmapProps {
  data: Sector[];
  city?: string;
}

const Heatmap: React.FC<HeatmapProps> = ({ data, city = "Kolkata" }) => {
  const router = useRouter();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  return (
    <div className="w-full h-[500px] neu bg-surface/30 rounded-[40px] p-8 glass relative overflow-hidden">
      <div className="absolute top-8 left-8">
        <h3 className="text-xl font-bold font-display">Unified Risk Heatmap</h3>
        <p className="text-sm text-ink-soft">Live Sector Analysis: {city}</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-20 h-[320px]">
        {data.map((sector) => (
          <div 
            key={sector.id}
            onClick={() => setSelectedSector(sector)}
            className={cn(
              "relative rounded-3xl transition-all duration-500 cursor-pointer group flex flex-col items-center justify-center border-2",
              sector.riskLevel === 'safe' && "bg-safe/5 border-safe/20 hover:bg-safe/10",
              sector.riskLevel === 'warning' && "bg-warn/5 border-warn/20 hover:bg-warn/10",
              sector.riskLevel === 'critical' && "bg-danger/5 border-danger/20 hover:bg-danger/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-2 font-bold text-lg transition-transform group-hover:scale-110",
              sector.riskLevel === 'safe' && "bg-safe text-white",
              sector.riskLevel === 'warning' && "bg-warn text-white",
              sector.riskLevel === 'critical' && "bg-danger text-white animate-pulse"
            )}>
              {sector.id}
            </div>
            <span className="font-bold text-sm tracking-wide">{sector.name}</span>
            <div className="absolute bottom-4 flex gap-4 text-[10px] font-bold text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity">
              <span>ANOMALY: {sector.anomalyScore}%</span>
              <span>CASES: {sector.caseDensity}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-8 right-8 flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-safe" />
          <span className="text-xs font-bold text-ink-soft">Safe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warn" />
          <span className="text-xs font-bold text-ink-soft">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger" />
          <span className="text-xs font-bold text-ink-soft">Critical</span>
        </div>
      </div>

      {/* Sector Detail Modal */}
      {selectedSector && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center p-8 transition-all">
          <div className="w-full max-w-sm bg-white rounded-3xl neu p-6 relative">
            <button 
              onClick={() => setSelectedSector(null)}
              className="absolute top-4 right-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition"
            >
              <X size={16} />
            </button>
            <h4 className="text-xl font-display font-black text-ink mb-1">{selectedSector.name}</h4>
            <p className="text-xs font-bold uppercase text-ink-soft mb-6">Status: <span className={cn(selectedSector.riskLevel === "critical" ? "text-danger" : selectedSector.riskLevel === "warning" ? "text-warn" : "text-safe")}>{selectedSector.riskLevel}</span></p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-sm font-bold text-ink-soft">Anomaly Score</span>
                <span className="text-lg font-black">{selectedSector.anomalyScore}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-sm font-bold text-ink-soft">Total Cases (7d)</span>
                <span className="text-lg font-black">{selectedSector.caseDensity}</span>
              </div>
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-sm font-bold text-ink-soft">Trend</span>
                <span className="text-sm font-black text-danger">+14% vs Last Week</span>
              </div>
            </div>
            <button 
              onClick={() => router.push(`/records?sector=${selectedSector.name}`)}
              className="w-full mt-6 bg-accent text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-accent/30 hover:opacity-90 active:scale-95 transition-all"
            >
              Investigate Sector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
