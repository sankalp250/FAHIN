"use client";

import { useEffect, useRef } from "react";

interface SectorRisk {
  sector: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  top_disease?: string;
}

interface CityHeatmapProps {
  sectors?: SectorRisk[];
  city?: string;
}

// Gurugram sector coordinates (approximate)
const GURUGRAM_SECTORS: SectorRisk[] = [
  { sector:"Sector-45", latitude:28.4082, longitude:77.0734, risk_score:0.84, top_disease:"Dengue"     },
  { sector:"Sector-32", latitude:28.4595, longitude:77.0694, risk_score:0.67, top_disease:"Influenza"  },
  { sector:"Sector-17", latitude:28.4709, longitude:77.0266, risk_score:0.72, top_disease:"Unknown"    },
  { sector:"Sector-21", latitude:28.4674, longitude:77.0366, risk_score:0.51, top_disease:"Malaria"    },
  { sector:"Sector-8",  latitude:28.4756, longitude:77.0116, risk_score:0.38, top_disease:"Dengue"     },
  { sector:"Sector-3",  latitude:28.4900, longitude:77.0150, risk_score:0.29, top_disease:"Typhoid"    },
];

function riskToColor(score: number): string {
  if (score >= 0.8) return "#EF4444";
  if (score >= 0.6) return "#F97316";
  if (score >= 0.4) return "#F59E0B";
  if (score >= 0.2) return "#3B82F6";
  return "#10B981";
}

export default function CityHeatmap({ sectors = GURUGRAM_SECTORS }: CityHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamic import to avoid SSR issues with Leaflet
    const initMap = async () => {
      const L = (await import("leaflet")).default;
      // CSS is imported in layout.tsx globally

      if ((mapRef.current as any)._leaflet_id) return; // already initialised

      const map = L.map(mapRef.current!, {
        center: [28.4595, 77.0266],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        className: "map-tiles",
      }).addTo(map);

      sectors.forEach(s => {
        const color = riskToColor(s.risk_score);
        L.circleMarker([s.latitude, s.longitude], {
          radius: 20 + s.risk_score * 20,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.6,
        })
          .bindPopup(`
            <div style="font-family:DM Sans,sans-serif;padding:4px">
              <strong style="font-size:14px">${s.sector}</strong><br/>
              <span style="color:#64748B">${s.top_disease ?? "—"}</span><br/>
              <strong style="font-size:18px;color:${color}">${Math.round(s.risk_score*100)}%</strong>
              <span style="color:#94A3B8;font-size:11px"> probability</span>
            </div>
          `)
          .addTo(map);
      });
    };

    initMap();
  }, [sectors]);

  return (
    <div className="neu rounded-3xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-display font-semibold text-ink">Live Risk Map — Gurugram</h3>
        <p className="text-xs text-ink-soft mt-0.5">Sector-level outbreak probability overlay</p>
      </div>
      <div ref={mapRef} style={{ height: 380, width: "100%" }} />
      <div className="flex items-center gap-3 px-5 py-3 border-t border-black/5 flex-wrap">
        <span className="text-xs text-ink-soft">Risk level:</span>
        {[["Safe","#10B981"],["Low","#3B82F6"],["Moderate","#F59E0B"],["High","#F97316"],["Critical","#EF4444"]].map(([l,c])=>(
          <span key={l} className="flex items-center gap-1 text-xs text-ink-soft">
            <span className="w-3 h-3 rounded-full" style={{ background: c as string }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}
