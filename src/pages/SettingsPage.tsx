import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Check, Sliders, Calendar, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { AppSettings } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Universal Branding & Sheet
  const [appName, setAppName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState('');

  // Editable lists
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState('');

  const [pendingDocOptions, setPendingDocOptions] = useState<string[]>([]);
  const [newPendingDoc, setNewPendingDoc] = useState('');

  const [reportingWeekStart, setReportingWeekStart] = useState<'Saturday' | 'Sunday' | 'Monday'>('Saturday');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSettings();
        setSettings(data);
        setAppName(data.appName || 'RM File Management & Team Member Data System');
        setTeamName(data.teamName || 'Team Member Data Management System');
        setGoogleSpreadsheetId(data.googleSpreadsheetId || '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI');
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
        productTypes,
        pendingDocOptions,
        reportingWeekStart,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
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
  };

  const removeProductType = (item: string) => {
    setProductTypes(productTypes.filter(p => p !== item));
  };

  const addPendingDoc = () => {
    if (!newPendingDoc.trim()) return;
    if (pendingDocOptions.includes(newPendingDoc.trim())) return;
    setPendingDocOptions([...pendingDocOptions, newPendingDoc.trim()]);
    setNewPendingDoc('');
  };

  const removePendingDoc = (item: string) => {
    setPendingDocOptions(pendingDocOptions.filter(d => d !== item));
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
            {saveSuccess && <Check className="w-4 h-4 text-emerald-300" />}
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>System configuration successfully saved and applied.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Universal Team Name & Branding (Editable by Admin/Mentor) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Universal Team Name & Google Sheet Configuration</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
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
                onChange={e => setTeamName(e.target.value)}
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
                onChange={e => setAppName(e.target.value)}
                placeholder="RM File Management & Team Member Data System"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium disabled:bg-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Main application title.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Spreadsheet ID or Sheets URL
              </label>
              <input
                type="text"
                disabled={user?.role === 'RM'}
                value={googleSpreadsheetId}
                onChange={e => setGoogleSpreadsheetId(e.target.value)}
                placeholder="1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Changes target Google Sheet universally across the application.
              </p>
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
      </div>
    </div>
  );
};
