import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  Database, 
  Users, 
  Sheet, 
  ScrollText, 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  RefreshCw,
  Sliders,
  FileCheck,
  MapPin,
  Sparkles,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';
import { api } from '../lib/api.js';
import { TimeRangeFilter, KPICounts } from '../types/index.js';

interface MentorDashboardProps {
  onNavigate: (tab: string) => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<TimeRangeFilter>('This Month');
  const [data, setData] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mentor Universal Configuration State
  const [teamName, setTeamName] = useState('Team Member Data Management System');
  const [appName, setAppName] = useState('RM File Management & Performance Dashboard');
  const [sheetId, setSheetId] = useState('1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [isTriggeringSync, setIsTriggeringSync] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, syncRes, settingsRes, locationsRes] = await Promise.all([
        api.getSummary({ period }),
        api.getSyncStatus(),
        api.getSettings(),
        api.getLatestLocations(),
      ]);
      setData(summaryRes);
      setSyncStatus(syncRes);
      if (settingsRes.teamName) setTeamName(settingsRes.teamName);
      if (settingsRes.appName) setAppName(settingsRes.appName);
      if (settingsRes.googleSpreadsheetId) setSheetId(settingsRes.googleSpreadsheetId);
      if (settingsRes.appsScriptWebAppUrl) setWebAppUrl(settingsRes.appsScriptWebAppUrl);
      setLocations(locationsRes || []);
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleSaveUniversalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateSettings({
        teamName: teamName.trim(),
        appName: appName.trim(),
        googleSpreadsheetId: sheetId.trim(),
        appsScriptWebAppUrl: webAppUrl.trim(),
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Failed to update universal settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleQuickSyncNow = async () => {
    setIsTriggeringSync(true);
    try {
      const res = await api.triggerSync();
      alert(res.message || 'Google Sheets synchronization completed!');
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Synchronization failed');
    } finally {
      setIsTriggeringSync(false);
    }
  };

  const k: KPICounts = data?.kpis || {
    totalFiles: 0,
    collected: 0,
    submitted: 0,
    approved: 0,
    declined: 0,
    query: 0,
    returnToSource: 0,
    condition: 0,
    stc: 0,
    pendingDocuments: 0,
    activeCardsY: 0,
    inactiveCardsN: 0,
    cancelledCardsC: 0,
  };

  const approvalRate = k.submitted > 0 ? Math.round((k.approved / k.submitted) * 100) : 0;
  const queryRate = k.submitted > 0 ? Math.round((k.query / k.submitted) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Mentor Command Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-[#0F294A] rounded-2xl p-6 text-white shadow-lg border border-purple-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shadow-inner">
              <Crown className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Senior Operational Role
                </span>
                <span className="text-xs text-purple-200 font-mono">UID: 12345</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Mentor Command Center & Portfolio Oversight
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Full-spectrum operational authority • Permanent record purge control • Google Sheets sync monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => onNavigate('locations')}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Location Monitor ({locations.length})</span>
            </button>
            <button
              onClick={() => onNavigate('database')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Master Database</span>
            </button>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* MENTOR UNIVERSAL CONFIGURATION & GOOGLE SHEETS CONTROL */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Universal Team Name & Google Sheet Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Any changes made here apply universally across all team members, login screens, headers, and sync endpoints.
              </p>
            </div>
          </div>

          {settingsSuccess && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Universally Applied & Saved</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveUniversalSettings} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Universal Team Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Universal Team Name <span className="text-purple-600">(Visible to all members)</span>
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="e.g. Sales & Credit Team Alpha"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
            />
            <p className="text-[11px] text-slate-400">
              Displays under the logo on the login page and top navbar for all team members.
            </p>
          </div>

          {/* Universal Portal Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Universal Portal Title
            </label>
            <input
              type="text"
              required
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="e.g. RM File Management & Performance Dashboard"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
            />
            <p className="text-[11px] text-slate-400">
              Main portal title shown across browser tabs and system headers.
            </p>
          </div>

          {/* Google Spreadsheet ID or URL */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Spreadsheet ID or Full Sheets URL <span className="text-emerald-600">(Change or Add Sheet)</span>
              </label>
              {sheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <span>Open Active Spreadsheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="text"
              required
              value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              placeholder="e.g. 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI or full https://docs.google.com/spreadsheets/d/.../edit"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Paste any Google Spreadsheet ID or full URL. The backend automatically targets the new sheet for synchronized records.
            </p>
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingSettings ? (
                  <span>Applying Changes...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Apply Universally</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleQuickSyncNow}
                disabled={isTriggeringSync}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringSync ? 'animate-spin' : ''}`} />
                <span>Sync with Google Sheets Now</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('sync')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>View Full Synchronization Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Strategic Efficiency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Files */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Portfolio</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{k.totalFiles}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Across all active RMs</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Approval Conversion Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approval Conversion</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{approvalRate}%</h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">{k.approved} Approved / {k.submitted} Submitted</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Query & Return Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Operations Query</p>
            <h3 className="text-3xl font-black text-purple-600 mt-1">{k.query}</h3>
            <p className="text-[11px] text-purple-700 font-medium mt-1">RTS: {k.returnToSource} • Condition: {k.condition}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Active Cards vs Backlog */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Cards Issued</p>
            <h3 className="text-3xl font-black text-green-700 mt-1">{k.activeCardsY}</h3>
            <p className="text-[11px] text-red-600 font-medium mt-1">{k.pendingDocuments} Files have missing docs</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Ops Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Google Sheets Sync Integrity Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sheet className="w-4 h-4 text-emerald-600" />
                <span>Google Sheets Sync State</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                syncStatus?.appsScriptConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {syncStatus?.appsScriptConfigured ? 'Connected' : 'Setup Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Synchronizing with authoritative Google Spreadsheet:
            </p>
            <div className="mt-2 p-2 bg-slate-50 rounded font-mono text-[11px] text-slate-700 break-all border border-slate-200">
              1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <span className="block font-bold text-slate-800">{syncStatus?.stats?.totalFiles || 0}</span>
                <span className="text-[10px] text-slate-500">Total</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded">
                <span className="block font-bold text-emerald-700">{syncStatus?.stats?.syncedCount || 0}</span>
                <span className="text-[10px] text-emerald-600">Synced</span>
              </div>
              <div className="p-2 bg-amber-50 rounded">
                <span className="block font-bold text-amber-700">{syncStatus?.stats?.pendingCount || 0}</span>
                <span className="text-[10px] text-amber-600">Pending</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('sync')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <span>Manage Sheets Sync</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RM Mapping & Account Oversight */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>RM Mapping & Security Roles</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Active Staff
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage RM login codes, force temporary password resets, review access logs, and assign portfolios.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-semibold text-slate-700">Active RMs</span>
                <span className="font-bold text-blue-700">{(data?.rmPerformance || []).length} Officers</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-semibold text-slate-700">Strict Isolation</span>
                <span className="font-bold text-emerald-700">Enforced by Server & Rules</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('rms')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <span>Open RM Mapping Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audit Trail & Compliance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-indigo-600" />
                <span>Regulatory Audit Trail</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Compliance
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Immutable logging of all file creations, edits, soft deletions, export requests, and password resets.
            </p>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 text-xs text-purple-900 leading-relaxed">
              <strong>Mentor Guard:</strong> Permanent deletions bypass soft-delete only when performed by Mentor with explicit confirmation.
            </div>
          </div>

          <button
            onClick={() => onNavigate('audit')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <span>Inspect Audit Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
