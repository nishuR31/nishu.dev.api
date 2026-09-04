import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, FolderGit2, Settings, Briefcase, Award, Image as ImageIcon, Layers, MessageSquare, GraduationCap, Menu, X } from 'lucide-react';
import { AuthProvider, ProtectedRoute } from './lib/AuthContext';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import SettingsView from './views/SettingsView';
import ProjectsView from './views/ProjectsView';
import ExperiencesView from './views/ExperiencesView';
import CertificatesView from './views/CertificatesView';
import MediaView from './views/MediaView';
import ServicesView from './views/ServicesView';
import TestimonialsView from './views/TestimonialsView';
import EducationView from './views/EducationView';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'blue' },
  { to: '/projects', label: 'Projects', icon: FolderGit2, color: 'blue' },
  { to: '/experiences', label: 'Experience', icon: Briefcase, color: 'purple' },
  { to: '/education', label: 'Education', icon: GraduationCap, color: 'emerald' },
  { to: '/certificates', label: 'Certs', icon: Award, color: 'amber' },
  { to: '/services', label: 'Services', icon: Layers, color: 'indigo' },
  { to: '/testimonials', label: 'Reviews', icon: MessageSquare, color: 'pink' },
  { to: '/media', label: 'Media', icon: ImageIcon, color: 'teal' },
  { to: '/settings', label: 'Settings', icon: Settings, color: 'slate' },
];

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crmName, setCrmName] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch portfolio data for dynamic CRM name
  useEffect(() => {
    axios.get('/api/portfolio').then(res => {
      const data = res.data?.data;
      if (data?.developer?.shortName) {
        setCrmName(data.developer.shortName);
      }
    }).catch(() => {});
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Don't show header on login page
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {!isLoginPage && (
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[var(--primary)] flex items-center gap-2 shrink-0">
              <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden xs:inline">{crmName ? `${crmName} CRM` : 'CRM'}</span>
              <span className="xs:hidden">CRM</span>
            </h1>
            <nav className="hidden md:flex gap-4 lg:gap-6 ml-6 lg:ml-8 overflow-x-auto min-w-0 flex-1 scrollbar-hide">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                    location.pathname === link.to
                      ? 'text-[var(--primary)]'
                      : 'hover:text-[var(--primary)]'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-[var(--background)] border border-[var(--border)] transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />}
            </button>
            {/* Mobile hamburger for secondary nav */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-[var(--background)] border border-[var(--border)] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>
      )}

      {/* Mobile slide-down menu */}
      {!isLoginPage && mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="bg-[var(--card)] border-b border-[var(--border)] shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2 p-4">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? `bg-${link.color}-500/15 text-${link.color}-500`
                        : 'text-[var(--foreground)]/60 hover:bg-[var(--background)]'
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="text-[11px] font-semibold">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className={isLoginPage ? "" : "container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl mb-20 md:mb-0"}>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardView /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsView /></ProtectedRoute>} />
          <Route path="/experiences" element={<ProtectedRoute><ExperiencesView /></ProtectedRoute>} />
          <Route path="/education" element={<ProtectedRoute><EducationView /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><CertificatesView /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute><ServicesView /></ProtectedRoute>} />
          <Route path="/testimonials" element={<ProtectedRoute><TestimonialsView /></ProtectedRoute>} />
          <Route path="/media" element={<ProtectedRoute><MediaView /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
        </Routes>
      </main>

      {/* Mobile Bottom Tab Bar – compact with only 5 primary tabs */}
      {!isLoginPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)]/95 backdrop-blur-xl border-t border-[var(--border)] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-around px-1 py-2 pb-safe">
            {[
              { to: '/', label: 'Home', icon: LayoutDashboard, color: 'blue' },
              { to: '/projects', label: 'Projects', icon: FolderGit2, color: 'blue' },
              { to: '/experiences', label: 'Exp', icon: Briefcase, color: 'purple' },
              { to: '/certificates', label: 'Certs', icon: Award, color: 'amber' },
              { to: '/settings', label: 'Settings', icon: Settings, color: 'slate' },
            ].map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 ${
                    isActive
                      ? `text-${link.color}-500`
                      : 'text-slate-500 hover:text-[var(--foreground)]'
                  }`}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-[10px] font-medium leading-none">{link.label}</span>
                  {isActive && (
                    <div className={`w-1 h-1 rounded-full bg-${link.color}-500 mt-0.5`} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/admin/">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
