import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, ShieldAlert, Globe, Save, KeyRound, Fingerprint, ShieldCheck, QrCode } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { startRegistration } from '@simplewebauthn/browser';

export default function SettingsView() {
  const [loading, setLoading] = useState(true);

  // Forms
  const { register: regSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings, control: controlSettings, watch: watchSettings, formState: { isSubmitting: savingSettings } } = useForm({
    defaultValues: { maintenanceMode: false, siteName: "" }
  });
  
  const { register: regPassword, handleSubmit: handlePasswordSubmit, formState: { isSubmitting: savingPassword } } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  const maintenanceMode = watchSettings("maintenanceMode");

  // Security States
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [isGeneratingTotp, setIsGeneratingTotp] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        resetSettings({
          maintenanceMode: response.data.data.maintenanceMode,
          siteName: response.data.data.siteName
        });
      } catch (error) {
        console.error('Failed to fetch settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [resetSettings]);

  const onSettingsSave = async (data: any) => {
    try {
      await axios.post('/api/settings', data);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error('Failed to save settings', error);
      alert("Failed to save settings. Please check your developer authorization.");
    }
  };

  const onPasswordSave = async (data: any) => {
    alert("Backend logic pending for: " + JSON.stringify(data));
  };

  
  const handleAddPasskey = async () => {
    try {
      // 1. Get options from server
      const optRes = await axios.post('/api/auth/passkey/generate-options');
      const options = optRes.data.data;
      
      // 2. Pass options to browser authenticator
      const attResp = await startRegistration(options);
      
      // 3. Send response to server to verify
      await axios.post('/api/auth/passkey/verify-registration', attResp);
      alert("Passkey successfully registered!");
    } catch (err: any) {
      console.error("Passkey registration failed", err);
      if (err.name === 'NotAllowedError') {
        alert('Passkey registration was cancelled or timed out.');
      } else {
        alert('Failed to register passkey: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEnable2FA = async () => {
    if (totpEnabled) {
      // In a real app, you would have a disable endpoint. For now, just hide the UI.
      setTotpEnabled(false);
      setQrCodeUrl("");
      return;
    }
    
    setIsGeneratingTotp(true);
    try {
      const res = await axios.post('/api/auth/2fa/setup');
      if (res.data.success) {
        setQrCodeUrl(res.data.data.qrCodeUrl);
        setTotpSecret(res.data.data.secret);
        setTotpEnabled(true);
      }
    } catch (error) {
      console.error("Failed to setup 2FA", error);
      alert("Failed to initialize 2FA setup.");
    } finally {
      setIsGeneratingTotp(false);
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
    <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-700 pb-20 md:pb-0">
      
      {/* Header */}
      <header className="space-y-1 sm:space-y-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">System Settings</h2>
        <p className="text-sm sm:text-base md:text-lg text-[var(--foreground)] opacity-60">
          Manage global application parameters and maintenance operations.
        </p>
      </header>

      {/* General Settings */}
      <form onSubmit={handleSettingsSubmit(onSettingsSave)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[200px]">
          
          {/* Maintenance Mode Card */}
          <div className="p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl transition-colors duration-700 ${maintenanceMode ? 'bg-red-500/20' : 'bg-slate-500/10'}`}></div>
            <div className="flex items-center justify-between relative z-10">
              <div className={`p-4 rounded-2xl ${maintenanceMode ? 'bg-red-500/10 text-red-500' : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/60'} transition-colors`}>
                 <ShieldAlert className="w-8 h-8" />
              </div>
              <Controller
                name="maintenanceMode"
                control={controlSettings}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 ${
                      field.value ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                        field.value ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              />
            </div>
            <div className="relative z-10">
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
             <div className="flex items-center gap-4 mb-4 relative z-10">
               <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
                  <Globe className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold">Site Configuration</h3>
             </div>
             
             <div className="relative z-10">
               <label className="block text-sm font-semibold opacity-80 mb-2 uppercase tracking-wider">Site Name</label>
               <input 
                  type="text" 
                  {...regSettings("siteName")}
                  className="w-full bg-[var(--background)] border border-[var(--border)] p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
                  placeholder="e.g. nishu.dev"
                />
             </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
           <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 px-8 py-3 bg-[var(--foreground)] text-[var(--background)] font-bold rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
            >
              {savingSettings ? (
                <div className="w-5 h-5 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {savingSettings ? "Saving Changes..." : "Save Configuration"}
            </button>
        </div>
      </form>

      <hr className="border-[var(--border)] opacity-50" />

      {/* Security & Authentication Section */}
      <section className="space-y-4 sm:space-y-6">
        <header>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Security & Profile</h2>
          <p className="text-sm sm:text-base md:text-lg text-[var(--foreground)] opacity-60">
            Manage your credentials, 2FA, and Passkeys.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Change Password */}
          <div className="p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
                  <KeyRound className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold">Change Password</h3>
            </div>
            
            <form className="space-y-4 relative z-10" onSubmit={handlePasswordSubmit(onPasswordSave)}>
              <div>
                <label className="block text-sm font-medium opacity-80 mb-1.5 ml-1">Current Password</label>
                <input 
                  type="password" 
                  {...regPassword("currentPassword")}
                  className="w-full bg-[var(--background)] border border-[var(--border)] px-4 py-3 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium opacity-80 mb-1.5 ml-1">New Password</label>
                  <input 
                    type="password" 
                    {...regPassword("newPassword")}
                    className="w-full bg-[var(--background)] border border-[var(--border)] px-4 py-3 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-80 mb-1.5 ml-1">Confirm New</label>
                  <input 
                    type="password" 
                    {...regPassword("confirmPassword")}
                    className="w-full bg-[var(--background)] border border-[var(--border)] px-4 py-3 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full mt-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            {/* TOTP Section */}
            <div className="p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${totpEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'} transition-colors`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Two-Factor Auth</h3>
                    <p className="text-sm opacity-60">Use an authenticator app</p>
                  </div>
                </div>
                <button
                  onClick={handleEnable2FA}
                  disabled={isGeneratingTotp}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 ${
                    totpEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                      totpEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {qrCodeUrl && (
                <div className="mt-6 p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col items-center text-center animate-in slide-in-from-top-4 duration-500">
                  <div className="p-3 bg-white rounded-xl shadow-sm mb-4">
                    <img src={qrCodeUrl} alt="TOTP QR Code" className="w-40 h-40" />
                  </div>
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400">Scan this QR Code</h4>
                  <p className="text-sm opacity-80 mt-1 max-w-[250px]">
                    Scan this code with Google Authenticator or Authy to complete setup.
                  </p>
                  <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg w-full">
                     <p className="text-xs uppercase tracking-wider font-semibold opacity-50 mb-1">Manual Secret</p>
                     <code className="text-sm tracking-widest font-mono text-emerald-600 dark:text-emerald-400 select-all">{totpSecret}</code>
                  </div>
                </div>
              )}
            </div>

            {/* Passkey Section */}
            <div className="p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-500">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Passkeys</h3>
                    <p className="text-sm opacity-60">Biometric & hardware auth</p>
                  </div>
               </div>
               
               <div className="flex items-center justify-between p-4 border border-[var(--border)] bg-[var(--background)] rounded-2xl">
                 <div className="flex flex-col">
                   <span className="font-semibold text-sm">No passkeys added</span>
                   <span className="text-xs opacity-60">You can add up to 5 devices.</span>
                 </div>
                 <button 
                   onClick={handleAddPasskey}
                   className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] font-medium text-sm rounded-xl hover:scale-105 transition-transform shadow-md"
                 >
                   Add Passkey
                 </button>
               </div>
            </div>

          </div>
        </div>
      </section>
      
    </div>
  );
}
