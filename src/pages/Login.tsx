import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, ArrowRight, Building2, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      
      {/* Top Bar with Clock */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center px-1 text-slate-400 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="truncate max-w-[220px]">{teamName}</span>
        </div>
        <DhakaClock showReportingBadge={false} />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-center text-white relative">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">
            {systemName}
          </h1>
          <p className="text-xs text-blue-200/80 font-medium">
            {teamName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="font-medium leading-relaxed">{error}</div>
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
      </div>

      {/* Footer disclaimer */}
      <div className="mt-6 text-center text-xs text-slate-400 max-w-sm">
        Authorized Team Members Only. All activities, uploads, and data exports are logged with IP, location, and audit records.
      </div>
    </div>
  );
};
