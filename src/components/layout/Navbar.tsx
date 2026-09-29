import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCircle, 
  Key, 
  LogOut, 
  RefreshCw, 
  Sheet, 
  Menu, 
  X,
  ShieldAlert,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { DhakaClock } from '../common/DhakaClock.js';
import { ChangePasswordModal } from '../common/ChangePasswordModal.js';
import { api } from '../../lib/api.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [appName, setAppName] = useState('RM File Management & Performance');
  const [teamName, setTeamName] = useState('Team Member Data Management');

  useEffect(() => {
    async function fetchAppData() {
      try {
        const settings = await api.getSettings();
        if (settings.appName) setAppName(settings.appName);
        if (settings.teamName) setTeamName(settings.teamName);

        if (user?.role !== 'RM') {
          const res = await api.getSyncStatus();
          setSyncStatus(res);
        }
      } catch {
        // ignore
      }
    }
    fetchAppData();
    const interval = setInterval(fetchAppData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleQuickSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await api.triggerSync();
      const updated = await api.getSyncStatus();
      setSyncStatus(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'Mentor':
        return 'bg-purple-900/80 text-purple-200 border-purple-700/60';
      case 'Admin':
        return 'bg-blue-900/80 text-blue-200 border-blue-700/60';
      case 'RM':
      default:
        return 'bg-emerald-900/80 text-emerald-200 border-emerald-700/60';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0F294A] text-white border-b border-[#1b3d6b] shadow-md">
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Team Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate && onNavigate('dashboard')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-inner border border-white/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
                    {appName}
                  </span>
                </div>
                <div className="text-[10px] text-blue-300 tracking-tight flex items-center gap-1 truncate max-w-[240px]">
                  <span>{teamName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Real-time Asia/Dhaka digital clock */}
          <div className="hidden md:flex items-center">
            <DhakaClock />
          </div>

          {/* Right: Google Sheets status, Location Link, User Profile, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Location Monitor quick icon (For Mentor / Admin) */}
            {user?.role !== 'RM' && onNavigate && (
              <button
                onClick={() => onNavigate('locations')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/50 rounded-lg text-xs transition"
                title="Open Team Member Location Monitor"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] font-semibold">Location Monitor</span>
              </button>
            )}

            {/* Google Sheets Sync Pill (For Admin/Mentor) */}
            {user?.role !== 'RM' && (
              <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/70 text-xs">
                <Sheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-slate-300">
                  {syncStatus?.appsScriptConfigured ? 'Sheets Connected' : 'Sheets Setup Ready'}
                </span>
                <button
                  onClick={handleQuickSync}
                  disabled={isSyncing}
                  className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition disabled:opacity-50"
                  title="Trigger Google Sheets Sync"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              </div>
            )}

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-white transition"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase shadow">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-semibold text-xs text-white truncate max-w-[120px]">{user?.name}</span>
                  <span className="text-[10px] text-slate-300">{user?.role === 'RM' ? `RM ${user.rmCode}` : user?.role}</span>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${getRoleBadge(user?.role)}`}>
                  {user?.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 text-slate-800 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Username: {user?.username}
                    </p>
                    {user?.rmCode && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Assigned RM Code: {user.rmCode}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Change Password</span>
                  </button>

                  {user?.role !== 'RM' && onNavigate && (
                    <>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onNavigate('locations');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span>Location Monitor</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onNavigate('sync');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <Sheet className="w-4 h-4 text-emerald-600" />
                        <span>Google Sheets Sync</span>
                      </button>
                    </>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal || Boolean(user?.mustChangePassword)}
        onClose={() => setShowPasswordModal(false)}
        isForcedFirstLogin={Boolean(user?.mustChangePassword)}
      />
    </>
  );
};
