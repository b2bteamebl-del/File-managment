import React from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  Database, 
  BarChart3, 
  Sheet, 
  ScrollText, 
  Settings, 
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role;

  const handleNav = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    {
      id: 'dashboard',
      label: role === 'RM' ? 'My Performance' : role === 'Mentor' ? 'Mentor Command Center' : 'Global Dashboard',
      icon: LayoutDashboard,
      badge: role,
    },
    {
      id: 'files',
      label: 'Customer Files & Entry',
      icon: FileSpreadsheet,
    },
    ...(role !== 'RM' ? [
      {
        id: 'rms',
        label: 'RM Mapping & Staff',
        icon: Users,
      },
      {
        id: 'database',
        label: role === 'Mentor' ? 'Master Database (Superuser)' : 'Master Database',
        icon: Database,
      },
    ] : []),
    // Team Location Monitor: ONLY Mentor can access (Admin cannot see location)
    ...(role === 'Mentor' ? [
      {
        id: 'locations',
        label: 'Team Location Monitor',
        icon: MapPin,
        highlight: true,
      },
    ] : []),
    {
      id: 'reports',
      label: role === 'RM' ? 'My Reports & Export' : 'Reports & Analytics',
      icon: BarChart3,
    },
    // Google Sheets Sync: ONLY Mentor can access (Admin cannot see or access sync)
    ...(role === 'Mentor' ? [
      {
        id: 'sync',
        label: 'Google Sheets Sync',
        icon: Sheet,
      },
    ] : []),
    ...(role !== 'RM' ? [
      {
        id: 'audit',
        label: 'Audit Trail Logs',
        icon: ScrollText,
      },
    ] : []),
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 h-screen lg:h-[calc(100vh-57px)] w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* User Card on top of sidebar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
              <p className="text-xs text-blue-400 font-mono">
                {role === 'RM' ? `RM Code: ${user?.rmCode}` : user?.username}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-300 font-medium">Session Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom system badge */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Spreadsheet:</span>
            <span className="font-mono text-emerald-400 text-[10px]">Google Sheets Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>System:</span>
            <span className="text-slate-300 text-[10px]">Team Data Engine</span>
          </div>
        </div>
      </aside>
    </>
  );
};
