import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  AlertTriangle, 
  FileCheck, 
  CreditCard, 
  FileQuestion,
  RefreshCw,
  FolderOpen,
  Bell,
  Check,
  Search,
  ExternalLink,
  Phone,
  Building,
  AlertCircle,
  X,
  Sparkles,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { TimeRangeFilter, KPICounts, CustomerFile, RMNotification } from '../types/index.js';
import { formatDhakaDateTime } from '../utils/dateTime.js';
import { showSystemMobileNotification } from '../utils/mobileSoundAndHaptics.js';

export const RMDashboard: React.FC<{ onNavigateToFiles?: () => void }> = ({ onNavigateToFiles }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimeRangeFilter>('This Month');
  const [data, setData] = useState<{
    kpis: KPICounts;
    statusDistribution: Record<string, number>;
    productDistribution: Record<string, number>;
    pendingDocCounts: Record<string, number>;
    pendingDocFiles?: CustomerFile[];
    totalRecords: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pending Documents List state
  const [allPendingFiles, setAllPendingFiles] = useState<CustomerFile[]>([]);
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('all');
  const [pendingSearch, setPendingSearch] = useState<string>('');
  const [isLoadingPendingFiles, setIsLoadingPendingFiles] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<RMNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pendingSectionRef = useRef<HTMLDivElement>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSummary({ period });
      setData(res);
    } catch (err) {
      console.error('Failed to load RM summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingFiles = async () => {
    setIsLoadingPendingFiles(true);
    try {
      // Fetch files with pending documents for this RM
      const res = await api.getFiles({ limit: '100', pendingDoc: 'has_pending' });
      setAllPendingFiles(res.data || []);
    } catch (err) {
      console.error('Failed to load pending files:', err);
    } finally {
      setIsLoadingPendingFiles(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [period]);

  useEffect(() => {
    fetchPendingFiles();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const scrollToPendingDocs = () => {
    if (pendingSectionRef.current) {
      pendingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const periods: TimeRangeFilter[] = ['Today', 'This Week', 'Last Week', 'This Month', 'Last Month', 'All Time'];

  const k = data?.kpis || {
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

  const kpiCards = [
    { label: 'Total Files', value: k.totalFiles, icon: FolderOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Collected', value: k.collected, icon: FileText, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { label: 'Submitted', value: k.submitted, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Approved', value: k.approved, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Declined', value: k.declined, icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    { label: 'Query', value: k.query, icon: HelpCircle, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Return to Source', value: k.returnToSource, icon: RotateCcw, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: 'Condition', value: k.condition, icon: AlertTriangle, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { label: 'STC', value: k.stc, icon: FileCheck, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
    { 
      label: 'Pending Docs', 
      value: k.pendingDocuments, 
      icon: FileQuestion, 
      color: 'text-red-700', 
      bg: 'bg-red-50', 
      border: 'border-red-300 ring-2 ring-red-100', 
      isClickable: true,
      onClick: scrollToPendingDocs
    },
    { label: 'Active Cards (Y)', value: k.activeCardsY, icon: CreditCard, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Inactive Cards (N)', value: k.inactiveCardsN, icon: CreditCard, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
    { label: 'Cancelled / Closed (C)', value: k.cancelledCardsC, icon: CreditCard, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' },
  ];

  // Filter pending files based on selected doc filter and search
  const filteredPendingFiles = allPendingFiles.filter(file => {
    // Document type filter
    if (selectedDocFilter !== 'all') {
      if (!file.pendingDocuments || !file.pendingDocuments.includes(selectedDocFilter)) {
        return false;
      }
    }
    // Search query filter
    if (pendingSearch.trim()) {
      const q = pendingSearch.trim().toLowerCase();
      const matchName = file.customerName?.toLowerCase().includes(q);
      const matchComp = file.companyName?.toLowerCase().includes(q);
      const matchId = file.fileId?.toLowerCase().includes(q);
      const matchPhone = file.mobile?.includes(q);
      if (!matchName && !matchComp && !matchId && !matchPhone) {
        return false;
      }
    }
    return true;
  });

  // Unique pending document categories from files
  const availablePendingDocs = Array.from(
    new Set(allPendingFiles.flatMap(f => f.pendingDocuments || []))
  );

  // Unread notifications for RM banner
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="space-y-6">
      {/* REAL-TIME ADMIN / MENTOR UPDATE NOTIFICATION BANNER */}
      {unreadNotifications.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 rounded-xl shadow-md border border-amber-400/50 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-lg shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase tracking-wide">
                  Admin &amp; Mentor Update Alert
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-orange-800 text-[10px] font-black">
                  {unreadNotifications.length} New Update{unreadNotifications.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-amber-50 mt-0.5 leading-relaxed font-medium">
                {unreadNotifications[0].message}
              </p>
              <div className="text-[10px] text-amber-100 font-mono mt-1">
                Updated at: {formatDhakaDateTime(unreadNotifications[0].timestamp)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {onNavigateToFiles && (
              <button
                onClick={onNavigateToFiles}
                className="px-3 py-1.5 bg-white text-orange-900 hover:bg-amber-50 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>View Portfolio Files</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => handleMarkNotificationRead(unreadNotifications[0].id)}
              className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Mark as read"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Banner with RM details & Time Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                RM Workspace
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {user?.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assigned RM Code: <strong className="font-mono text-slate-800">{user?.rmCode}</strong> • Strictly Isolated Portfolio
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 flex-wrap">
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                showSystemMobileNotification(
                  '💬 EBL Mobile SMS Alert',
                  'Sound & vibration test successful! Mobile SMS-style notifications are active.'
                );
                api.sendTestSms().catch(() => {});
              }}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Test SMS alert sound and device vibration"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Test Mobile Alert</span>
            </button>

            <button
              onClick={() => {
                fetchSummary();
                fetchPendingFiles();
                fetchNotifications();
              }}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200 cursor-pointer"
              title="Refresh Figures"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpiCards.map(c => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              onClick={c.isClickable ? c.onClick : undefined}
              className={`p-3.5 rounded-xl border bg-white shadow-2xs hover:shadow-md transition flex flex-col justify-between ${c.border} ${c.isClickable ? 'cursor-pointer hover:border-red-400 ring-offset-1' : ''}`}
              title={c.isClickable ? 'Click to view all files with pending documents' : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                  {c.label}
                </span>
                <div className={`p-1.5 rounded-lg ${c.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className={`text-2xl font-black tracking-tight ${c.color}`}>
                  {c.value}
                </span>
                {c.isClickable && (
                  <span className="text-[10px] text-red-600 font-bold hover:underline">
                    View Files ↓
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS & DISTRIBUTION SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>File Status Distribution</span>
            <span className="text-xs text-slate-400 font-normal">({period})</span>
          </h3>
          <div className="mt-4 space-y-2.5">
            {Object.entries(data?.statusDistribution || {}).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No files recorded for this period.</p>
            ) : (
              Object.entries(data?.statusDistribution || {}).map(([st, cnt]) => {
                const total = data?.totalRecords || 1;
                const pct = Math.round((cnt / total) * 100);
                return (
                  <div key={st}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{st}</span>
                      <span className="font-semibold text-slate-900">{cnt} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product Type Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Product Type Breakdown</span>
            <span className="text-xs text-slate-400 font-normal">({period})</span>
          </h3>
          <div className="mt-4 space-y-2.5">
            {Object.entries(data?.productDistribution || {}).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No files recorded for this period.</p>
            ) : (
              Object.entries(data?.productDistribution || {}).map(([pt, cnt]) => {
                const total = data?.totalRecords || 1;
                const pct = Math.round((cnt / total) * 100);
                return (
                  <div key={pt}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{pt}</span>
                      <span className="font-semibold text-slate-900">{cnt} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Documents Backlog Categories */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Pending Document Types</span>
            <span className="text-xs text-red-600 font-bold">{k.pendingDocuments} Missing Docs</span>
          </h3>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-64">
            {Object.entries(data?.pendingDocCounts || {}).length === 0 ? (
              <p className="text-xs text-emerald-600 py-6 text-center font-medium">
                All documents submitted! No pending documents in this period.
              </p>
            ) : (
              Object.entries(data?.pendingDocCounts || {}).map(([docName, cnt]) => (
                <div
                  key={docName}
                  onClick={() => {
                    setSelectedDocFilter(docName);
                    scrollToPendingDocs();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-red-50/70 hover:bg-red-100/80 border border-red-200 text-xs cursor-pointer transition"
                  title="Click to filter files below by this document"
                >
                  <span className="font-semibold text-slate-800">{docName}</span>
                  <span className="px-2 py-0.5 bg-red-600 text-white font-black rounded-full text-[10px]">
                    {cnt}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED FILES WITH PENDING DOCUMENTS LIST SECTION */}
      <div 
        ref={pendingSectionRef}
        className="bg-white rounded-2xl border-2 border-red-200 shadow-md overflow-hidden space-y-0"
      >
        {/* Section Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold mb-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-200" />
              <span>Pending Documents Action Center / পেন্ডিং ডকুমেন্ট তালিকা</span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-red-200" />
              <span>Files with Pending Documents ({allPendingFiles.length})</span>
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              Below is the comprehensive list of your customer files that have missing or pending documents.
            </p>
          </div>

          {onNavigateToFiles && (
            <button
              onClick={onNavigateToFiles}
              className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Manage in Full File List</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Document Type Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedDocFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDocFilter === 'all'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              All Files ({allPendingFiles.length})
            </button>

            {availablePendingDocs.map(doc => {
              const count = allPendingFiles.filter(f => f.pendingDocuments?.includes(doc)).length;
              return (
                <button
                  key={doc}
                  onClick={() => setSelectedDocFilter(doc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedDocFilter === doc
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-red-50 border border-slate-300'
                  }`}
                >
                  <span>{doc}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedDocFilter === doc ? 'bg-white text-red-700 font-black' : 'bg-red-100 text-red-700 font-bold'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={pendingSearch}
              onChange={e => setPendingSearch(e.target.value)}
              placeholder="Search customer, ID, mobile..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            {pendingSearch && (
              <button
                onClick={() => setPendingSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Files Table / Cards */}
        {isLoadingPendingFiles ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            <span className="text-xs font-medium">Loading pending documents...</span>
          </div>
        ) : filteredPendingFiles.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {allPendingFiles.length === 0 
                ? 'No Pending Documents Found!' 
                : 'No files match this filter'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {allPendingFiles.length === 0 
                ? 'All customer files in your portfolio have complete documentation submitted.' 
                : 'Try selecting "All Files" or clearing your search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">File ID</th>
                  <th className="py-3 px-4">Customer &amp; Company</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-red-700">Missing / Pending Documents</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPendingFiles.map(file => (
                  <tr key={file.fileId} className="hover:bg-red-50/40 transition">
                    {/* File ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {file.fileId}
                    </td>

                    {/* Customer & Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{file.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{file.companyName || 'Individual'}</span>
                      </div>
                      {file.mobile && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <a href={`tel:${file.mobile}`} className="hover:underline font-mono">
                            {file.mobile}
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {file.productType}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        file.applicationStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        file.applicationStatus === 'Submitted' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        file.applicationStatus === 'Query' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        file.applicationStatus === 'Condition' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        {file.applicationStatus}
                      </span>
                    </td>

                    {/* Missing Documents Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {file.pendingDocuments && file.pendingDocuments.length > 0 ? (
                          file.pendingDocuments.map(doc => (
                            <span
                              key={doc}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-300 text-[11px] font-semibold"
                            >
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>{doc}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {onNavigateToFiles && (
                        <button
                          onClick={onNavigateToFiles}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Resolve File</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Footer */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-[#0F294A] rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm">Need to enter or update customer files?</h4>
          <p className="text-xs text-blue-200">
            Add new card/loan files with CPV, upload documents, and track approval status.
          </p>
        </div>
        {onNavigateToFiles && (
          <button
            onClick={onNavigateToFiles}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-lg transition shadow-md whitespace-nowrap cursor-pointer"
          >
            Go to Customer File Entry &amp; List →
          </button>
        )}
      </div>
    </div>
  );
};
