import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  Printer, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { CustomerFile, RMProfile } from '../types/index.js';
import { formatDhakaDateTime, formatDhakaDateOnly } from '../utils/dateTime.js';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [rms, setRms] = useState<RMProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Filters
  const [selectedRm, setSelectedRm] = useState<string>('all');
  const [productType, setProductType] = useState<string>('all');
  const [applicationStatus, setApplicationStatus] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [cpvStatus, setCpvStatus] = useState<string>('all');

  // Load RM list for filters (if not RM role)
  useEffect(() => {
    async function loadRms() {
      if (user?.role !== 'RM') {
        try {
          const res = await api.getRMs();
          setRms(res);
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadRms();
  }, [user]);

  // Fetch filtered data
  const fetchFilteredFiles = async () => {
    setIsLoading(true);
    setExportError(null);
    try {
      const params: Record<string, string> = {
        limit: '500', // Fetch comprehensive records for report
      };
      if (selectedRm !== 'all') params.rmCode = selectedRm;
      if (productType !== 'all') params.productType = productType;
      if (applicationStatus !== 'all') params.applicationStatus = applicationStatus;
      if (activeStatus !== 'all') params.activeStatus = activeStatus;
      if (cpvStatus !== 'all') params.cpvStatus = cpvStatus;

      const res = await api.getFiles(params);
      setFiles(res.data);
    } catch (e: any) {
      console.error(e);
      setExportError(e.message || 'Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredFiles();
  }, [selectedRm, productType, applicationStatus, activeStatus, cpvStatus]);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    setExportError(null);
    const params: Record<string, string> = {};
    if (selectedRm !== 'all') params.rmCode = selectedRm;
    if (productType !== 'all') params.productType = productType;
    if (applicationStatus !== 'all') params.applicationStatus = applicationStatus;

    if (format === 'pdf') {
      const url = api.getExportUrl('pdf', params);
      const win = window.open(url, '_blank');
      if (!win) {
        // If popup was blocked by browser sandbox, directly trigger print of the A4 layout
        window.print();
      }
      return;
    }

    try {
      setIsExporting(format);
      await api.downloadExport(
        format, 
        params, 
        `EBL_Banking_Portfolio_Report_${new Date().toISOString().slice(0, 10)}.${format}`
      );
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || 'Export download failed. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // KPIs for quick statistics
  const totalCount = files.length;
  const approvedCount = files.filter(f => f.applicationStatus === 'Approved').length;
  const submittedCount = files.filter(f => f.applicationStatus === 'Submitted').length;
  const activeYCount = files.filter(f => f.activeStatus === 'Y').length;
  const queryCount = files.filter(f => f.applicationStatus === 'Query' || f.applicationStatus === 'Condition').length;

  return (
    <>
      {/* 1. ON-SCREEN INTERACTIVE DASHBOARD VIEW (Hidden during print) */}
      <div className="space-y-6 print:hidden">
        {/* Header & Export Actions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Banking Reports & Portfolio Exports</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {user?.role === 'RM' 
                ? `Filtered portfolio report for RM ${user?.rmCode}. Direct download to official Excel and A4 Print.`
                : 'Enterprise portfolio activity & customer files verified statements across all team officers.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF Report Button */}
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="Open formatted A4 Landscape PDF statement"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download PDF Report (পিডিএফ)</span>
            </button>

            {/* Direct A4 Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="Print official single A4 landscape statement"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print A4 Statement (প্রিন্ট)</span>
            </button>

            {/* Excel (.xlsx) Download Button */}
            <button
              onClick={() => handleExport('xlsx')}
              disabled={isExporting === 'xlsx'}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              {isExporting === 'xlsx' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              <span>{isExporting === 'xlsx' ? 'Downloading...' : 'Excel (.xlsx)'}</span>
            </button>

            {/* CSV Download Button */}
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting === 'csv'}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting === 'csv' ? '...' : 'CSV'}</span>
            </button>
          </div>
        </div>

        {/* Export Error Alert if any */}
        {exportError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Quick KPI Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Filtered Files</span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">{totalCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Approved</span>
            <span className="text-xl font-extrabold text-emerald-800 mt-1 block">{approvedCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Submitted</span>
            <span className="text-xl font-extrabold text-blue-800 mt-1 block">{submittedCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-teal-200 bg-teal-50/20 shadow-2xs">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Active Cards (Y)</span>
            <span className="text-xl font-extrabold text-teal-800 mt-1 block">{activeYCount}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Query / Condition</span>
            <span className="text-xl font-extrabold text-amber-800 mt-1 block">{queryCount}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Report Filter Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {user?.role !== 'RM' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">RM Code</label>
                <select
                  value={selectedRm}
                  onChange={e => setSelectedRm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 font-medium"
                >
                  <option value="all">All RMs (Full Team)</option>
                  {rms.map(r => (
                    <option key={r.rmCode} value={r.rmCode}>
                      {r.rmCode} - {r.rmName}
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
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 font-medium"
              >
                <option value="all">All Products</option>
                <option value="Credit Card">Credit Card</option>
                <option value="B2B">B2B</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="Split">Split</option>
                <option value="Limit Enhancement">Limit Enhancement</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Application Status</label>
              <select
                value={applicationStatus}
                onChange={e => setApplicationStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Collected">Collected</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
                <option value="Query">Query</option>
                <option value="Condition">Condition</option>
                <option value="STC">STC</option>
                <option value="Return to Source">Return to Source</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Active Status (Y/N/C)</label>
              <select
                value={activeStatus}
                onChange={e => setActiveStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 font-medium"
              >
                <option value="all">All Active Statuses</option>
                <option value="Y">Active (Y)</option>
                <option value="N">Inactive (N)</option>
                <option value="C">Cancelled (C)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">CPV Verification</label>
              <select
                value={cpvStatus}
                onChange={e => setCpvStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 font-medium"
              >
                <option value="all">All CPV</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
                <option value="Not Required">Not Required</option>
              </select>
            </div>
          </div>
        </div>

        {/* Screen Data Table Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-800">
              Filtered Records Preview ({files.length} Customer Files)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Timezone: Asia/Dhaka (BST)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="theme-table-header text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">File ID</th>
                  <th className="py-2.5 px-3">CC-number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-2">Product</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-center">Active</th>
                  {user?.role !== 'RM' && <th className="py-2.5 px-2">RM Code</th>}
                  <th className="py-2.5 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={user?.role !== 'RM' ? 10 : 9} className="py-8 text-center text-slate-400">
                      Loading report files...
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role !== 'RM' ? 10 : 9} className="py-8 text-center text-slate-400">
                      No customer files match your report filters.
                    </td>
                  </tr>
                ) : (
                  files.map(f => (
                    <tr key={f.fileId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-800 whitespace-nowrap">{f.fileId}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                        {f.ccNumber ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-800">
                            {f.ccNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{f.customerName}</td>
                      <td className="py-2.5 px-3 truncate max-w-xs">{f.companyName}</td>
                      <td className="py-2.5 px-3 font-mono">{f.mobile}</td>
                      <td className="py-2.5 px-2">{f.productType}</td>
                      <td className="py-2.5 px-2 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.applicationStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          f.applicationStatus === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                          f.applicationStatus === 'Declined' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {f.applicationStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold">{f.activeStatus}</td>
                      {user?.role !== 'RM' && (
                        <td className="py-2.5 px-2 font-mono text-blue-700 font-semibold">{f.rmCode}</td>
                      )}
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

      {/* 2. OFFICIAL BANKING A4 LANDSCAPE PRINT STATEMENT (Visible ONLY during print!) */}
      <div className="hidden print:block print-only-statement">
        {/* Bank Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-[#0F294A] pb-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-[#0F294A] uppercase tracking-tight">
                EASTERN BANK PLC • ASSET & B2B BANKING PORTFOLIO
              </span>
            </div>
            <p className="text-[9px] font-semibold text-slate-600 mt-0.5">
              Team Member Data Management System • Official Verified Portfolio Statement
            </p>
          </div>

          <div className="text-right text-[8.5px] text-slate-700 leading-tight">
            <div><strong>Statement Ref:</strong> EBL/B2B/{new Date().toISOString().slice(0, 10)}</div>
            <div><strong>Generated By:</strong> {user?.name} ({user?.role}{user?.rmCode ? ` • RM ${user?.rmCode}` : ''})</div>
            <div><strong>Printed On:</strong> {formatDhakaDateTime(new Date().toISOString())}</div>
            <div><strong>Scope:</strong> {selectedRm === 'all' ? 'All RMs' : `RM ${selectedRm}`} • {totalCount} Records</div>
          </div>
        </div>

        {/* Compact KPI Summary Strip */}
        <div className="grid grid-cols-5 gap-2 mb-2 text-[8.5px]">
          <div className="bg-slate-50 border border-slate-300 border-l-3 border-l-[#0F294A] p-1.5 rounded">
            <span className="text-[7.5px] uppercase font-bold text-slate-500 block">Total Files</span>
            <span className="text-xs font-black text-[#0F294A] block">{totalCount}</span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-200 border-l-3 border-l-emerald-600 p-1.5 rounded">
            <span className="text-[7.5px] uppercase font-bold text-emerald-700 block">Approved</span>
            <span className="text-xs font-black text-emerald-800 block">{approvedCount}</span>
          </div>
          <div className="bg-blue-50/50 border border-blue-200 border-l-3 border-l-blue-600 p-1.5 rounded">
            <span className="text-[7.5px] uppercase font-bold text-blue-700 block">Submitted</span>
            <span className="text-xs font-black text-blue-800 block">{submittedCount}</span>
          </div>
          <div className="bg-teal-50/50 border border-teal-200 border-l-3 border-l-teal-600 p-1.5 rounded">
            <span className="text-[7.5px] uppercase font-bold text-teal-700 block">Active Cards (Y)</span>
            <span className="text-xs font-black text-teal-800 block">{activeYCount}</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-200 border-l-3 border-l-amber-600 p-1.5 rounded">
            <span className="text-[7.5px] uppercase font-bold text-amber-700 block">Query / Condition</span>
            <span className="text-xs font-black text-amber-800 block">{queryCount}</span>
          </div>
        </div>

        {/* Formatted Data Table (Engineered to fit cleanly across A4 Landscape) */}
        <table className="w-full border-collapse border border-slate-300 text-[8px]">
          <thead>
            <tr className="bg-[#0F294A] text-white uppercase text-[7.5px] tracking-wider">
              <th className="p-1 border border-[#0F294A] text-center w-7">SL</th>
              <th className="p-1 border border-[#0F294A] text-left">File ID</th>
              <th className="p-1 border border-[#0F294A] text-left">CC-number</th>
              <th className="p-1 border border-[#0F294A] text-left">Customer Name</th>
              <th className="p-1 border border-[#0F294A] text-left">Company Name</th>
              <th className="p-1 border border-[#0F294A] text-left">Mobile</th>
              <th className="p-1 border border-[#0F294A] text-left">Product</th>
              <th className="p-1 border border-[#0F294A] text-center">Status</th>
              <th className="p-1 border border-[#0F294A] text-center">Active</th>
              {user?.role !== 'RM' && <th className="p-1 border border-[#0F294A] text-center">RM</th>}
              <th className="p-1 border border-[#0F294A] text-right">Created</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f, idx) => (
              <tr key={f.fileId} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="p-1 border border-slate-300 text-center text-slate-500 font-semibold">{idx + 1}</td>
                <td className="p-1 border border-slate-300 font-mono font-bold text-blue-900 whitespace-nowrap">{f.fileId}</td>
                <td className="p-1 border border-slate-300 font-mono font-bold whitespace-nowrap">{f.ccNumber || '—'}</td>
                <td className="p-1 border border-slate-300 font-bold text-slate-900">{f.customerName}</td>
                <td className="p-1 border border-slate-300 truncate max-w-[120px]">{f.companyName}</td>
                <td className="p-1 border border-slate-300 font-mono whitespace-nowrap">{f.mobile}</td>
                <td className="p-1 border border-slate-300 whitespace-nowrap">{f.productType}</td>
                <td className="p-1 border border-slate-300 text-center whitespace-nowrap font-bold">
                  {f.applicationStatus}
                </td>
                <td className="p-1 border border-slate-300 text-center font-bold">{f.activeStatus}</td>
                {user?.role !== 'RM' && <td className="p-1 border border-slate-300 text-center font-mono">{f.rmCode}</td>}
                <td className="p-1 border border-slate-300 text-right whitespace-nowrap text-slate-600">
                  {formatDhakaDateOnly(f.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 3 Authorized Signatures Section */}
        <div className="grid grid-cols-3 gap-8 mt-6 pt-6 border-t border-slate-300 text-[8px] text-slate-700">
          <div className="text-center border-t border-slate-400 pt-1">
            <strong>Prepared By:</strong>
            <p className="text-[7.5px] text-slate-500">Relationship Manager / Portfolio Officer</p>
          </div>
          <div className="text-center border-t border-slate-400 pt-1">
            <strong>Verified & Audited By:</strong>
            <p className="text-[7.5px] text-slate-500">Team Mentor / Quality Assurance Officer</p>
          </div>
          <div className="text-center border-t border-slate-400 pt-1">
            <strong>Authorized Signatory:</strong>
            <p className="text-[7.5px] text-slate-500">Branch Operations / Head of B2B Banking</p>
          </div>
        </div>

        {/* Official Security Footer */}
        <div className="mt-3 text-center text-[7px] text-slate-400 border-t border-dashed border-slate-200 pt-1 uppercase">
          CONFIDENTIAL & PROPRIETARY • BANKING ASSET AUDIT REPORT • EASTERN BANK PLC • DHAKA, BANGLADESH
        </div>
      </div>
    </>
  );
};
