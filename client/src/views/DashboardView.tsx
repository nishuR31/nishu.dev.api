import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, FolderGit2, Award, Briefcase, ChevronRight } from 'lucide-react';

export default function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/portfolio');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch portfolio data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">Welcome, {data?.developer?.shortName || "Developer"}</h2>
        <p className="text-lg text-[var(--foreground)] opacity-60">
          Here's an overview of your portfolio data and quick actions.
        </p>
      </header>

      {data ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[160px]">
          
          {/* Main Stat Card - Spans 2 cols, 2 rows */}
          <div className="md:col-span-2 md:row-span-2 p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[var(--primary)] opacity-10 rounded-full blur-3xl group-hover:bg-[var(--primary)] transition-all duration-700"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Profile Details</h3>
                <Activity className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <p className="text-[var(--foreground)] opacity-80 text-lg mb-2">{data.developer.role}</p>
              <p className="text-[var(--foreground)] opacity-60 mb-6">{data.developer.tagline}</p>
            </div>
            <div className="bg-[var(--background)] p-4 rounded-2xl border border-[var(--border)] group-hover:border-[var(--primary)]/30 transition-colors">
              <code className="text-sm opacity-80 font-mono truncate block">
                {data.developer.email} • {data.developer.location}
              </code>
            </div>
          </div>

          {/* Bento Card 1: Projects */}
          <div className="p-6 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[var(--foreground)] opacity-60 text-sm font-medium uppercase tracking-wider mb-1">Projects</p>
              <div className="flex items-end justify-between">
                <h4 className="text-4xl font-bold">{data.projects?.length || 0}</h4>
                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>

          {/* Bento Card 2: Certificates */}
          <div className="p-6 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[var(--foreground)] opacity-60 text-sm font-medium uppercase tracking-wider mb-1">Certificates</p>
              <div className="flex items-end justify-between">
                <h4 className="text-4xl font-bold">{data.certificates?.length || 0}</h4>
                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>

          {/* Bento Card 3: Experience */}
          <div className="md:col-span-2 p-6 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:scale-[1.01] transition-transform duration-300 flex items-center justify-between group">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform shrink-0">
                  <Briefcase className="w-8 h-8" />
               </div>
               <div>
                 <p className="text-[var(--foreground)] opacity-60 text-sm font-medium uppercase tracking-wider mb-1">Experience Tracks</p>
                 <h4 className="text-3xl font-bold">{data.experiences?.length || 0} Roles</h4>
               </div>
            </div>
             <ChevronRight className="w-6 h-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
          </div>

        </div>
      ) : (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex flex-col items-center justify-center min-h-[200px]">
          <Activity className="w-12 h-12 mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Error loading data</h3>
          <p className="opacity-80">Make sure the database is seeded and the backend is running.</p>
        </div>
      )}
    </div>
  );
}
