import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { DhakaClock } from '../components/common/DhakaClock.js';
import { api } from '../lib/api.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [systemName, setSystemName] = useState('RM File Management & Team Member Data System');
  const [teamName, setTeamName] = useState('Team Member Data Management System');

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await api.getSettings();
        if (s.appName) setSystemName(s.appName);
        if (s.teamName) setTeamName(s.teamName);
      } catch {
        // use default
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both RM Code / Username and password');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background: Bangladeshi Banking Executive & Corporate Banking Team Photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/bangladeshi_banking_team.jpg"
          alt="Bangladeshi Banking Executive and Team"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
          referrerPolicy="no-referrer"
        />
        {/* Soft elegant tint ensuring background is clearly visible while text is crisp */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />
      </div>

      {/* Top Floating Dhaka Clock Badge */}
      <div className="absolute top-4 right-4 z-20 hidden sm:block">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white shadow-lg">
          <DhakaClock showReportingBadge={false} />
        </div>
      </div>

      {/* Simple, Elegant, Frosted Glass Login Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-slate-900/85 backdrop-blur-xl rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/20 text-white transition-all">
        {/* Clean Logo & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30 border border-white/25">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white mb-1">
            {systemName}
          </h1>
          <p className="text-xs text-blue-200/90 font-medium">
            {teamName}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2.5 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              RM Code / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. 104393 or Admin0"
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 text-white placeholder-slate-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 text-white placeholder-slate-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In (লগইন)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
