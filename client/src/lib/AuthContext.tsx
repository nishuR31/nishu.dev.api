import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if token exists in localStorage (since we can't easily read httpOnly cookies)
    // Actually, because it's httpOnly, we should just attempt a protected request
    // or rely on a "logged_in" flag in localStorage.
    const loggedIn = localStorage.getItem('crm_logged_in');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
      setUser(JSON.parse(localStorage.getItem('crm_user') || '{}'));
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('crm_logged_in', 'true');
    localStorage.setItem('crm_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {}
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('crm_logged_in');
    localStorage.removeItem('crm_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// We need Navigate from react-router-dom, let's add it manually in the code above or just here:
import { Navigate } from 'react-router-dom';
