import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FolderOpen, 
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
  Search,
  ExternalLink,
  Download,
  Filter
} from 'lucide-react';
import { api } from '../lib/api.js';
import { TimeRangeFilter, KPICounts } from '../types/index.js';
import { DhakaClock } from '../components/common/DhakaClock.js';

interface AdminDashboardProps {
  onSelectRMForDrilldown?: (rmCode: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectRMForDrilldown }) => {
  const [period, setPeriod] = useState<TimeRangeFilter>('This Month');
  const [selectedRmFilter, setSelectedRmFilter] = useState<string>('all');
  const [rmList, setRmList] = useState<any[]>([]);
  const [data, setData] = useState<{
    kpis: KPICounts;
    statusDistribution: Record<string, number>;
    productDistribution: Record<string, number>;
    pendingDocCounts: Record<string, number>;
    rmPerformance: any[];
    totalRecords: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchRM, setSearchRM] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, rmsRes] = await Promise.all([
        api.getSummary({ period, rmCode: selectedRmFilter }),
        api.getRMs(),
      ]);
      setData(summaryRes);
      setRmList(rmsRes);
    } catch (err) {
      console.error('Failed to load admin dashboard figures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, selectedRmFilter]);

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
    { label: 'Collected', value: k.collected, icon: FolderOpen, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { label: 'Submitted', value: k.submitted, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Approved', value: k.approved, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Declined', value: k.declined, icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    { label: 'Query', value: k.query, icon: HelpCircle, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Return to Source', value: k.returnToSource, icon: RotateCcw, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: 'Condition', value: k.condition, icon: AlertTriangle, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { label: 'STC', value: k.stc, icon: FileCheck, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
    { label: 'Active Cards', value: k.activeCardsY, icon: CreditCard, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Pending Docs', value: k.pendingDocuments, icon: FileQuestion, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  ];

  const filteredRMTable = (data?.rmPerformance || []).filter(rm => {
    if (!searchRM) return true;
    const q = searchRM.toLowerCase();
    return rm.rmCode.toLowerCase().includes(q) || rm.rmName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                Admin Center
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Global Bank RM Performance Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Unified cross-RM portfolio analytics, real-time file conversion, and risk tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* RM Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedRmFilter}
                onChange={e => setSelectedRmFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              >
                <option value="all">All RMs (Consolidated)</option>
                {rmList.map(r => (
                  <option key={r.rmCode} value={r.rmCode}>
                    {r.rmCode} — {r.rmName}
                  </option>
                ))}
              </select>
            </div>

            {/* Reporting Period Buttons */}
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
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

      {/* RM-Wise Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>RM-Wise Comparative Performance Table</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Period: <strong className="text-slate-800">{period}</strong> • Click any RM row to inspect their files
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchRM}
              onChange={e => setSearchRM(e.target.value)}
              placeholder="Search RM name or code..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0F294A] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">RM Code</th>
                <th className="py-3 px-3">RM Name</th>
                <th className="py-3 px-2 text-center bg-blue-900/40">Total</th>
                <th className="py-3 px-2 text-center">Collected</th>
                <th className="py-3 px-2 text-center">Submitted</th>
                <th className="py-3 px-2 text-center text-emerald-300">Approved</th>
                <th className="py-3 px-2 text-center text-rose-300">Declined</th>
                <th className="py-3 px-2 text-center text-purple-300">Query</th>
                <th className="py-3 px-2 text-center">RTS</th>
                <th className="py-3 px-2 text-center">Cond.</th>
                <th className="py-3 px-2 text-center">STC</th>
                <th className="py-3 px-2 text-center text-green-300">Cards (Y)</th>
                <th className="py-3 px-2 text-center text-red-300">Pending Docs</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRMTable.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400">
                    No RM records match the criteria for this period.
                  </td>
                </tr>
              ) : (
                filteredRMTable.map(rm => (
                  <tr
                    key={rm.rmCode}
                    onClick={() => onSelectRMForDrilldown && onSelectRMForDrilldown(rm.rmCode)}
                    className="hover:bg-blue-50/70 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {rm.rmCode}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {rm.rmName}
                    </td>
                    <td className="py-3 px-2 text-center font-bold bg-blue-50 text-blue-900">
                      {rm.totalFiles}
                    </td>
                    <td className="py-3 px-2 text-center font-medium">{rm.collected}</td>
                    <td className="py-3 px-2 text-center font-medium text-amber-700">{rm.submitted}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-700">{rm.approved}</td>
                    <td className="py-3 px-2 text-center font-medium text-rose-700">{rm.declined}</td>
                    <td className="py-3 px-2 text-center font-medium text-purple-700">{rm.query}</td>
                    <td className="py-3 px-2 text-center font-medium text-orange-700">{rm.returnToSource}</td>
                    <td className="py-3 px-2 text-center font-medium text-yellow-700">{rm.condition}</td>
                    <td className="py-3 px-2 text-center font-medium text-teal-700">{rm.stc}</td>
                    <td className="py-3 px-2 text-center font-bold text-green-700">{rm.activeCardsY}</td>
                    <td className="py-3 px-2 text-center font-bold text-red-700">{rm.pendingDocuments}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRMForDrilldown) onSelectRMForDrilldown(rm.rmCode);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-semibold text-[11px] transition"
                      >
                        <span>Drilldown</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts & Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Overall Status Distribution ({period})</span>
            <span className="text-xs text-slate-500 font-normal">Total: {data?.totalRecords || 0} Files</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(data?.statusDistribution || {}).map(([st, cnt]) => {
              const total = data?.totalRecords || 1;
              const pct = Math.round((cnt / total) * 100);
              return (
                <div key={st}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{st}</span>
                    <span className="font-bold text-slate-900">{cnt} files ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Type Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Product Type Volume ({period})</span>
            <span className="text-xs text-slate-500 font-normal">Banking Lines</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(data?.productDistribution || {}).map(([pt, cnt]) => {
              const total = data?.totalRecords || 1;
              const pct = Math.round((cnt / total) * 100);
              return (
                <div key={pt}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{pt}</span>
                    <span className="font-bold text-slate-900">{cnt} files ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
