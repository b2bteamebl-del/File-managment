import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  X, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  Database, 
  MapPin, 
  BarChart3, 
  Sheet, 
  ScrollText, 
  Settings, 
  PlusCircle,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface FloatingNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewFile?: () => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ currentTab, onSelectTab, onOpenNewFile }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const role = user?.role;

  // Close floating menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      label: role === 'RM' ? 'My Performance' : role === 'Mentor' ? 'Mentor Command' : 'Global Dashboard',
      icon: LayoutDashboard,
      color: 'bg-blue-600',
    },
    {
      id: 'files',
      label: 'Customer Files',
      icon: FileSpreadsheet,
      color: 'bg-indigo-600',
    },
    ...(role !== 'RM' ? [
      {
        id: 'rms',
        label: 'Team Members & RMs',
        icon: Users,
        color: 'bg-sky-600',
      },
      {
        id: 'database',
        label: 'Master Database',
        icon: Database,
        color: 'bg-violet-600',
      },
    ] : []),
    ...(role === 'Mentor' ? [
      {
        id: 'locations',
        label: 'Location Monitor',
        icon: MapPin,
        color: 'bg-rose-600',
      },
      {
        id: 'sync',
        label: 'Google Sheets',
        icon: Sheet,
        color: 'bg-emerald-600',
      },
    ] : []),
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: BarChart3,
      color: 'bg-amber-600',
    },
    ...(role !== 'RM' ? [
      {
        id: 'audit',
        label: 'Audit Trail',
        icon: ScrollText,
        color: 'bg-slate-600',
      },
    ] : []),
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      color: 'bg-teal-600',
    },
  ];

  const handleSelect = (tabId: string) => {
    onSelectTab(tabId);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating expanded menu popup */}
      {isOpen && (
        <div className="mb-3 w-72 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3.5 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Quick Navigation</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Role: {role}</span>
          </div>

          {/* Quick Action: New File */}
          <div className="mb-2">
            <button
              onClick={() => {
                onSelectTab('files');
                if (onOpenNewFile) onOpenNewFile();
                setIsOpen(false);
              }}
              className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Customer File Application</span>
            </button>
          </div>

          {/* Nav Items List */}
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-800'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">Active</span>
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
        className={`flex items-center gap-2.5 px-4 py-3 rounded-full font-bold text-xs text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/30'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/40 ring-4 ring-blue-500/20'
        }`}
        aria-label="Floating Navigation Menu"
        title="Floating Quick Navigation"
      >
        {isOpen ? (
          <>
            <X className="w-5 h-5" />
            <span>Close Menu</span>
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5 animate-pulse" />
            <span className="hidden sm:inline">Quick Jump</span>
            <ChevronUp className="w-3.5 h-3.5 opacity-80" />
          </>
        )}
      </button>
    </div>
  );
};
