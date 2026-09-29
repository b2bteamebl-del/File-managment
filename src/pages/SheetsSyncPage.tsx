import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck, 
  Play, 
  Sliders, 
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api.js';
import { formatDhakaDateTime } from '../utils/dateTime.js';

export const SheetsSyncPage: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Editable Web App URL and Sheet ID
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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
      setWebAppUrl(settingsRes.appsScriptWebAppUrl || '');
      setSecretToken(settingsRes.appsScriptSecretToken || 'RM_TEAM_SYNC_2026_SECURE_TOKEN_#99');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        googleSpreadsheetId: spreadsheetId.trim(),
        appsScriptWebAppUrl: webAppUrl.trim(),
        appsScriptSecretToken: secretToken.trim(),
      });
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

  const handleTriggerBatchSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.triggerSync();
      alert(res.message || 'Sync completed!');
      fetchStatus();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const appsScriptCodeSnippet = `// Google Apps Script for Spreadsheet 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI
// See /google-apps-script/Code.gs in the repository for the full tested production script!`;

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
            Authoritative Cloud Firestore / Server DB synchronization with Google Spreadsheet ID:{' '}
            <strong className="font-mono text-slate-800">1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://docs.google.com/spreadsheets/d/1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1.5"
          >
            <span>Open Google Spreadsheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

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

      {/* Manual Actions Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Manual Full-Spectrum Synchronization</span>
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Atomically upserts all customer records and RM mappings to Google Spreadsheet using FILE_ID and RM_CODE keys.
          </p>
        </div>

        <button
          onClick={handleTriggerBatchSync}
          disabled={isSyncing || !syncStatus?.appsScriptConfigured}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
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
          The application writes securely to Google Sheets via your deployed Apps Script Web App. Passwords and credentials are never stored in the spreadsheet.
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
              placeholder="e.g. 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI or paste full Google Sheet link"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enter any Google Spreadsheet ID or paste the complete URL. The system automatically extracts the ID and syncs customer records.
            </p>
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
              Deploy as Web App &gt; Execute as: "Me" &gt; Who has access: "Anyone".
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

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Save Configuration
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !webAppUrl}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300 flex items-center gap-1.5"
            >
              {isTesting ? 'Testing Endpoint...' : 'Test Connection'}
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

      {/* Step-by-Step Deployment Instructions */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Step-by-Step Google Spreadsheet Setup Guide</span>
        </h3>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
            <div>
              <strong>Open Target Google Sheet:</strong> Open{' '}
              <a 
                href="https://docs.google.com/spreadsheets/d/1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI" 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 underline font-mono"
              >
                1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI
              </a>.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
            <div>
              <strong>Open Apps Script:</strong> Click <strong>Extensions &gt; Apps Script</strong>.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
            <div>
              <strong>Paste Script:</strong> Copy the code from{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-800">/google-apps-script/Code.gs</code>{' '}
              and paste it into the editor.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
            <div>
              <strong>Run Initialization:</strong> Select <code className="bg-slate-200 px-1 py-0.5 rounded">initSpreadsheetStructure</code> and click <strong>Run</strong>. This will safely create or verify all 5 tabs (<code className="font-semibold text-slate-800">RM_Mapping</code>, <code className="font-semibold text-slate-800">Customer_Files</code>, <code className="font-semibold text-slate-800">File_Attachments</code>, <code className="font-semibold text-slate-800">Audit_Logs</code>, <code className="font-semibold text-slate-800">App_Settings</code>) with headers without touching any existing rows.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">5</span>
            <div>
              <strong>Deploy Web App:</strong> Click <strong>Deploy &gt; New deployment &gt; Web app</strong>. Execute as: <code className="font-semibold">Me</code>, Access: <code className="font-semibold">Anyone</code>. Copy the URL and paste it above!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
