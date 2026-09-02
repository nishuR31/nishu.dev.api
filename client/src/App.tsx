import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, FolderGit2, Settings, Briefcase, Award, Image as ImageIcon } from 'lucide-react';
import { AuthProvider, ProtectedRoute } from './lib/AuthContext';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import SettingsView from './views/SettingsView';
import ProjectsView from './views/ProjectsView';
import ExperiencesView from './views/ExperiencesView';
import CertificatesView from './views/CertificatesView';
import MediaView from './views/MediaView';

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Don't show header on login page
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {!isLoginPage && (
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[var(--primary)] flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6" />
              Nishu CRM
            </h1>
            <nav className="hidden md:flex gap-6 ml-8 overflow-x-auto">
              <Link to="/" className="text-sm font-semibold hover:text-[var(--primary)] transition-colors flex items-center gap-1 whitespace-nowrap">
                Dashboard
              </Link>
              <Link to="/projects" className="text-sm font-semibold hover:text-[var(--primary)] transition-colors flex items-center gap-1 whitespace-nowrap">
                <FolderGit2 className="w-4 h-4" /> Projects
              </Link>
              <Link to="/experiences" className="text-sm font-semibold hover:text-[var(--primary)] transition-colors flex items-center gap-1 whitespace-nowrap">
                <Briefcase className="w-4 h-4" /> Experiences
              </Link>
              <Link to="/certificates" className="text-sm font-semibold hover:text-[var(--primary)] transition-colors flex items-center gap-1 whitespace-nowrap">
                <Award className="w-4 h-4" /> Certificates
              </Link>
              <Link to="/media" className="text-sm font-semibold hover:text-[var(--primary)] transition-colors flex items-center gap-1 whitespace-nowrap">
                <ImageIcon className="w-4 h-4" /> Media
              </Link>
              <Link to="/settings" className="text-sm font-semibold hover:text-[var(--primary)] transition-colors flex items-center gap-1 whitespace-nowrap">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </nav>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-[var(--background)] border border-[var(--border)] transition-colors shrink-0"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
        </header>
      )}

      <main className={isLoginPage ? "" : "container mx-auto p-6 max-w-7xl"}>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardView /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsView /></ProtectedRoute>} />
          <Route path="/experiences" element={<ProtectedRoute><ExperiencesView /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><CertificatesView /></ProtectedRoute>} />
          <Route path="/media" element={<ProtectedRoute><MediaView /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
        </Routes>
      </main>
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
