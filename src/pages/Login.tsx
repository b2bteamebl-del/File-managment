import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, ShieldCheck, ArrowRight, Sparkles, Building2, Users } from 'lucide-react';
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

  // Helper to prefill without displaying password on screen
  const selectQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      
      {/* Top Bar with Clock */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <DhakaClock showReportingBadge={false} />
        <span className="text-[11px] text-blue-300 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          SSL Encrypted
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10">
        {/* Navy Header */}
        <div className="bg-[#0F294A] px-8 py-8 text-white text-center relative border-b border-[#1b3d6b]">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg border border-white/20 mb-3">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {systemName}
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            {teamName}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              RM Code / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. 104393 or Admin0"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Team members log in with their assigned RM Code or Username.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Selection (PASSWORDS ARE NOT SHOWN AS REQUESTED) */}
        <div className="px-8 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Select Account to Fill:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => selectQuickAccount('104393', '104393')}
              className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition shadow-xs"
            >
              <div className="font-bold text-emerald-700">RM 104393</div>
              <div className="text-[10px] text-slate-500">Tanvir Ahmed</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickAccount('105210', '105210')}
              className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition shadow-xs"
            >
              <div className="font-bold text-emerald-700">RM 105210</div>
              <div className="text-[10px] text-slate-500">Nusrat Jahan</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickAccount('Admin0', '#123456A')}
              className="p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition shadow-xs"
            >
              <div className="font-bold text-blue-700">Admin Account</div>
              <div className="text-[10px] text-slate-500">System Admin</div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickAccount('12345', '12345')}
              className="p-2.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-left transition shadow-xs"
            >
              <div className="font-bold text-purple-700">Mentor Account</div>
              <div className="text-[10px] text-slate-500">Team Mentor</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="mt-6 text-center text-xs text-slate-400 max-w-sm">
        Authorized Team Members Only. All activities, uploads, and data exports are logged with IP, location, and audit records.
      </div>
    </div>
  );
};
