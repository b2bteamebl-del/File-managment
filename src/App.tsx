import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Login } from './pages/Login.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { RMDashboard } from './pages/RMDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { MentorDashboard } from './pages/MentorDashboard.js';
import { FileEntryAndList } from './pages/FileEntryAndList.js';
import { RMMappingPage } from './pages/RMMappingPage.js';
import { DatabaseManagement } from './pages/DatabaseManagement.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { SheetsSyncPage } from './pages/SheetsSyncPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

import { LocationMonitorPage } from './pages/LocationMonitorPage.js';
import { FloatingNav } from './components/common/FloatingNav.js';
import { MobileSMSBanner } from './components/common/MobileSMSBanner.js';
import { getUserPreferences, applyUserPreferences } from './utils/userPreferences.js';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drilldownRmCode, setDrilldownRmCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      const prefs = getUserPreferences(user);
      applyUserPreferences(prefs);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Initializing Team Member Data Management System...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleDrilldownRM = (rmCode: string) => {
    setDrilldownRmCode(rmCode);
    setCurrentTab('files');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        if (user.role === 'RM') {
          return <RMDashboard onNavigateToFiles={() => setCurrentTab('files')} />;
        }
        if (user.role === 'Mentor') {
          return <MentorDashboard onNavigate={tab => setCurrentTab(tab)} />;
        }
        return <AdminDashboard onSelectRMForDrilldown={handleDrilldownRM} />;

      case 'files':
        return <FileEntryAndList initialFilterRmCode={drilldownRmCode} />;

      case 'rms':
        if (user.role === 'RM') {
          return <RMDashboard onNavigateToFiles={() => setCurrentTab('files')} />;
        }
        return <RMMappingPage />;

      case 'database':
        if (user.role === 'RM') {
          return <RMDashboard onNavigateToFiles={() => setCurrentTab('files')} />;
        }
        return <DatabaseManagement />;

      case 'locations':
        if (user.role !== 'Mentor') {
          return user.role === 'RM' 
            ? <RMDashboard onNavigateToFiles={() => setCurrentTab('files')} />
            : <AdminDashboard onSelectRMForDrilldown={handleDrilldownRM} />;
        }
        return <LocationMonitorPage />;

      case 'reports':
        return <ReportsPage />;

      case 'sync':
        if (user.role !== 'Mentor') {
          return user.role === 'RM' 
            ? <RMDashboard onNavigateToFiles={() => setCurrentTab('files')} />
            : <AdminDashboard onSelectRMForDrilldown={handleDrilldownRM} />;
        }
        return <SheetsSyncPage />;

      case 'audit':
        if (user.role === 'RM') {
          return <RMDashboard onNavigateToFiles={() => setCurrentTab('files')} />;
        }
        return <AuditLogsPage />;

      case 'settings':
        return <SettingsPage />;

      default:
        return user.role === 'RM' ? <RMDashboard /> : <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Mobile SMS Alert Pop-Down Banner & Chime */}
      <MobileSMSBanner onNavigateToFiles={() => setCurrentTab('files')} />

      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={tab => setCurrentTab(tab)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            if (tab !== 'files') setDrilldownRmCode(undefined);
            setCurrentTab(tab);
          }}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      <FloatingNav 
        currentTab={currentTab} 
        onSelectTab={tab => {
          if (tab !== 'files') setDrilldownRmCode(undefined);
          setCurrentTab(tab);
        }} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
