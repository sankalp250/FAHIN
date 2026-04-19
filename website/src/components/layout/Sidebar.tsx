"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Database, 
  AlertTriangle, 
  Settings, 
  LogOut,
  ShieldAlert
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Health Records', icon: Database, href: '/records' },
    { label: 'Outbreak Alerts', icon: AlertTriangle, href: '/alerts' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 p-6 flex flex-col z-50">
      <div className="flex items-center gap-3 mb-10 px-4">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/40">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight">FAHIN</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-white/80 glass text-accent neu" 
                  : "text-ink-soft hover:bg-white/40 hover:text-ink"
              )}
            >
              <Icon size={20} />
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="neu bg-surface/50 rounded-2xl p-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 neu" />
            <div>
              <p className="text-sm font-bold">Admin User</p>
              <p className="text-[10px] text-ink-soft">City Coordinator</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (confirm("Are you sure you want to sign out?")) {
              localStorage.clear();
              window.location.href = '/';
            }
          }}
          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-ink-soft hover:text-danger hover:bg-danger/5 transition-all w-full"
        >
          <LogOut size={20} />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
