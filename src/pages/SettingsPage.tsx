import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  Sliders, 
  Calendar, 
  ShieldCheck, 
  Sheet, 
  Save, 
  Link2, 
  ExternalLink, 
  User, 
  Type, 
  Globe, 
  Palette, 
  Camera, 
  Sparkles 
} from 'lucide-react';
import { api } from '../lib/api.js';
import { AppSettings } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { 
  getUserPreferences, 
  saveUserPreferences, 
  applyUserPreferences,
  UserDisplayPreferences,
  THEME_PALETTES 
} from '../utils/userPreferences.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mentor Only: Universal Branding & Sheet
  const [appName, setAppName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState('');
  const [appsScriptWebAppUrl, setAppsScriptWebAppUrl] = useState('');
  const [reportingWeekStart, setReportingWeekStart] = useState<'Saturday' | 'Sunday' | 'Monday'>('Saturday');

  // Admin & Mentor: Dropdown Lists
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState('');
  const [pendingDocOptions, setPendingDocOptions] = useState<string[]>([]);
  const [newPendingDoc, setNewPendingDoc] = useState('');

  // RM & Personal Preferences (Font size, language, font style, theme color, profile picture)
  const [userPrefs, setUserPrefs] = useState<UserDisplayPreferences>(() => getUserPreferences(user));
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

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
        const [data, remotePrefRes] = await Promise.all([
          api.getSettings(),
          api.getUserPreferences().catch(() => ({ preferences: {} })),
        ]);
        setSettings(data);
        setAppName(data.appName || 'RM File Management & Team Member Data System');
        setTeamName(data.teamName || 'Team Member Data Management System');
        setGoogleSpreadsheetId(data.googleSpreadsheetId || '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI');
        setAppsScriptWebAppUrl(data.appsScriptWebAppUrl || 'https://script.google.com/macros/s/AKfycby3wqRoiAtJx9ujAln9n8mFkmFTN1K0ncgQGpYeDMsx4OPcBaCbK78sHhnvvqqs6aue/exec');
        setProductTypes(data.productTypes || []);
        setPendingDocOptions(data.pendingDocOptions || []);
        setReportingWeekStart(data.reportingWeekStart || 'Saturday');

        if (remotePrefRes?.preferences && Object.keys(remotePrefRes.preferences).length > 0) {
          setUserPrefs(prev => ({ ...prev, ...remotePrefRes.preferences }));
        } else if (user?.preferences) {
          setUserPrefs(prev => ({ ...prev, ...user.preferences }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSave = async () => {
    if (user?.role === 'RM') return;
    setIsSaving(true);
    try {
      const payload: Partial<AppSettings> = {
        productTypes,
        pendingDocOptions,
      };

      // Only Mentor can update Google Sheet and Reporting Week
      if (user?.role === 'Mentor') {
        payload.appName = appName.trim();
        payload.teamName = teamName.trim();
        payload.googleSpreadsheetId = googleSpreadsheetId.trim();
        payload.appsScriptWebAppUrl = appsScriptWebAppUrl.trim();
        payload.reportingWeekStart = reportingWeekStart;
      }

      await api.updateSettings(payload);
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.username) return;
    saveUserPreferences(user.username, userPrefs);
    try {
      await api.saveUserPreferences(userPrefs);
    } catch (e) {
      console.warn('Preferences save note:', e);
    }
    setPrefSaveSuccess(true);
    setTimeout(() => setPrefSaveSuccess(false), 3000);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPrefs(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>
              {user?.role === 'RM' 
                ? 'Personal Display & Theme Settings' 
                : user?.role === 'Admin'
                ? 'System Dropdowns & Options Settings'
                : 'System Settings & Universal Configuration'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'RM'
              ? 'Customize your portal font size, language, font style, theme color, and profile picture.'
              : user?.role === 'Admin'
              ? 'Configure banking product line dropdown options and pending document checklist items.'
              : 'Full operational control: Google Sheet connection, reporting week schedule, and banking dropdowns.'}
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
          <span>সেটিংস সফলভাবে সেভ করা হয়েছে (Saved Successfully).</span>
        </div>
      )}

      {/* 1. MENTOR ONLY: Universal Google Sheet & Team Name Configuration */}
      {user?.role === 'Mentor' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sheet className="w-4 h-4 text-emerald-600" />
              <span>Universal Team Name & Google Sheet Configuration (Mentor Exclusive)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Only Mentor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Universal Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => {
                  setTeamName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Team Member Data Management System"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Universal Portal Title
              </label>
              <input
                type="text"
                value={appName}
                onChange={e => {
                  setAppName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="RM File Management & Team Member Data System"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              />
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
                value={googleSpreadsheetId}
                onChange={e => handleSpreadsheetInput(e.target.value)}
                placeholder="Paste full Google Sheet URL OR Spreadsheet ID"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="text"
                  value={appsScriptWebAppUrl}
                  onChange={e => {
                    setAppsScriptWebAppUrl(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                />
              </div>

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
            </div>
          </div>
        </div>
      )}

      {/* 2. MENTOR ONLY: Banking Reporting Week Schedule */}
      {user?.role === 'Mentor' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Banking Reporting Week Schedule (Mentor Exclusive)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Only Mentor
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Define the weekly calculation start day for dashboards, comparative tables, and export summaries.
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
                  onChange={() => {
                    setReportingWeekStart(day);
                    setHasChanges(true);
                  }}
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
      )}

      {/* 3. ADMIN & MENTOR: Dropdown Options Manager */}
      {(user?.role === 'Mentor' || user?.role === 'Admin') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Types Manager */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Product Types Dropdown Options</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Admin & Mentor
              </span>
            </div>

            <div className="space-y-2">
              {productTypes.map(pt => (
                <div key={pt} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <span className="font-semibold text-slate-800">{pt}</span>
                  <button
                    onClick={() => removeProductType(pt)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

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
          </div>

          {/* Pending Document Checklist Options */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Pending Document Checklist Items</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Admin & Mentor
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {pendingDocOptions.map(doc => (
                <div key={doc} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <span className="font-semibold text-slate-800">{doc}</span>
                  <button
                    onClick={() => removePendingDoc(doc)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

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
          </div>
        </div>
      )}

      {/* 4. RM & PERSONAL DISPLAY PREFERENCES (Font size, language, font style, theme color, profile picture) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>Personal Appearance & Display Preferences</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize font size, font style, portal language, theme color, and your profile picture.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {user?.role === 'RM' ? 'RM Personal Access' : 'Personal Display'}
          </span>
        </div>

        {prefSaveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>আপনার ডিসপ্লে ও প্রোফাইল প্রেফারেন্স সফলভাবে সেভ হয়েছে!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Profile Picture Upload & Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Profile Picture (প্রোফাইল ছবি)</span>
            </label>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                {userPrefs.profilePicture ? (
                  <img 
                    src={userPrefs.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                </label>
                {userPrefs.profilePicture && (
                  <button
                    type="button"
                    onClick={() => setUserPrefs(prev => ({ ...prev, profilePicture: '' }))}
                    className="block text-[11px] text-red-600 hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-[10px] text-slate-400">JPG, PNG under 2MB</p>
              </div>
            </div>
          </div>

          {/* Font Size Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Font Size (ফন্ট সাইজ)</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Normal (স্বাভাবিক)' },
                { id: 'medium', label: 'Medium (মাঝারি)' },
                { id: 'large', label: 'Large (বড়)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setUserPrefs(prev => ({ ...prev, fontSize: opt.id as any }))}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition text-center cursor-pointer ${
                    userPrefs.fontSize === opt.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Language (ভাষা)</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en', label: 'English (US)' },
                { id: 'bn', label: 'বাংলা (Bengali)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setUserPrefs(prev => ({ ...prev, language: opt.id as any }))}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition text-center cursor-pointer ${
                    userPrefs.language === opt.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Style Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Font Style (ফন্ট স্টাইল)</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'inter', label: 'Modern Inter', font: 'font-sans' },
                { id: 'roboto', label: 'Clean Roboto', font: 'font-sans' },
                { id: 'poppins', label: 'Rounded Poppins', font: 'font-sans' },
                { id: 'siliguri', label: 'Hind Siliguri', font: 'font-sans' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setUserPrefs(prev => ({ ...prev, fontFamily: opt.id as any }))}
                  className={`p-2 rounded-lg border text-xs font-semibold transition text-center cursor-pointer ${
                    userPrefs.fontFamily === opt.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Color Theme Palette Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5 md:col-span-2 lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Dynamic Color Theme Palettes (ডায়নামিক থিম প্যালেট)</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Choose a preset color palette to instantly restyle your top navigation, table headers, and system accents.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
                Live Dynamic Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
              {Object.values(THEME_PALETTES).map(palette => {
                const isSelected = userPrefs.themeColor === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => {
                      const updated = { ...userPrefs, themeColor: palette.id as any };
                      setUserPrefs(updated);
                      if (user?.username) {
                        saveUserPreferences(user.username, updated);
                      } else {
                        applyUserPreferences(updated);
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-md shadow-slate-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Color Swatch Strip */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      {palette.previewColors.map((col, idx) => (
                        <span
                          key={idx}
                          className="w-4 h-4 rounded-full shadow-2xs border border-white shrink-0"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                      {isSelected && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    {/* Palette Titles & Descriptions */}
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>{palette.name}</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {palette.bnName}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {palette.description}
                      </p>
                    </div>

                    {/* Bottom Preview Bar */}
                    <div 
                      className="mt-3 h-1.5 w-full rounded-full"
                      style={{ background: palette.navbarGradient }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4 text-emerald-200" />
            <span>Save Personal Preferences (সংরক্ষণ করুন)</span>
          </button>
        </div>
      </div>

      {/* BOTTOM SAVE ACTION CARD FOR MENTOR & ADMIN */}
      {user?.role !== 'RM' && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl border border-blue-500/30 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-black flex items-center justify-center sm:justify-start gap-2">
              <Save className="w-5 h-5 text-emerald-400" />
              <span>Save System & Option Settings</span>
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

      {/* STICKY FLOATING SAVE BAR WHEN SYSTEM CHANGES ARE MADE */}
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
