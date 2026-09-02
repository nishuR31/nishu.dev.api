import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, KeyRound, ArrowRight, ShieldCheck, Fingerprint, Sparkles, UserPlus, Link, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../lib/AuthContext';

export default function LoginView() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [token2FA, setToken2FA] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const from = location.state?.from?.pathname || '/';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginMode) {
        const response = await axios.post('/api/auth/login', {
          email,
          password,
          ...(needs2FA ? { token2FA } : {})
        });

        if (response.data.success) {
          login(response.data.data.token, { email });
          navigate(from, { replace: true });
        }
      } else {
        const response = await axios.post('/api/auth/register', {
          email,
          password,
        });

        if (response.data.success) {
          setIsLoginMode(true);
          setError("Registration successful! Please log in.");
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Authentication failed';
      if (errMsg === '2FA token required.') {
        setNeeds2FA(true);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      <path fill="none" d="M1 1h22v22H1z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans antialiased text-zinc-100">
      <div className="w-full max-w-sm">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-5 shadow-sm">
            <Fingerprint className="w-6 h-6 text-zinc-300" />
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {isLoginMode ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-sm text-zinc-500 mt-2 text-center px-4">
            {isLoginMode ? 'Enter your details to sign in to your workspace' : 'Enter your details to set up your developer workspace'}
          </p>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className={`mb-6 p-3 rounded-lg flex items-center gap-3 border text-sm ${error.includes('successful') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
            <Lock className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {!isLoginMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required={!isLoginMode}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all shadow-sm"
                placeholder="developer@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              {isLoginMode && (
                <button type="button" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors pointer-events-none">
                <KeyRound className="w-full h-full" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-11 pr-11 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {needs2FA && isLoginMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> 2FA Code
              </label>
              <input
                type="text"
                required
                value={token2FA}
                onChange={(e) => setToken2FA(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-center tracking-[0.2em] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all shadow-sm"
                placeholder="000000"
                maxLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-white hover:bg-zinc-200 text-zinc-900 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Processing...' : (
              <>{isLoginMode ? 'Sign In' : 'Create Account'}</>
            )}
          </button>
        </form>

        {/* Alternative Auth Methods */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-zinc-950 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-sm"
              >
                <GoogleIcon />
                <span className="text-sm font-medium text-zinc-300">Google</span>
              </button>
              <button 
                type="button"
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-sm"
              >
                <Fingerprint className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Passkey</span>
              </button>
            </div>
            
            {isLoginMode && (
              <button 
                type="button"
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-sm"
              >
                <Link className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Send a Magic Link</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
                setNeeds2FA(false);
              }}
              className="text-zinc-300 font-medium hover:text-white transition-colors"
            >
              {isLoginMode ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
