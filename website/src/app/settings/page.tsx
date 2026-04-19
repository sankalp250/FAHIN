"use client";

import React, { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import PillButton from '@/components/ui/PillButton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Database, 
  Globe, 
  Bell,
  Cpu,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  Hospital as HospitalIcon,
  Activity
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'sectors', label: 'City Sectors', icon: MapPin },
  { id: 'hospitals', label: 'Hospital Registry', icon: HospitalIcon },
  { id: 'security', label: 'Security & Access', icon: Shield },
  { id: 'database', label: 'Database & Storage', icon: Database },
  { id: 'outbreak', label: 'Outbreak Thresholds', icon: Globe },
  { id: 'notifications', label: 'Notification Sync', icon: Bell },
  { id: 'registry', label: 'AI Model Registry', icon: Cpu },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Config States
  const [config, setConfig] = useState<any>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  
  const [newSectorName, setNewSectorName] = useState('');
  const [newHospital, setNewHospital] = useState({ name: '', sector: '', icu_beds_total: 50 });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lockdownActive, setLockdownActive] = useState(false);

  // Fetch initial settings, sectors, and hospitals
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, sectorsRes, hospitalsRes] = await Promise.all([
          api.get('/settings/'),
          api.get('/settings/sectors'),
          api.get('/hospitals/')
        ]);
        
        setConfig(configRes.data);
        setSectors(sectorsRes.data);
        setHospitals(hospitalsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch settings/sectors/hospitals:", err);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleAddHospital = async () => {
    if (!newHospital.name || !newHospital.sector) return;
    try {
      const res = await api.post('/hospitals/add', { 
        ...newHospital,
        city: config?.active_city 
      });
      if (res.status === 200) {
        setHospitals([...hospitals, res.data]);
        setNewHospital({ name: '', sector: '', icu_beds_total: 50 });
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteHospital = async (id: string) => {
    try {
      const res = await api.delete(`/hospitals/${id}`);
      if (res.status === 200) {
        setHospitals(hospitals.filter(h => h.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async (updates: any = {}) => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Merge existing config with updates
    const updatedConfig = { ...config, ...updates };

    try {
      const response = await api.post('/settings/update', updatedConfig);
      
      if (response.status === 200) {
        setConfig(updatedConfig);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSector = async () => {
    if (!newSectorName.trim()) return;
    try {
      const res = await api.post('/settings/sectors/add', { 
        name: newSectorName, 
        city: config?.active_city 
      });
      if (res.status === 200) {
        setSectors([...sectors, res.data]);
        setNewSectorName('');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteSector = async (id: number) => {
    try {
      const res = await api.delete(`/settings/sectors/${id}`);
      if (res.status === 200) {
        setSectors(sectors.filter(s => s.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleLockdown = () => {
    if (lockdownActive) {
      setLockdownActive(false);
    } else {
      if (confirm("Are you sure you want to initiate Emergency Protocol? This will halt all broadcast agents.")) {
        setLockdownActive(true);
      }
    }
  };

  const renderProfileSettings = () => (
    <GlassCard>
      <h3 className="text-2xl font-bold font-display flex items-center gap-3 mb-8">
        <User className="text-accent" size={24} />
        Profile & Location
      </h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-ink mb-2">Active City Jurisdiction</label>
          <input 
            type="text" 
            value={config?.active_city || ''}
            onChange={(e) => setConfig({ ...config, active_city: e.target.value })}
            placeholder="e.g. Kolkata, London, New York"
            className="w-full bg-white/50 border border-black/5 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium"
          />
          <p className="text-xs text-ink-soft mt-3 italic">
            Changing the city will update all dashboard metrics and weather intelligence for this region.
          </p>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white/30 rounded-2xl border border-black/5">
          <div>
            <h4 className="font-bold text-ink">Weather Intelligence</h4>
            <p className="text-xs text-ink-soft">Correlate environmental risk with health signals</p>
          </div>
          <div 
            onClick={() => handleSave({ weather_enabled: !config?.weather_enabled })}
            className={cn(
              "w-10 h-5 rounded-full p-1 relative cursor-pointer transition-colors",
              config?.weather_enabled ? "bg-safe" : "bg-ink/10"
            )}
          >
             <div className={cn(
               "absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all",
               config?.weather_enabled ? "right-1" : "left-1"
             )} />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4 items-center">
          {saveSuccess && (
             <span className="text-safe flex items-center gap-1 text-sm font-bold animate-pulse">
                <CheckCircle2 size={16} /> Updated
             </span>
          )}
          <PillButton onClick={() => handleSave()} disabled={isSaving}>
            {isSaving ? "Updating..." : "Update Location"}
          </PillButton>
        </div>
      </div>
    </GlassCard>
  );

  const renderRegistrySettings = () => (
    <GlassCard>
      <h3 className="text-2xl font-bold font-display flex items-center gap-3 mb-8">
        <Cpu className="text-accent" size={24} />
        AI Model Registry
      </h3>
      <div className="space-y-4">
        {[
          { id: 'BERT', name: "Symptom Classifier (BERT)", version: "v4.2" },
          { id: 'LSTM', name: "Trend Predictor (LSTM)", version: "v2.1" },
          { id: 'Gemini', name: "Vision OCR (Gemini)", version: "1.5 Flash" },
          { id: 'GPT', name: "Agent Reasoning (GPT)", version: "v3.0" }
        ].map((model, i) => {
          const isActive = config?.active_models?.[model.id];
          return (
            <div key={i} className="flex items-center justify-between p-4 bg-white/30 rounded-2xl border border-black/5">
              <div>
                <h4 className="font-bold text-ink">{model.name}</h4>
                <p className="text-xs text-ink-soft">Version: {model.version}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                  isActive ? "text-safe bg-safe/10" : "text-ink-soft bg-black/5"
                )}>{isActive ? "Active" : "Disabled"}</span>
                <div 
                  onClick={() => {
                    const newModels = { ...config.active_models, [model.id]: !isActive };
                    handleSave({ active_models: newModels });
                  }}
                  className={cn(
                    "w-10 h-5 rounded-full p-1 relative cursor-pointer transition-colors",
                    isActive ? "bg-safe" : "bg-ink/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all",
                    isActive ? "right-1" : "left-1"
                  )} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );

  const renderHospitalSettings = () => (
    <GlassCard>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold font-display flex items-center gap-3">
          <HospitalIcon className="text-accent" size={24} />
          Hospital Registry
        </h3>
        <span className="bg-safe/10 text-safe text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-safe/20">
          {hospitals.length} Active Hubs
        </span>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-accent/5 rounded-3xl border border-accent/10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-ink-soft ml-2">Hospital Name</label>
            <input 
              type="text" 
              value={newHospital.name}
              onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
              placeholder="e.g. City General"
              className="w-full bg-white/50 border border-black/5 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-ink-soft ml-2">City Sector</label>
            <select 
              value={newHospital.sector}
              onChange={(e) => setNewHospital({ ...newHospital, sector: e.target.value })}
              className="w-full bg-white/50 border border-black/5 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium text-sm appearance-none"
            >
              <option value="">Select Sector...</option>
              {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase text-ink-soft ml-2">ICU Beds</label>
              <input 
                type="number" 
                value={newHospital.icu_beds_total}
                onChange={(e) => setNewHospital({ ...newHospital, icu_beds_total: parseInt(e.target.value) })}
                className="w-full bg-white/50 border border-black/5 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium text-sm"
              />
            </div>
            <PillButton onClick={handleAddHospital} className="h-[46px] px-6">
              Add Hub
            </PillButton>
          </div>
        </div>

        <div className="space-y-3">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="flex items-center justify-between p-5 bg-white/30 rounded-2xl border border-black/5 group hover:bg-white/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <HospitalIcon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-ink">{hospital.name}</h4>
                  <p className="text-[10px] text-ink-soft uppercase font-black tracking-wider flex items-center gap-2">
                    <MapPin size={10} strokeWidth={3} /> {hospital.sector} • {hospital.icu_beds_total} Total Beds
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                  <div className="text-[10px] font-black text-ink-soft uppercase mb-1">Status</div>
                  <div className="flex items-center gap-2">
                     <div className={cn(
                       "w-2 h-2 rounded-full animate-pulse",
                       hospital.oxygen_status > 50 ? "bg-safe" : "bg-danger"
                     )} />
                     <span className="text-xs font-bold text-ink">Resource Syncing</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteHospital(hospital.id)}
                  className="p-2 text-ink-soft hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {hospitals.length === 0 && (
            <div className="text-center py-10 opacity-50 italic text-sm">
              No regions registered in {config?.active_city || 'the cluster'}.
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );

  const renderSectorSettings = () => (
    <GlassCard>
      <h3 className="text-2xl font-bold font-display flex items-center gap-3 mb-8">
        <MapPin className="text-accent" size={24} />
        City Sectors
      </h3>
      <div className="space-y-6">
        <div className="flex gap-3">
          <input 
            type="text" 
            value={newSectorName}
            onChange={(e) => setNewSectorName(e.target.value)}
            placeholder="Add new sector name..."
            className="flex-1 bg-white/50 border border-black/5 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium"
          />
          <PillButton onClick={handleAddSector} className="aspect-square p-0 w-[60px] flex items-center justify-center">
            <Plus size={24} />
          </PillButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map((sector) => (
            <div key={sector.id} className="flex items-center justify-between p-4 bg-white/30 rounded-2xl border border-black/5 group">
              <span className="font-bold text-ink">{sector.name}</span>
              <button 
                onClick={() => handleDeleteSector(sector.id)}
                className="p-2 text-ink-soft hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );

  const renderDatabaseSettings = () => (
    <GlassCard>
      <h3 className="text-2xl font-bold font-display flex items-center gap-3 mb-8">
        <Database className="text-accent" size={24} />
        Database & Storage
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10">
          <p className="text-xs font-bold uppercase text-ink-soft mb-1">Total Reports</p>
          <h4 className="text-3xl font-black text-accent">{sectors.length * 24 + 112}</h4>
        </div>
        <div className="p-6 bg-safe/5 rounded-3xl border border-safe/10">
          <p className="text-xs font-bold uppercase text-ink-soft mb-1">Health Signals</p>
          <h4 className="text-3xl font-black text-safe">98.2%</h4>
        </div>
      </div>
      <div className="space-y-4">
        <PillButton variant="secondary" className="w-full justify-center" onClick={() => alert("Export initiated...")}>Export Database (CSV)</PillButton>
        <PillButton variant="secondary" className="w-full justify-center text-danger hover:bg-danger/5" onClick={() => alert("Cache cleared.")}>Clear Cache</PillButton>
      </div>
    </GlassCard>
  );

  const renderSecuritySettings = () => (
    <GlassCard>
      <h3 className="text-2xl font-bold font-display flex items-center gap-3 mb-8">
        <Shield className="text-accent" size={24} />
        Security & Access
      </h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-ink mb-2">Admin API Endpoint</label>
          <code className="block p-4 bg-black/5 rounded-xl text-xs font-mono break-all">
            https://api.fahin.gov/v3/admin/cluster-{config?.id || 'key-sb289'}
          </code>
        </div>
        <div className="flex items-center justify-between p-4 bg-white/30 rounded-2xl border border-black/5">
          <div>
            <h4 className="font-bold text-ink">Two-Factor Authentication</h4>
            <p className="text-xs text-ink-soft">Required for Emergency Lockdown</p>
          </div>
          <div className="w-10 h-5 bg-ink/10 rounded-full p-1 relative cursor-pointer">
             <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
        <PillButton variant="secondary" className="w-full justify-center text-sm" onClick={() => alert("Security keys rotated.")}>Update Security Keys</PillButton>
      </div>
    </GlassCard>
  );

  const renderNotificationSettings = () => (
    <GlassCard>
      <h3 className="text-2xl font-bold font-display flex items-center gap-3 mb-8">
        <Bell className="text-accent" size={24} />
        Notification Sync
      </h3>
      <div className="space-y-6">
        <div className="space-y-4">
          {[
            { id: 'outbreak_alerts', label: "Outbreak Alerts (High Risk)" },
            { id: 'daily_stats', label: "Daily City Statistics" },
            { id: 'system_health', label: "System Health Pings" },
            { id: 'new_reports', label: "New Report Webhooks" }
          ].map((item, i) => {
            const isEnabled = config?.notifications_sync?.[item.id];
            return (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink-soft">{item.label}</span>
                <div 
                  onClick={() => {
                    const newSync = { ...config.notifications_sync, [item.id]: !isEnabled };
                    handleSave({ notifications_sync: newSync });
                  }}
                  className={cn(
                    "w-10 h-5 rounded-full p-1 relative cursor-pointer transition-colors",
                    isEnabled ? "bg-safe" : "bg-ink/10"
                  )}
                >
                   <div className={cn(
                     "absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all",
                     isEnabled ? "right-1" : "left-1"
                   )} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="pt-4">
          <label className="block text-sm font-bold text-ink mb-2">Webhook URL</label>
          <input 
            type="text" 
            value={config?.webhook_url || ''}
            onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
            onBlur={() => handleSave()}
            className="w-full bg-white/50 border border-black/5 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-accent/20 transition-all font-mono text-xs"
          />
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-4xl font-extrabold font-display tracking-tight text-ink">
          Portal Settings
        </h2>
        <p className="text-ink-soft mt-1 font-medium">
          Manage system configurations, user permissions, and AI model parameters.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation / Categories */}
        <div className="lg:col-span-4 space-y-4">
          {TABS.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all",
                activeTab === item.id 
                  ? "bg-white glass neu text-accent" 
                  : "text-ink-soft hover:bg-white/40"
              )}
            >
              <item.icon size={20} />
              <span className="font-bold">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'registry' && renderRegistrySettings()}
          {activeTab === 'hospitals' && renderHospitalSettings()}
          {activeTab === 'sectors' && renderSectorSettings()}
          {activeTab === 'database' && renderDatabaseSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          
          {activeTab === 'outbreak' && (
            <GlassCard>
              <h3 className="text-2xl font-bold font-display flex items-center gap-3 mb-8">
                <Globe className="text-accent" size={24} />
                Outbreak Thresholds
              </h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-bold text-ink">Anomaly Score Sensitivity</label>
                    <span className="text-sm font-black text-accent">{config?.anomaly_sensitivity || 70}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={config?.anomaly_sensitivity || 70}
                    onChange={(e) => setConfig({ ...config, anomaly_sensitivity: parseInt(e.target.value) })}
                    onMouseUp={() => handleSave()}
                    className="w-full h-3 bg-white/50 rounded-full appearance-none outline-none cursor-pointer slider-thumb-accent"
                    style={{ background: `linear-gradient(to right, var(--accent) ${config?.anomaly_sensitivity || 70}%, rgba(255,255,255,0.5) ${config?.anomaly_sensitivity || 70}%)` }}
                  />
                  <p className="text-xs text-ink-soft mt-3 italic">
                    Higher sensitivity triggers alerts with fewer patterns.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-bold text-ink">Sector Risk Delta Threshold</label>
                    <span className="text-sm font-black text-accent">{config?.risk_delta_threshold || 85}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={config?.risk_delta_threshold || 85}
                    onChange={(e) => setConfig({ ...config, risk_delta_threshold: parseInt(e.target.value) })}
                    onMouseUp={() => handleSave()}
                    className="w-full h-3 bg-white/50 rounded-full appearance-none outline-none cursor-pointer slider-thumb-accent"
                    style={{ background: `linear-gradient(to right, var(--accent) ${config?.risk_delta_threshold || 85}%, rgba(255,255,255,0.5) ${config?.risk_delta_threshold || 85}%)` }}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-4 items-center">
                  {saveSuccess && (
                     <span className="text-safe flex items-center gap-1 text-sm font-bold animate-pulse">
                        <CheckCircle2 size={16} /> Saved
                     </span>
                  )}
                  <PillButton variant="secondary" onClick={() => handleSave({ anomaly_sensitivity: 70, risk_delta_threshold: 85 })}>Restore Defaults</PillButton>
                  <PillButton onClick={() => handleSave()} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </PillButton>
                </div>
              </div>
            </GlassCard>
          )}

          {(!TABS.map(t => t.id).includes(activeTab)) && (
            <GlassCard className="flex items-center justify-center h-64 text-ink-soft text-center p-10">
              <div className="space-y-4">
                <SettingsIcon size={40} className="mx-auto opacity-20" />
                <p className="font-bold">Module Under Maintenance</p>
                <p className="text-sm">The {activeTab} control panel is being synchronized with the cluster.</p>
              </div>
            </GlassCard>
          )}

          <GlassCard className={cn(
            "text-white transition-all duration-500",
            lockdownActive ? "bg-danger animate-pulse shadow-xl shadow-danger/20" : "bg-ink"
          )}>
            <h3 className="text-xl font-bold font-display flex items-center gap-3 mb-4">
              <Shield className={lockdownActive ? "text-white" : "text-safe"} size={20} />
              System Lockdown
            </h3>
            <p className="text-sm mb-6 opacity-80">
              Immediately halt all automated AI broadcasts and agent processing across all sectors.
            </p>
            <PillButton 
              variant="neutral" 
              onClick={handleLockdown}
              className={cn(
                "border-none transition-all",
                lockdownActive ? "bg-white text-danger hover:bg-white/90" : "bg-danger hover:bg-red-600"
              )}
            >
               {lockdownActive ? "DEACTIVATE LOCKDOWN" : "Emergency Protocol"}
            </PillButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

