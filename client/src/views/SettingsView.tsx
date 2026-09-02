import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, ShieldAlert, Globe, Save } from 'lucide-react';

export default function SettingsView() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        setMaintenanceMode(response.data.data.maintenanceMode);
        setSiteName(response.data.data.siteName);
      } catch (error) {
        console.error('Failed to fetch settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings', { maintenanceMode, siteName });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error('Failed to save settings', error);
      alert("Failed to save settings. Please check your developer authorization.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] opacity-60 font-medium tracking-wide">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">System Settings</h2>
        <p className="text-lg text-[var(--foreground)] opacity-60">
          Manage global application parameters and maintenance operations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[200px] mt-8">
        
        {/* Maintenance Mode Card */}
        <div className="p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl transition-colors duration-700 ${maintenanceMode ? 'bg-red-500/20' : 'bg-slate-500/10'}`}></div>
          <div className="flex items-center justify-between">
            <div className={`p-4 rounded-2xl ${maintenanceMode ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'} transition-colors`}>
               <ShieldAlert className="w-8 h-8" />
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 ${
                maintenanceMode ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                  maintenanceMode ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">Maintenance Mode</h3>
            <p className="text-[var(--foreground)] opacity-60 text-sm">
              {maintenanceMode 
                ? "Active: Public API access is currently blocked." 
                : "Inactive: Site is live and accessible to the public."}
            </p>
          </div>
        </div>

        {/* Global Configuration Card */}
        <div className="p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
           <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700"></div>
           <div className="flex items-center gap-4 mb-4">
             <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
                <Globe className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold">Site Configuration</h3>
           </div>
           
           <div className="relative z-10">
             <label className="block text-sm font-semibold opacity-80 mb-2 uppercase tracking-wider">Site Name</label>
             <input 
                type="text" 
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
                placeholder="e.g. nishu.dev"
              />
           </div>
        </div>

      </div>

      <div className="flex justify-end mt-8">
         <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-[var(--foreground)] text-[var(--background)] font-bold rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Saving Changes..." : "Save Configuration"}
          </button>
      </div>

    </div>
  );
}
