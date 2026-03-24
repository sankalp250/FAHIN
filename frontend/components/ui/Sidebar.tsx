"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Activity, AlertTriangle, Pill, Building2,
  Brain, Shield, Settings, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { href: "/symptoms",  icon: Activity,        label: "Symptoms",  badge: "Live" },
  { href: "/alerts",    icon: AlertTriangle,   label: "Alerts",    badge: "3" },
  { href: "/pharmacy",  icon: Pill,            label: "Pharmacy",  badge: null },
  { href: "/admin",     icon: Building2,       label: "Hospitals", badge: null },
];

const AGENT_STATES = [
  { name: "Privacy Guardian", color: "#10B981" },
  { name: "Symptom Intel",    color: "#10B981" },
  { name: "City Risk",        color: "#10B981" },
  { name: "Medical KB",       color: "#10B981" },
  { name: "Predictor",        color: "#F59E0B" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col"
      style={{
        background: "rgba(238,240,245,0.85)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.05)",
      }}
    >
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-display font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)" }}
          >
            F
          </div>
          <div>
            <div className="font-display font-bold text-ink text-lg leading-none">FAHIN</div>
            <div className="text-xs text-ink-soft leading-tight mt-0.5">Health Intelligence</div>
          </div>
        </div>
        <div className="mt-4 glass rounded-2xl px-3 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse flex-shrink-0" />
          <span className="text-xs text-ink-soft font-medium">Gurugram · All agents online</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <div className="text-[10px] font-semibold tracking-widest text-ink-soft/60 uppercase px-3 mb-2">
          Navigation
        </div>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link href={href}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group cursor-pointer"
                    style={active ? {
                      background: "linear-gradient(135deg, #F59E0B18, #F9731618)",
                      boxShadow: "3px 3px 7px #d1d4dc, -3px -3px 7px #ffffff",
                    } : {}}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                      style={active
                        ? { background: "linear-gradient(135deg, #F59E0B, #F97316)", boxShadow: "0 4px 12px rgba(245,158,11,0.35)" }
                        : { background: "rgba(148,163,184,0.12)" }
                      }
                    >
                      <Icon size={15} color={active ? "#fff" : "#64748B"} />
                    </div>
                    <span className={`text-sm font-medium flex-1 ${active ? "text-ink" : "text-ink-soft"}`}>
                      {label}
                    </span>
                    {badge && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={badge === "Live"
                          ? { background: "#10B98120", color: "#10B981" }
                          : { background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "#fff" }
                        }
                      >
                        {badge}
                      </span>
                    )}
                    {active && <ChevronRight size={12} color="#F59E0B" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Agent status mini panel */}
        <div className="mt-6">
          <div className="text-[10px] font-semibold tracking-widest text-ink-soft/60 uppercase px-3 mb-2">
            Agent Pipeline
          </div>
          <div
            className="glass rounded-2xl p-3 space-y-2"
            style={{ boxShadow: "inset 2px 2px 5px #d1d4dc, inset -2px -2px 5px #ffffff" }}
          >
            {AGENT_STATES.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: agent.color, boxShadow: `0 0 6px ${agent.color}80` }}
                  />
                  <span className="text-xs text-ink-soft">{agent.name}</span>
                </div>
                <span className="text-[10px] text-safe font-medium">active</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom settings */}
      <div className="p-4">
        <div className="glass rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-ink/8 flex items-center justify-center">
            <Shield size={15} color="#64748B" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-ink truncate">Privacy Mode</div>
            <div className="text-[10px] text-safe">DP enabled · ε=1.0</div>
          </div>
          <div className="w-8 h-4 rounded-full bg-safe relative">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </aside>
  );
}
