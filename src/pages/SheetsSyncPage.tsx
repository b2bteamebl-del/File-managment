import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Check, 
  ShieldCheck, 
  Play, 
  Sliders, 
  Database,
  TableProperties,
  FileSpreadsheet,
  Users,
  Paperclip,
  Sparkles,
  ScrollText,
  Download,
  Copy,
  Eye,
  Code2,
  X
} from 'lucide-react';
import { api } from '../lib/api.js';
import { formatDhakaDateTime } from '../utils/dateTime.js';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleAppsScriptCode.js';

export const SheetsSyncPage: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // One-click creation states
  const [isCreatingTabs, setIsCreatingTabs] = useState(false);
  const [createTabsResult, setCreateTabsResult] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Editable Web App URL and Sheet ID
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const [statusRes, settingsRes] = await Promise.all([
        api.getSyncStatus(),
        api.getSettings(),
      ]);
      setSyncStatus(statusRes);
      setSettings(settingsRes);
      setSpreadsheetId(settingsRes.googleSpreadsheetId || '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI');
      setWebAppUrl(settingsRes.appsScriptWebAppUrl || 'https://script.google.com/macros/s/AKfycbzY95VDdGFwZRwVTINJWl7ldNubx6g2-NcA6os_g8xA2HvoENVQrocyHFIqPvIhwX5y/exec');
      setSecretToken(settingsRes.appsScriptSecretToken || 'EBL_RM_SYNC_2026_SECURE_TOKEN_#99');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = spreadsheetId.includes('/d/') 
      ? (spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || spreadsheetId.trim())
      : spreadsheetId.trim();

    try {
      await api.updateSettings({
        googleSpreadsheetId: cleanId,
        appsScriptWebAppUrl: webAppUrl.trim(),
        appsScriptSecretToken: secretToken.trim(),
      });
      setSpreadsheetId(cleanId);
      setSaveSuccess(true);
      fetchStatus();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSyncConnection(webAppUrl, secretToken);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateTabsAndHeaders = async () => {
    if (!webAppUrl.trim()) {
      alert('Please enter your Google Apps Script Web App URL first.');
      return;
    }
    setIsCreatingTabs(true);
    setCreateTabsResult(null);
    try {
      // Save settings first so the backend knows the target URL
      await api.updateSettings({
        googleSpreadsheetId: spreadsheetId.trim(),
        appsScriptWebAppUrl: webAppUrl.trim(),
        appsScriptSecretToken: secretToken.trim(),
      });
      const res = await api.initSheets(webAppUrl.trim(), secretToken.trim());
      setCreateTabsResult(res);
      fetchStatus();
    } catch (err: any) {
      setCreateTabsResult({
        success: false,
        message: err.message || 'Failed to create tabs and headers in Google Sheet',
      });
    } finally {
      setIsCreatingTabs(false);
    }
  };

  const handleTriggerBatchSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.triggerSync({
        url: webAppUrl.trim(),
        token: secretToken.trim(),
      });
      alert(res.message || 'Sync completed!');
      fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const copyTextSafely = async (text: string): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallback to execCommand
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  const handleCopyScriptCode = async () => {
    let code = GOOGLE_APPS_SCRIPT_CODE;
    try {
      const res = await api.getScriptCode();
      if (res && res.code) {
        code = res.code;
      }
    } catch {
      // fallback to embedded code
    }

    const copied = await copyTextSafely(code);
    if (copied) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 4000);
    } else {
      setShowCodeModal(true);
    }
  };

  const handleDownloadCodeFile = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sheet className="w-5 h-5 text-emerald-600" />
            <span>Google Sheets Synchronization Panel</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative Google Spreadsheet ID:{' '}
            <strong className="font-mono text-slate-800">{spreadsheetId || '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1.5"
            >
              <span>Open Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ONE-CLICK AUTO CREATE TABS & HEADERS SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl border border-blue-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>One-Click Sheet Setup / অ্যাপ থেকে স্বয়ংক্রিয় সেটআপ</span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <TableProperties className="w-5 h-5 text-emerald-400" />
              <span>Create 5 New Tabs & Formatted Headers</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Google Sheet-এ ম্যানুয়ালি কোনো ট্যাব বা কলাম তৈরি করার দরকার নেই! শুধুমাত্র নিচে Web App URL দিয়ে <strong>"Create Tabs & Headers Now"</strong> বাটনে ক্লিক করুন। সিস্টেম সাথে সাথে ৫টি নতুন ট্যাব তৈরি করে দিবে এবং নেভি ব্লু হেডারে সাজিয়ে নিবে।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyScriptCode}
              className={`px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-98 cursor-pointer ${
                copiedCode 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title="Click to copy full Code.gs script to clipboard"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copiedCode ? 'Copied! (কপি হয়েছে)' : 'Copy Code.gs (কপি)'}</span>
            </button>

            {/* Direct File Download Button */}
            <button
              type="button"
              onClick={handleDownloadCodeFile}
              className="px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-98 cursor-pointer"
              title="Download Code.gs file directly to your computer"
            >
              <Download className="w-4 h-4 text-teal-300" />
              <span>Download File (ডাউনলোড)</span>
            </button>

            {/* View Full Code Modal Button */}
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-98 cursor-pointer"
              title="View full script in modal"
            >
              <Eye className="w-4 h-4 text-blue-300" />
              <span>View Code (কোড দেখুন)</span>
            </button>

            {/* Create Tabs & Headers Now Button */}
            <button
              type="button"
              onClick={handleCreateTabsAndHeaders}
              disabled={isCreatingTabs || !webAppUrl.trim()}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 whitespace-nowrap active:scale-98 cursor-pointer"
            >
              {isCreatingTabs ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Tabs...</span>
                </>
              ) : (
                <>
                  <TableProperties className="w-4 h-4" />
                  <span>Create Tabs & Headers</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5 Tabs Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Customer_Files</span>
            </div>
            <div className="text-[10px] text-slate-300">26 Columns (FILE_ID, CC_NUMBER, Location, CPV, etc.)</div>
            <div className="mt-2 text-[9px] bg-slate-950/80 font-mono p-1 rounded text-emerald-300 truncate">
              #0F294A Navy Blue Header
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-xs text-blue-300 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>RM_Mapping</span>
            </div>
            <div className="text-[10px] text-slate-300">9 Columns (RM_CODE, Name, Mobile, Email, etc.)</div>
            <div className="mt-2 text-[9px] bg-slate-950/80 font-mono p-1 rounded text-blue-300 truncate">
              #0F294A Navy Blue Header
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300 mb-1">
              <Paperclip className="w-3.5 h-3.5" />
              <span>File_Attachments</span>
            </div>
            <div className="text-[10px] text-slate-300">8 Columns (Status Pic, CPV Pic, Path, etc.)</div>
            <div className="mt-2 text-[9px] bg-slate-950/80 font-mono p-1 rounded text-purple-300 truncate">
              #0F294A Navy Blue Header
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit_Logs</span>
            </div>
            <div className="text-[10px] text-slate-300">8 Columns (Action, User, Timestamp, etc.)</div>
            <div className="mt-2 text-[9px] bg-slate-950/80 font-mono p-1 rounded text-amber-300 truncate">
              #0F294A Navy Blue Header
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-300 mb-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>App_Settings</span>
            </div>
            <div className="text-[10px] text-slate-300">4 Columns (Key, Value, Updated By, Time)</div>
            <div className="mt-2 text-[9px] bg-slate-950/80 font-mono p-1 rounded text-rose-300 truncate">
              #0F294A Navy Blue Header
            </div>
          </div>
        </div>

        {/* Creation Feedback Banner */}
        {createTabsResult && (
          <div className={`p-4 rounded-xl text-xs border ${
            createTabsResult.success
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100'
              : 'bg-red-500/20 border-red-500 text-red-100'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold">
                {createTabsResult.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{createTabsResult.message}</span>
              </div>
              {spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow-xs"
                >
                  <span>Open Sheet in Google ↗</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REAL-TIME AUTO-SYNC ACTIVE BANNER */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-emerald-950">
                স্বয়ংক্রিয় রিয়েল-টাইম সিঙ্ক চালু আছে (Real-Time Auto-Sync Active)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                100% Automated
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed font-medium">
              অ্যাপ্লিকেশনে যে কোনো ডেটা <strong>এন্ট্রি (Create)</strong>, <strong>আপডেট (Update)</strong> বা <strong>ডিলিট (Delete)</strong> করার সাথে সাথেই তা স্বয়ংক্রিয়ভাবে Google Sheets-এ এন্ট্রি হয়ে যায়। ম্যানুয়ালি সিঙ্ক বাটন চাপার কোনো প্রয়োজন নেই।
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block font-semibold">
            Background Queue: Active (30s)
          </span>
        </div>
      </div>

      {/* Sync Health & Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync State</span>
            <span className={`w-2.5 h-2.5 rounded-full ${
              syncStatus?.lastSyncStatus === 'Success' ? 'bg-emerald-500' :
              syncStatus?.lastSyncStatus === 'InProgress' ? 'bg-blue-500 animate-ping' :
              syncStatus?.lastSyncStatus === 'Error' ? 'bg-red-500' : 'bg-slate-400'
            }`} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            {syncStatus?.appsScriptConfigured ? (syncStatus?.lastSyncStatus || 'Ready') : 'Configuration Pending'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {syncStatus?.appsScriptConfigured ? 'Apps Script endpoint mapped' : 'Provide Apps Script Web App URL below'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Synced Files</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {syncStatus?.stats?.syncedCount || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Out of {syncStatus?.stats?.totalFiles || 0} total records</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Sync Queue</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {syncStatus?.stats?.pendingCount || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Queued for automated batch sync</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Sync Time</span>
          <h3 className="text-sm font-bold text-slate-900 mt-2 truncate">
            {formatDhakaDateTime(syncStatus?.lastSuccessfulSync)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Dhaka Standard Time (BST)</p>
        </div>
      </div>

      {/* Manual Sync Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Manual Full-Spectrum Synchronization</span>
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Atomically syncs all customer records, RM mappings, and attachments to the Google Sheet.
          </p>
        </div>

        <button
          onClick={handleTriggerBatchSync}
          disabled={isSyncing || !syncStatus?.appsScriptConfigured}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center gap-2 whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          {isSyncing ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synchronizing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Sync All Data to Sheets Now</span>
            </>
          )}
        </button>
      </div>

      {/* Web App URL Configuration */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Google Apps Script Web App Configuration</span>
        </h3>
        <p className="text-xs text-slate-500">
          Paste the deployed Web App URL from Google Apps Script below to connect your sheet.
        </p>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Target Google Spreadsheet ID or Full Sheets URL
              </label>
              {spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <span>Open Sheet in New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="text"
              required
              value={spreadsheetId}
              onChange={e => setSpreadsheetId(e.target.value)}
              placeholder="e.g. 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Apps Script Deployed Web App URL
            </label>
            <input
              type="url"
              value={webAppUrl}
              onChange={e => setWebAppUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Deployed as Web App &gt; Execute as: "Me" &gt; Access: "Anyone".
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shared Authorization Token
            </label>
            <input
              type="text"
              value={secretToken}
              onChange={e => setSecretToken(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Save Configuration
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !webAppUrl}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? 'Testing Endpoint...' : 'Test Connection'}
            </button>

            <button
              type="button"
              onClick={handleCreateTabsAndHeaders}
              disabled={isCreatingTabs || !webAppUrl}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>{isCreatingTabs ? 'Setting up...' : 'Create Tabs & Headers'}</span>
            </button>

            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Settings saved!
              </span>
            )}
          </div>
        </form>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-4 rounded-xl text-xs border ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{testResult.message}</span>
            </div>
            {testResult.details && (
              <pre className="mt-2 p-2 bg-white/70 rounded text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-700">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Google Spreadsheet Auto-Setup Instructions</span>
        </h3>
        <p>
          ১. আপনি ইতিমধ্যে Apps Script ডিপ্লয় করে থাকলে, ওপরের বক্সে <strong>Web App URL</strong> পেস্ট করুন এবং <strong>Save Configuration</strong> দিন।<br />
          ২. এরপর সরাসরি <strong>"Create Tabs & Headers Now"</strong> বাটনে ক্লিক করলেই গুগল শিটে ৫টি নতুন ট্যাব তৈরি হয়ে যাবে এবং সমস্ত কলাম নেভি ব্লু হেডার সহ স্বয়ংক্রিয়ভাবে সাজানো হয়ে যাবে!
        </p>
      </div>

      {/* Complete Code.gs Modal Viewer */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0F294A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Google Apps Script Complete Code (Code.gs)</h3>
                  <p className="text-[11px] text-slate-300">Copy this complete script into Google Apps Script editor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Read-only Code View */}
            <div className="p-4 flex-1 overflow-hidden flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Click below, press <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[10px]">Ctrl+A</kbd> then <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[10px]">Ctrl+C</kbd> or use the buttons on right:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCodeFile}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={GOOGLE_APPS_SCRIPT_CODE}
                onFocus={e => e.target.select()}
                className="w-full flex-1 p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 overflow-y-auto selection:bg-emerald-900 selection:text-white"
                rows={18}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Spreadsheet ID: <strong className="font-mono text-slate-700">{spreadsheetId}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
