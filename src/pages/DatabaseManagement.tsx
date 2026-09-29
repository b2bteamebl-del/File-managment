import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  Paperclip,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../lib/api.js';
import { CustomerFile, RMProfile, FileAttachment } from '../types/index.js';
import { formatDhakaDateTime, formatDhakaDateOnly } from '../utils/dateTime.js';
import { DocumentViewerModal } from '../components/common/DocumentViewerModal.js';
import { useAuth } from '../context/AuthContext.js';

export const DatabaseManagement: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [rms, setRms] = useState<RMProfile[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 25, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [filterRmCode, setFilterRmCode] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Edit record state
  const [editingFile, setEditingFile] = useState<CustomerFile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [inspectFile, setInspectFile] = useState<CustomerFile | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<FileAttachment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchRecords = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '25',
        includeDeleted: String(includeDeleted),
      };
      if (search.trim()) params.search = search.trim();
      if (filterRmCode !== 'all') params.rmCode = filterRmCode;
      if (filterProduct !== 'all') params.productType = filterProduct;
      if (filterStatus !== 'all') params.applicationStatus = filterStatus;
      if (filterActive !== 'all') params.activeStatus = filterActive;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getFiles(params);
      setFiles(res.data);
      setPagination(res.pagination);
    } catch (e) {
      console.error('Error fetching database:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadMeta() {
      try {
        const [rmsRes, settingsRes] = await Promise.all([
          api.getRMs(),
          api.getSettings(),
        ]);
        setRms(rmsRes);
        setSettings(settingsRes);
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchRecords(1);
  }, [search, filterRmCode, filterProduct, filterStatus, filterActive, startDate, endDate, includeDeleted]);

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    try {
      await api.updateFile(editingFile.fileId, editingFile);
      setIsEditOpen(false);
      setEditingFile(null);
      await fetchRecords(pagination.page);
    } catch (e: any) {
      alert(e.message || 'Failed to update record');
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const isPermanent = user?.role === 'Mentor';
      await api.deleteFile(fileId, isPermanent);
      setDeleteConfirmId(null);
      await fetchRecords(pagination.page);
    } catch (e: any) {
      alert(e.message || 'Failed to delete record');
    }
  };

  const handleExportFiltered = (format: 'xlsx' | 'csv') => {
    const params: Record<string, string> = {};
    if (filterRmCode !== 'all') params.rmCode = filterRmCode;
    if (filterProduct !== 'all') params.productType = filterProduct;
    if (filterStatus !== 'all') params.applicationStatus = filterStatus;
    const exportUrl = api.getExportUrl(format, params);
    window.location.href = exportUrl;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
              Master Ledger
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Global Banking Database Repository</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of all loan and card applications across all banking RMs with complete audit traceability.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExportFiltered('xlsx')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExportFiltered('csv')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => fetchRecords(pagination.page)}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customer, phone, File ID, company..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <select
              value={filterRmCode}
              onChange={e => setFilterRmCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All RM Codes</option>
              {rms.map(r => (
                <option key={r.rmCode} value={r.rmCode}>
                  RM {r.rmCode} ({r.rmName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Products</option>
              {(settings?.productTypes || ['Credit Card', 'B2B', 'Corporate Card', 'Split', 'Limit Enhancement']).map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
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
            <select
              value={filterActive}
              onChange={e => setFilterActive(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">Card Activation (All)</option>
              <option value="Y">Active (Y)</option>
              <option value="N">Inactive (N)</option>
              <option value="C">Cancelled (C)</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
              title="Start Date"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
              title="End Date"
            />
          </div>
        </div>

        {/* Soft-delete switch for Mentor */}
        {user?.role === 'Mentor' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={e => setIncludeDeleted(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="font-semibold">Include Soft-Deleted Records in Ledger View (Mentor Privilege)</span>
            </label>
          </div>
        )}
      </div>

      {/* Main Database Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0F294A] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">File ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-2">Product</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-center">Active</th>
                <th className="py-3 px-2">RM Code</th>
                <th className="py-3 px-2">CPV</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-2 text-center">Sheets</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading database records...</span>
                    </div>
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No database records found matching criteria.
                  </td>
                </tr>
              ) : (
                files.map(file => (
                  <tr key={file.fileId} className={`hover:bg-slate-50 transition ${file.isDeleted ? 'bg-red-50/50 opacity-70' : ''}`}>
                    <td className="py-3 px-3 font-mono font-bold text-blue-800 whitespace-nowrap">
                      {file.fileId}
                      {file.isDeleted && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-red-200 text-red-800 uppercase font-sans">
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {file.customerName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {file.mobile}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={file.companyName}>
                      {file.companyName}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap font-medium">
                      {file.productType}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        file.applicationStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        file.applicationStatus === 'Submitted' ? 'bg-amber-100 text-amber-800' :
                        file.applicationStatus === 'Declined' ? 'bg-rose-100 text-rose-800' :
                        file.applicationStatus === 'Query' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {file.applicationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold">
                      {file.activeStatus}
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {file.rmCode}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap text-[11px] font-semibold">
                      {file.cpvStatus}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDhakaDateOnly(file.createdAt)}
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className={`w-2 h-2 rounded-full inline-block ${
                        file.sheetsSyncStatus === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} title={`Google Sheets Status: ${file.sheetsSyncStatus || 'Pending'}`} />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setInspectFile(file)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingFile({ ...file });
                          setIsEditOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                        title="Edit record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(file.fileId)}
                        className="p-1 text-slate-500 hover:text-red-600 rounded"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Total Records: <strong>{pagination.total}</strong></span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRecords(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchRecords(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Database Record: {editingFile.fileId}</h3>
                <p className="text-xs text-blue-200">Preserves original file ID and created date</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editingFile.customerName}
                  onChange={e => setEditingFile({ ...editingFile, customerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Office / Company Name</label>
                <input
                  type="text"
                  required
                  value={editingFile.companyName}
                  onChange={e => setEditingFile({ ...editingFile, companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    value={editingFile.mobile}
                    onChange={e => setEditingFile({ ...editingFile, mobile: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned RM Code</label>
                  <select
                    value={editingFile.rmCode}
                    onChange={e => setEditingFile({ ...editingFile, rmCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-blue-900"
                  >
                    {rms.map(r => (
                      <option key={r.rmCode} value={r.rmCode}>{r.rmCode} — {r.rmName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product</label>
                  <select
                    value={editingFile.productType}
                    onChange={e => setEditingFile({ ...editingFile, productType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {(settings?.productTypes || ['Credit Card', 'B2B', 'Corporate Card', 'Split', 'Limit Enhancement']).map((p: string) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingFile.applicationStatus}
                    onChange={e => setEditingFile({ ...editingFile, applicationStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg font-bold"
                  >
                    {(settings?.applicationStatuses || [
                      'Collected', 'Submitted', 'Declined', 'Return to Source', 'Approved', 'Query', 'Condition', 'STC'
                    ]).map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Active</label>
                  <select
                    value={editingFile.activeStatus}
                    onChange={e => setEditingFile({ ...editingFile, activeStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CPV Status</label>
                <select
                  value={editingFile.cpvStatus}
                  onChange={e => setEditingFile({ ...editingFile, cpvStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={3}
                  value={editingFile.remarks || ''}
                  onChange={e => setEditingFile({ ...editingFile, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT FILE MODAL */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-bold text-base text-slate-900">{inspectFile.customerName}</h3>
                <p className="text-xs text-blue-600 font-mono">File ID: {inspectFile.fileId}</p>
              </div>
              <button onClick={() => setInspectFile(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <p>RM Code: <strong>{inspectFile.rmCode}</strong></p>
              <p>Product: <strong>{inspectFile.productType}</strong></p>
              <p>Status: <strong>{inspectFile.applicationStatus}</strong></p>
              <p>Active Status: <strong>{inspectFile.activeStatus}</strong></p>
              <p>Mobile: <span className="font-mono">{inspectFile.mobile}</span></p>
              <p>CPV: <strong>{inspectFile.cpvStatus}</strong></p>
              <p className="col-span-2">Company: {inspectFile.companyName}</p>
              <p className="col-span-2">Office: {inspectFile.officeAddress}</p>
              {inspectFile.remarks && <p className="col-span-2 bg-slate-50 p-2 rounded">Remarks: {inspectFile.remarks}</p>}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setInspectFile(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
            <h3 className="font-bold text-base text-red-600 mb-2">Confirm Delete Record</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete file <strong className="font-mono text-slate-900">{deleteConfirmId}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
