import React, { useState } from 'react';
import { 
  Compass, 
  X, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  Database, 
  BarChart3, 
  Sheet, 
  ScrollText, 
  Settings, 
  MapPin, 
  Navigation,
  CheckCircle,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { identifyCurrentLocationAndPing } from '../../utils/geolocation.js';

interface FloatingNavButtonProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const FloatingNavButton: React.FC<FloatingNavButtonProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locSuccess, setLocSuccess] = useState<string | null>(null);

  const role = user?.role;

  const navItems = [
    {
      id: 'dashboard',
      label: role === 'RM' ? 'My Performance' : role === 'Mentor' ? 'Mentor Command' : 'Global Dashboard',
      icon: LayoutDashboard,
      color: 'text-blue-600',
    },
    {
      id: 'files',
      label: 'Customer Files & Entry',
      icon: FileSpreadsheet,
      color: 'text-emerald-600',
    },
    ...(role !== 'RM' ? [
      {
        id: 'rms',
        label: 'RM Mapping & Staff',
        icon: Users,
        color: 'text-indigo-600',
      },
      {
        id: 'database',
        label: 'Master Database',
        icon: Database,
        color: 'text-purple-600',
      },
      {
        id: 'locations',
        label: 'Location Monitor',
        icon: MapPin,
        color: 'text-rose-600',
        badge: 'Live',
      },
    ] : []),
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: BarChart3,
      color: 'text-amber-600',
    },
    ...(role !== 'RM' ? [
      {
        id: 'sync',
        label: 'Google Sheets Sync',
        icon: Sheet,
        color: 'text-teal-600',
      },
      {
        id: 'audit',
        label: 'Audit Logs',
        icon: ScrollText,
        color: 'text-slate-600',
      },
    ] : []),
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      color: 'text-cyan-600',
    },
  ];

  const handleShareCurrentLocation = async () => {
    setIsLocating(true);
    setLocSuccess(null);
    try {
      const res = await identifyCurrentLocationAndPing('Floating Button Check-In');
      setLocSuccess(`Location shared! (${res.address.slice(0, 30)}...)`);
      setTimeout(() => setLocSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Could not access location');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-end">
      {/* Floating Action Menu popup */}
      {isOpen && (
        <div className="mb-3 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-150">
          <div className="bg-[#0F294A] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-xs uppercase tracking-wider">Quick Navigation</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-300 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Location quick check-in banner */}
          <div className="p-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-col gap-1.5 text-xs">
            <button
              onClick={handleShareCurrentLocation}
              disabled={isLocating}
              className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isLocating ? 'Detecting Location...' : 'Check-In My Current Location'}</span>
            </button>
            {locSuccess && (
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {locSuccess}
              </span>
            )}
          </div>

          <div className="p-2 max-h-80 overflow-y-auto space-y-1 text-xs">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-blue-900' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="group relative flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-[#0F294A] hover:from-blue-700 hover:to-[#0a1e36] text-white rounded-full shadow-2xl hover:shadow-blue-600/30 transition-all duration-200 border-2 border-white/20 active:scale-95"
        title="Quick Page Navigation"
      >
        <Compass className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'group-hover:rotate-45'}`} />
        <span className="text-xs font-bold tracking-tight pr-1 hidden sm:inline">
          {isOpen ? 'Close Menu' : 'Quick Menu'}
        </span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
      </button>
    </div>
  );
};
