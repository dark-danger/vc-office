import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { ArrowRight, Lock, Mail, Sparkles, ArrowLeft, LogIn, ShieldCheck, Building2, User } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@geeta.edu.in');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'head'>('admin');

  const setRolePreset = (role: 'admin' | 'head') => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setEmail('admin@geeta.edu.in');
      setPassword('Admin@12345');
    } else {
      setEmail('head.cse@geeta.edu.in');
      setPassword('GU1001');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      login(data.access_token, data.refresh_token, data.user);

      // 2-Way Auto-redirect based on authenticated user's role
      if (data.user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/head/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[var(--bg-primary)] px-3.5 sm:px-4 py-16 sm:py-12 relative overflow-x-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] h-[450px] bg-gradient-to-tr from-[#0e8a6e]/25 via-emerald-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Back to Home Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-3.5 left-3.5 sm:top-6 sm:left-6 btn-secondary text-xs py-1.5 px-3 sm:py-2 sm:px-4 flex items-center gap-1.5 sm:gap-2 z-20 shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Back to Home</span>
      </button>

      {/* Theme Toggle Button */}
      <div className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md glass-panel p-5 sm:p-8 relative z-10 shadow-2xl border border-[var(--panel-border)] space-y-5 sm:space-y-6 mt-6 sm:mt-0">
        
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--card-bg-to)] border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg mb-1">
            <LogIn className="w-7 h-7 text-emerald-500" />
          </div>
          <span className="inline-block px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            Geeta University VC Office Portal
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight font-display">
            Executive Governance Login
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Sign in as VC Office Executive or Department Head (HOD)
          </p>
        </div>

        {/* 2 Role Preset Selectors */}
        <div className="grid grid-cols-2 gap-2.5 p-1 rounded-xl bg-black/20 border border-[var(--panel-border)]">
          <button
            type="button"
            onClick={() => setRolePreset('admin')}
            className={`py-2 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'admin'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>VC Office</span>
          </button>
          <button
            type="button"
            onClick={() => setRolePreset('head')}
            className={`py-2 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'head'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dept Head</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">University Email / ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@geeta.edu.in"
                className="glass-input pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input pl-9 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center py-2.5 mt-2 text-sm font-bold"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-4 border-t border-[var(--panel-border)] text-center space-y-1">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Geeta University — Office of the Vice Chancellor
          </div>
        </div>
      </div>
    </div>
  );
};
