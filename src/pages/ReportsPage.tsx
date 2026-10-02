import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Filter, 
  Calendar, 
  RefreshCw, 
  FileText,
  ShieldCheck,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { CustomerFile, RMProfile, TimeRangeFilter } from '../types/index.js';
import { formatDhakaDateTime, formatDhakaDateOnly } from '../utils/dateTime.js';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [rms, setRms] = useState<RMProfile[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [period, setPeriod] = useState<TimeRangeFilter>('This Month');
  const [selectedRm, setSelectedRm] = useState<string>('all');
  const [productType, setProductType] = useState<string>('all');
  const [applicationStatus, setApplicationStatus] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [cpvStatus, setCpvStatus] = useState<string>('all');

  useEffect(() => {
    async function loadMeta() {
      try {
        const [settingsRes, rmsRes] = await Promise.all([
          api.getSettings(),
          user?.role !== 'RM' ? api.getRMs() : Promise.resolve([]),
        ]);
        setSettings(settingsRes);
        if (rmsRes) setRms(rmsRes as RMProfile[]);
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, [user]);

  const fetchFilteredFiles = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        limit: '100',
      };
      if (productType !== 'all') params.productType = productType;
      if (applicationStatus !== 'all') params.applicationStatus = applicationStatus;
      if (activeStatus !== 'all') params.activeStatus = activeStatus;
      if (cpvStatus !== 'all') params.cpvStatus = cpvStatus;
      if (user?.role !== 'RM' && selectedRm !== 'all') params.rmCode = selectedRm;

      const res = await api.getFiles(params);
      setFiles(res.data);
    } catch (e) {
      console.error('Failed to load report files:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredFiles();
  }, [selectedRm, productType, applicationStatus, activeStatus, cpvStatus]);

  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    const params: Record<string, string> = {};
    if (selectedRm !== 'all') params.rmCode = selectedRm;
    if (productType !== 'all') params.productType = productType;
    if (applicationStatus !== 'all') params.applicationStatus = applicationStatus;
    const url = api.getExportUrl(format, params);
    if (format === 'pdf') {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Banking Reports & Portfolio Exports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'RM' 
              ? `Filtered portfolio report for RM ${user?.rmCode}. Export to verified Excel and CSV.`
              : 'Enterprise portfolio reports across all team relationship managers and staff.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Generate and download formatted PDF report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF Report (পিডিএফ)</span>
          </button>

          <button
            onClick={() => handleExport('xlsx')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Report Generation Filters</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {user?.role !== 'RM' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target RM</label>
              <select
                value={selectedRm}
                onChange={e => setSelectedRm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value="all">All RMs (Consolidated)</option>
                {rms.map(r => (
                  <option key={r.rmCode} value={r.rmCode}>
                    RM {r.rmCode} ({r.rmName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product Type</label>
            <select
              value={productType}
              onChange={e => setProductType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              <option value="all">All Products</option>
              {(settings?.productTypes || ['Credit Card', 'B2B', 'Corporate Card', 'Split', 'Limit Enhancement']).map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Application Status</label>
            <select
              value={applicationStatus}
              onChange={e => setApplicationStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              <option value="all">All Statuses</option>
              {(settings?.applicationStatuses || [
                'Collected', 'Submitted', 'Declined', 'Return to Source', 'Approved', 'Query', 'Condition', 'STC'
              ]).map((s: string) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Active Status</label>
            <select
              value={activeStatus}
              onChange={e => setActiveStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              <option value="all">Active Card (All)</option>
              <option value="Y">Y — Active</option>
              <option value="N">N — Inactive</option>
              <option value="C">C — Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">CPV Status</label>
            <select
              value={cpvStatus}
              onChange={e => setCpvStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              <option value="all">CPV (All)</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Not Required">Not Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs text-slate-800">
              Live Filtered Records Preview ({files.length} rows)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Timezone: Asia/Dhaka (BST)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0F294A] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">File ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Mobile</th>
                <th className="py-2.5 px-2">Product</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-center">Active</th>
                {user?.role !== 'RM' && <th className="py-2.5 px-2">RM Code</th>}
                <th className="py-2.5 px-2">CPV</th>
                <th className="py-2.5 px-3">Pending Docs</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={user?.role !== 'RM' ? 11 : 10} className="py-8 text-center text-slate-400">
                    Generating report data...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== 'RM' ? 11 : 10} className="py-8 text-center text-slate-400">
                    No files found matching the selected report filters.
                  </td>
                </tr>
              ) : (
                files.map(f => (
                  <tr key={f.fileId} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-800 whitespace-nowrap">{f.fileId}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{f.customerName}</td>
                    <td className="py-2.5 px-3 truncate max-w-xs">{f.companyName}</td>
                    <td className="py-2.5 px-3 font-mono">{f.mobile}</td>
                    <td className="py-2.5 px-2">{f.productType}</td>
                    <td className="py-2.5 px-2 font-semibold">{f.applicationStatus}</td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold">{f.activeStatus}</td>
                    {user?.role !== 'RM' && (
                      <td className="py-2.5 px-2 font-mono text-blue-700 font-semibold">{f.rmCode}</td>
                    )}
                    <td className="py-2.5 px-2 font-semibold">{f.cpvStatus}</td>
                    <td className="py-2.5 px-3 text-red-600 font-medium">
                      {(f.pendingDocuments || []).join(', ') || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDhakaDateOnly(f.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
