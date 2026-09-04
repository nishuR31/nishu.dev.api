import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, FolderGit2, Award, Briefcase, ChevronRight, Database, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch portfolio data', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await axios.post('/api/portfolio/seed');
      if (res.data.success) {
        showToast("Database seeded successfully!", 'success');
        await fetchData();
      }
    } catch (error: any) {
      console.error('Failed to seed database', error);
      showToast(error.response?.data?.message || "Failed to seed database.", 'error');
    } finally {
      setSeeding(false);
    }
  };

  const toggleVisibility = async (field: string, currentValue: boolean) => {
    if (!data || updatingVisibility) return;
    setUpdatingVisibility(true);
    
    const payload = {
      name: data.developer.name,
      shortName: data.developer.shortName,
      role: data.developer.role,
      tagline: data.developer.tagline,
      bio: data.developer.bio,
      location: data.developer.location,
      email: data.developer.email,
      about: data.developer.about,
      recentTracks: data.recentTracks ?? true,
      keywords: data.keywords ?? "portfolio,developer",
      showAbout: data.showAbout ?? true,
      showSkills: data.showSkills ?? true,
      showExperience: data.showExperience ?? true,
      showProjects: data.showProjects ?? true,
      showEducation: data.showEducation ?? true,
      showCertificates: data.showCertificates ?? true,
      showServices: data.showServices ?? true,
      showTestimonials: data.showTestimonials ?? true,
      [field]: !currentValue
    };

    try {
      await axios.post('/api/portfolio/profile', payload);
      setData((prev: any) => ({ ...prev, [field]: !currentValue }));
      showToast("Visibility updated", 'success');
    } catch (error) {
      console.error('Failed to update visibility', error);
      showToast("Failed to update visibility", 'error');
    } finally {
      setUpdatingVisibility(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] opacity-60 font-medium tracking-wide">Loading CRM Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-20 md:pb-0">
      <header className="space-y-1 sm:space-y-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Welcome, {data?.developer?.shortName || "Developer"}</h2>
        <p className="text-sm sm:text-base md:text-lg text-[var(--foreground)] opacity-60">
          Here's an overview of your portfolio data and quick actions.
        </p>
      </header>

      {data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 md:auto-rows-min">
          
          {/* Main Stat Card - Spans 2 cols, 2 rows */}
          <div className="col-span-2 md:col-span-2 md:row-span-2 p-4 sm:p-6 md:p-8 bg-[var(--card)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[var(--primary)] opacity-10 rounded-full blur-3xl group-hover:bg-[var(--primary)] transition-all duration-700"></div>
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Profile Details</h3>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--primary)]" />
              </div>
              <p className="text-[var(--foreground)] opacity-80 text-sm sm:text-base md:text-lg mb-1 sm:mb-2 line-clamp-2">{data.developer.role}</p>
              <p className="text-[var(--foreground)] opacity-60 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2">{data.developer.tagline}</p>
            </div>
            <div className="bg-[var(--background)] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[var(--border)] group-hover:border-[var(--primary)]/30 transition-colors">
              <code className="text-xs sm:text-sm opacity-80 font-mono truncate block">
                {data.developer.email}
              </code>
              <code className="text-xs opacity-60 font-mono truncate block mt-0.5 sm:hidden">
                {data.developer.location}
              </code>
              <code className="text-sm opacity-80 font-mono truncate hidden sm:block mt-0.5">
                {data.developer.location}
              </code>
            </div>
          </div>

          {/* Bento Card 1: Projects */}
          <Link to="/projects" className="block p-4 sm:p-6 bg-[var(--card)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-500 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <FolderGit2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[var(--foreground)] opacity-60 text-xs sm:text-sm font-medium uppercase tracking-wider mb-0.5 sm:mb-1">Projects</p>
              <div className="flex items-end justify-between">
                <h4 className="text-2xl sm:text-3xl md:text-4xl font-bold">{data.projects?.length || 0}</h4>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
              </div>
            </div>
          </Link>

          {/* Bento Card 2: Certificates */}
          <Link to="/certificates" className="block p-4 sm:p-6 bg-[var(--card)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:scale-[1.02] hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-500 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[var(--foreground)] opacity-60 text-xs sm:text-sm font-medium uppercase tracking-wider mb-0.5 sm:mb-1">Certs</p>
              <div className="flex items-end justify-between">
                <h4 className="text-2xl sm:text-3xl md:text-4xl font-bold">{data.certificates?.length || 0}</h4>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
              </div>
            </div>
          </Link>

          {/* Bento Card 3: Experience */}
          <Link to="/experiences" className="block col-span-2 md:col-span-2 p-4 sm:p-6 bg-[var(--card)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-300 flex items-center justify-between group">
            <div className="flex items-center gap-3 sm:gap-6">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform shrink-0">
                  <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
               </div>
               <div>
                 <p className="text-[var(--foreground)] opacity-60 text-xs sm:text-sm font-medium uppercase tracking-wider mb-0.5 sm:mb-1">Experience</p>
                 <h4 className="text-xl sm:text-2xl md:text-3xl font-bold">{data.experiences?.length || 0} Roles</h4>
               </div>
            </div>
             <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 group-hover:text-purple-500 transition-all" />
          </Link>

          {/* Section Visibility Card */}
          <div className="col-span-2 md:col-span-4 p-4 sm:p-6 md:p-8 lg:p-10 bg-[var(--card)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-[0_4px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-4 sm:mb-6 md:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="p-2 sm:p-3 bg-emerald-500/10 text-emerald-500 rounded-xl sm:rounded-2xl">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">Visibility Control</h3>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-[var(--foreground)] opacity-60 ml-1 sm:ml-2">Toggle sections on your live portfolio.</p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-5">
              {[
                { id: 'showAbout', label: 'About', icon: '👤' },
                { id: 'showServices', label: 'Services', icon: '⚡' },
                { id: 'showExperience', label: 'Experience', icon: '💼' },
                { id: 'showEducation', label: 'Education', icon: '🎓' },
                { id: 'showProjects', label: 'Projects', icon: '🚀' },
                { id: 'showSkills', label: 'Skills', icon: '🎯' },
                { id: 'showCertificates', label: 'Certs', icon: '🏆' },
                { id: 'showTestimonials', label: 'Reviews', icon: '⭐' },
              ].map((section) => {
                const isVisible = data[section.id] ?? true;
                return (
                  <div key={section.id} className={`flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 ${isVisible ? 'bg-[var(--background)] border-emerald-500/20 shadow-[0_4px_12px_rgba(16,185,129,0.05)]' : 'bg-[var(--background)] border-[var(--border)] opacity-60 hover:opacity-100'}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                      <span className="text-base sm:text-lg md:text-xl shrink-0">{section.icon}</span>
                      <span className={`font-semibold text-xs sm:text-sm truncate ${isVisible ? 'text-emerald-500' : 'text-[var(--foreground)]'}`}>{section.label}</span>
                    </div>
                    <button
                      type="button"
                      disabled={updatingVisibility}
                      onClick={() => toggleVisibility(section.id, isVisible)}
                      className={`relative inline-flex h-6 w-10 sm:h-7 sm:w-12 items-center rounded-full transition-colors duration-300 shadow-inner disabled:opacity-50 shrink-0 ml-1 ${
                        isVisible ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                          isVisible ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700"></div>
          
          <div className="relative z-10 p-6 bg-blue-500/10 text-blue-500 rounded-3xl mb-6">
             <Database className="w-12 h-12" />
          </div>
          
          <h3 className="text-3xl font-bold mb-3 relative z-10">Workspace Not Initialized</h3>
          <p className="opacity-60 max-w-md mx-auto mb-8 relative z-10 text-lg">
            Your portfolio database is currently empty. Initialize your workspace to automatically import data from your static config.
          </p>
          
          <button 
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="relative z-10 px-8 py-4 bg-[var(--foreground)] text-[var(--background)] font-bold rounded-2xl hover:scale-105 transition-transform flex items-center gap-2 shadow-xl disabled:opacity-50 disabled:hover:scale-100"
          >
             {seeding ? (
                <>
                  <div className="w-5 h-5 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                  Seeding Database...
                </>
             ) : (
                <>
                  <Database className="w-5 h-5" />
                  Initialize Workspace
                </>
             )}
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} backdrop-blur-xl`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
