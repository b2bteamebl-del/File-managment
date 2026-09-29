import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { TimeRangeFilter, KPICounts } from '../types/index.js';
import { DhakaClock } from '../components/common/DhakaClock.js';

export const RMDashboard: React.FC<{ onNavigateToFiles?: () => void }> = ({ onNavigateToFiles }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimeRangeFilter>('This Month');
  const [data, setData] = useState<{
    kpis: KPICounts;
    statusDistribution: Record<string, number>;
    productDistribution: Record<string, number>;
    pendingDocCounts: Record<string, number>;
    totalRecords: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchSummary();
  }, [period]);

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
    { label: 'Pending Docs', value: k.pendingDocuments, icon: FileQuestion, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    { label: 'Active Cards (Y)', value: k.activeCardsY, icon: CreditCard, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Inactive Cards (N)', value: k.inactiveCardsN, icon: CreditCard, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
    { label: 'Cancelled / Closed (C)', value: k.cancelledCardsC, icon: CreditCard, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' },
  ];

  return (
    <div className="space-y-6">
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
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
              onClick={fetchSummary}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
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
              className={`p-3.5 rounded-xl border bg-white shadow-2xs hover:shadow-md transition flex flex-col justify-between ${c.border}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                  {c.label}
                </span>
                <div className={`p-1.5 rounded-lg ${c.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className={`text-2xl font-black tracking-tight ${c.color}`}>
                  {c.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Distribution Section */}
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

        {/* Pending Documents Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Pending Document Backlog</span>
            <span className="text-xs text-red-600 font-semibold">{k.pendingDocuments} Files</span>
          </h3>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-64">
            {Object.entries(data?.pendingDocCounts || {}).length === 0 ? (
              <p className="text-xs text-emerald-600 py-6 text-center font-medium">All documents submitted! No pending docs.</p>
            ) : (
              Object.entries(data?.pendingDocCounts || {}).map(([docName, cnt]) => (
                <div key={docName} className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 border border-red-100 text-xs">
                  <span className="font-medium text-slate-800">{docName}</span>
                  <span className="px-2 py-0.5 bg-red-600 text-white font-bold rounded-full text-[10px]">
                    {cnt}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action footer */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-[#0F294A] rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm">Need to enter or update customer files?</h4>
          <p className="text-xs text-blue-200">Add new card/loan files with CPV, upload documents, and track approval status.</p>
        </div>
        {onNavigateToFiles && (
          <button
            onClick={onNavigateToFiles}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-lg transition shadow-md whitespace-nowrap"
          >
            Go to Customer File Entry & List →
          </button>
        )}
      </div>
    </div>
  );
};
