import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Check, Sliders, Calendar, ShieldCheck, Sheet, Save, Link2, ExternalLink, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';
import { AppSettings } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Universal Branding & Sheet
  const [appName, setAppName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState('');
  const [appsScriptWebAppUrl, setAppsScriptWebAppUrl] = useState('');

  // Editable lists
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState('');

  const [pendingDocOptions, setPendingDocOptions] = useState<string[]>([]);
  const [newPendingDoc, setNewPendingDoc] = useState('');

  const [reportingWeekStart, setReportingWeekStart] = useState<'Saturday' | 'Sunday' | 'Monday'>('Saturday');

  // Auto extract spreadsheet ID from link if user pastes full URL
  const handleSpreadsheetInput = (input: string) => {
    setHasChanges(true);
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      setGoogleSpreadsheetId(match[1]);
    } else {
      setGoogleSpreadsheetId(trimmed);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSettings();
        setSettings(data);
        setAppName(data.appName || 'RM File Management & Team Member Data System');
        setTeamName(data.teamName || 'Team Member Data Management System');
        setGoogleSpreadsheetId(data.googleSpreadsheetId || '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI');
        setAppsScriptWebAppUrl(data.appsScriptWebAppUrl || 'https://script.google.com/macros/s/AKfycby3wqRoiAtJx9ujAln9n8mFkmFTN1K0ncgQGpYeDMsx4OPcBaCbK78sHhnvvqqs6aue/exec');
        setProductTypes(data.productTypes || []);
        setPendingDocOptions(data.pendingDocOptions || []);
        setReportingWeekStart(data.reportingWeekStart || 'Saturday');
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (user?.role === 'RM') return;
    setIsSaving(true);
    try {
      await api.updateSettings({
        appName: appName.trim(),
        teamName: teamName.trim(),
        googleSpreadsheetId: googleSpreadsheetId.trim(),
        appsScriptWebAppUrl: appsScriptWebAppUrl.trim(),
        productTypes,
        pendingDocOptions,
        reportingWeekStart,
      });
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addProductType = () => {
    if (!newProduct.trim()) return;
    if (productTypes.includes(newProduct.trim())) return;
    setProductTypes([...productTypes, newProduct.trim()]);
    setNewProduct('');
    setHasChanges(true);
  };

  const removeProductType = (item: string) => {
    setProductTypes(productTypes.filter(p => p !== item));
    setHasChanges(true);
  };

  const addPendingDoc = () => {
    if (!newPendingDoc.trim()) return;
    if (pendingDocOptions.includes(newPendingDoc.trim())) return;
    setPendingDocOptions([...pendingDocOptions, newPendingDoc.trim()]);
    setNewPendingDoc('');
    setHasChanges(true);
  };

  const removePendingDoc = (item: string) => {
    setPendingDocOptions(pendingDocOptions.filter(d => d !== item));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>System Settings & Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure application dropdowns, banking product lines, pending document checklists, and reporting week start.
          </p>
        </div>

        {user?.role !== 'RM' && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-blue-500/25 flex items-center gap-2.5 disabled:opacity-50 self-start sm:self-auto active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4 text-blue-200" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Settings (সেভ করুন)'}</span>
            {saveSuccess && <Check className="w-4 h-4 text-emerald-300 animate-bounce" />}
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>সকল সেটিংস ও গুগল শীট কনফিগারেশন সফলভাবে সেভ করা হয়েছে (Saved Successfully).</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Universal Team Name & Google Sheet Configuration (Editable by Admin/Mentor) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sheet className="w-4 h-4 text-emerald-600" />
              <span>Universal Team Name & Google Sheet Auto-Sync Configuration</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Mentor & Admin Managed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Universal Team Name
              </label>
              <input
                type="text"
                disabled={user?.role === 'RM'}
                value={teamName}
                onChange={e => {
                  setTeamName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Team Member Data Management System"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium disabled:bg-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Team title shown to all team members on login and header.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Universal Portal Title
              </label>
              <input
                type="text"
                disabled={user?.role === 'RM'}
                value={appName}
                onChange={e => {
                  setAppName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="RM File Management & Team Member Data System"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium disabled:bg-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Main application title.
              </p>
            </div>

            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  <span>Google Spreadsheet Link বা Sheet ID (যেকোনো লিঙ্ক দিন, ID অটো নিয়ে নিবে)</span>
                </span>
                {googleSpreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${googleSpreadsheetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 underline"
                  >
                    <span>Open Sheet in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <input
                type="text"
                disabled={user?.role === 'RM'}
                value={googleSpreadsheetId}
                onChange={e => handleSpreadsheetInput(e.target.value)}
                placeholder="Paste full Google Sheet URL e.g. https://docs.google.com/spreadsheets/d/1lb9Wou10ecl... OR Spreadsheet ID"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono bg-white disabled:bg-slate-100"
              />
              <p className="text-[11px] text-slate-500">
                💡 আপনি শুধুমাত্র গুগল শীটের সম্পূর্ণ লিঙ্ক পেস্ট করলেই হবে, সিস্টেম স্বয়ংক্রিয়ভাবে Sheet ID এক্সট্র্যাক্ট করে নিবে।
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Apps Script Web App URL (ফর অটো হেডার্স & রিয়েল-টাইম সিঙ্ক)
                </label>
                <input
                  type="text"
                  disabled={user?.role === 'RM'}
                  value={appsScriptWebAppUrl}
                  onChange={e => {
                    setAppsScriptWebAppUrl(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono bg-white disabled:bg-slate-100"
                />
              </div>

              {user?.role !== 'RM' && (
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Sheet Configuration</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Types Manager */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Product Types Dropdown Options</span>
          </h3>

          <div className="space-y-2">
            {productTypes.map(pt => (
              <div key={pt} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                <span className="font-semibold text-slate-800">{pt}</span>
                {user?.role !== 'RM' && (
                  <button
                    onClick={() => removeProductType(pt)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {user?.role !== 'RM' && (
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newProduct}
                onChange={e => setNewProduct(e.target.value)}
                placeholder="New product type..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addProductType}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Pending Document Checklist Options */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Pending Document Checklist Items</span>
          </h3>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {pendingDocOptions.map(doc => (
              <div key={doc} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                <span className="font-semibold text-slate-800">{doc}</span>
                {user?.role !== 'RM' && (
                  <button
                    onClick={() => removePendingDoc(doc)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {user?.role !== 'RM' && (
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newPendingDoc}
                onChange={e => setNewPendingDoc(e.target.value)}
                placeholder="New pending document requirement..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addPendingDoc}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Reporting Week Start Configuration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Banking Reporting Week Schedule</span>
          </h3>
          <p className="text-xs text-slate-500">
            Define the reporting week calculation period for all RM dashboards, admin comparative tables, and export summaries.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['Saturday', 'Sunday', 'Monday'] as const).map(day => (
              <label
                key={day}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition select-none flex items-center gap-3 ${
                  reportingWeekStart === day
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportingWeek"
                  value={day}
                  checked={reportingWeekStart === day}
                  onChange={() => setReportingWeekStart(day)}
                  disabled={user?.role === 'RM'}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-sm">{day} to {day === 'Saturday' ? 'Friday' : day === 'Sunday' ? 'Saturday' : 'Sunday'}</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {day === 'Saturday' ? 'Standard Bangladesh Banking Week' : 'Alternative Schedule'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* BOTTOM SAVE ACTION CARD FOR MENTOR & ADMIN */}
        {user?.role !== 'RM' && (
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl border border-blue-500/30 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 md:col-span-2">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-black flex items-center justify-center sm:justify-start gap-2">
                <Save className="w-5 h-5 text-emerald-400" />
                <span>Save All System & Google Sheet Settings</span>
              </h4>
              <p className="text-xs text-slate-300">
                সকল পরিবর্তন ডাটাবেজ এবং লাইভ অ্যাপ্লিকেশনে সাথে সাথে কার্যকর করতে নিচের বাটনে ক্লিক করুন।
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-black transition shadow-lg shadow-emerald-500/30 flex items-center gap-2.5 disabled:opacity-50 active:scale-98 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4 text-emerald-100" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings (সবকিছু সেভ করুন)'}</span>
              {saveSuccess && <Check className="w-4 h-4 text-white animate-bounce" />}
            </button>
          </div>
        )}
      </div>

      {/* STICKY FLOATING SAVE BAR WHEN CHANGES ARE MADE */}
      {hasChanges && user?.role !== 'RM' && (
        <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:w-auto z-40 animate-in slide-in-from-bottom-3 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Unsaved changes in settings</span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Now (সেভ করুন)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
