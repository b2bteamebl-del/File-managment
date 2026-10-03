import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Printer, 
  Download, 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Edit2, 
  RefreshCw,
  ShieldCheck,
  Check,
  X,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { api } from '../lib/api.js';
import { RMProfile } from '../types/index.js';
import { formatDhakaDateTime } from '../utils/dateTime.js';

export const RMMappingPage: React.FC = () => {
  const [rms, setRms] = useState<(RMProfile & { fileCount: number; approvedCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRM, setEditingRM] = useState<RMProfile | null>(null);

  // New RM form
  const [newRmCode, setNewRmCode] = useState('');
  const [newRmName, setNewRmName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Password reset popup
  const [resetModalData, setResetModalData] = useState<{ rmCode: string; tempPass: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Password visibility and direct editing
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedRmCode, setCopiedRmCode] = useState<string | null>(null);
  const [changePasswordRM, setChangePasswordRM] = useState<RMProfile | null>(null);
  const [newRMDirectPassword, setNewRMDirectPassword] = useState('');

  const handleChangePasswordDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordRM || !newRMDirectPassword.trim()) return;
    try {
      await api.resetRMPassword(changePasswordRM.rmCode, newRMDirectPassword.trim());
      setStatusMessage(`RM ${changePasswordRM.rmCode} এর পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে এবং শিটে সিঙ্ক হয়েছে!`);
      setChangePasswordRM(null);
      setNewRMDirectPassword('');
      fetchRMs();
    } catch (err: any) {
      alert(err.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  const fetchRMs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRMs();
      setRms(data);
    } catch (e: any) {
      console.error('Failed to load RMs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRMs();
  }, []);

  const handleCreateRM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createRM({
        rmCode: newRmCode.trim(),
        rmName: newRmName.trim(),
        mobile: newMobile.trim(),
        email: newEmail.trim(),
        initialPassword: newPassword.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setResetModalData({
        rmCode: res.rmProfile.rmCode,
        tempPass: res.temporaryPassword,
      });
      setStatusMessage(`RM ${res.rmProfile.rmCode} created successfully.`);
      fetchRMs();
      setNewRmCode('');
      setNewRmName('');
      setNewMobile('');
      setNewEmail('');
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to create RM account');
    }
  };

  const handleUpdateRM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRM) return;

    try {
      await api.updateRM(editingRM.rmCode, {
        rmName: editingRM.rmName,
        mobile: editingRM.mobile,
        email: editingRM.email,
      });
      setIsEditModalOpen(false);
      setStatusMessage(`RM ${editingRM.rmCode} updated.`);
      fetchRMs();
    } catch (err: any) {
      alert(err.message || 'Failed to update RM');
    }
  };

  const handleToggleStatus = async (rmCode: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.updateRMStatus(rmCode, nextStatus);
      setStatusMessage(`RM ${rmCode} status set to ${nextStatus}.`);
      fetchRMs();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (rmCode: string) => {
    if (!confirm(`Generate a secure temporary password for RM ${rmCode}?`)) return;
    try {
      const res = await api.resetRMPassword(rmCode);
      setResetModalData({
        rmCode,
        tempPass: res.temporaryPassword,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['RM Code', 'RM Name', 'Mobile', 'Email', 'Status', 'Files', 'Approved', 'Created', 'Last Login'];
    const rows = filteredRMs.map(r => [
      r.rmCode,
      `"${r.rmName}"`,
      r.mobile,
      r.email,
      r.accountStatus,
      r.fileCount,
      r.approvedCount,
      formatDhakaDateTime(r.createdAt),
      formatDhakaDateTime(r.lastLogin),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RM_Team_Mapping_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRMs = rms.filter(r => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.rmCode.toLowerCase().includes(q) ||
      r.rmName.toLowerCase().includes(q) ||
      r.mobile.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>RM Mapping & Account Provisioning</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce unique RM codes, issue credentials securely, activate/deactivate accounts, and synchronize with Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New RM</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1"
            title="Print Table"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={fetchRMs}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl animate-in fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search RM by code (e.g. 104393), name, or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Total Mapped RMs: <strong className="text-slate-900">{rms.length}</strong>
        </div>
      </div>

      {/* RM Mapping Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0F294A] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">RM Code</th>
                <th className="py-3 px-3">Officer Name</th>
                <th className="py-3 px-3">Password (পাসওয়ার্ড)</th>
                <th className="py-3 px-3">Contact Mobile</th>
                <th className="py-3 px-3">Official Email</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Total Files</th>
                <th className="py-3 px-2 text-center text-emerald-300">Approved</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3">Last Login</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRMs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    No RM mapping profiles found.
                  </td>
                </tr>
              ) : (
                filteredRMs.map(rm => (
                  <tr key={rm.rmCode} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-800 whitespace-nowrap">
                      {rm.rmCode}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {rm.rmName}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-50 hover:bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <Key className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="font-semibold text-slate-800 tracking-wider">
                          {visiblePasswords[rm.rmCode] ? (rm.currentPassword || '••••••••') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVisiblePasswords(prev => ({ ...prev, [rm.rmCode]: !prev[rm.rmCode] }))}
                          className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer transition"
                          title={visiblePasswords[rm.rmCode] ? 'Hide Password' : 'Show Password'}
                        >
                          {visiblePasswords[rm.rmCode] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (rm.currentPassword) {
                              navigator.clipboard.writeText(rm.currentPassword);
                              setCopiedRmCode(rm.rmCode);
                              setTimeout(() => setCopiedRmCode(null), 2000);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer transition"
                          title="Copy Password"
                        >
                          {copiedRmCode === rm.rmCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {rm.mobile}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {rm.email}
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rm.accountStatus === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        rm.accountStatus === 'Suspended' ? 'bg-red-100 text-red-800 border border-red-300' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {rm.accountStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold">{rm.fileCount}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-700">{rm.approvedCount}</td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDhakaDateTime(rm.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {rm.lastLogin ? formatDhakaDateTime(rm.lastLogin) : 'Never'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                      {/* Set / Change Password */}
                      <button
                        onClick={() => {
                          setChangePasswordRM(rm);
                          setNewRMDirectPassword(rm.currentPassword || '');
                        }}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold transition cursor-pointer"
                        title="Change Password"
                      >
                        পাসওয়ার্ড
                      </button>

                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleStatus(rm.rmCode, rm.accountStatus)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                          rm.accountStatus === 'Active'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                        title="Toggle Active/Inactive"
                      >
                        {rm.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>

                      {/* Edit RM */}
                      <button
                        onClick={() => {
                          setEditingRM(rm);
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer"
                        title="Edit RM Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => handleResetPassword(rm.rmCode)}
                        className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                        title="Reset RM Password"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW RM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span>Create New RM Mapping</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRM} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RM Code (Unique 6-digit number) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRmCode}
                  onChange={e => setNewRmCode(e.target.value)}
                  placeholder="e.g. 107450"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Officer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRmName}
                  onChange={e => setNewRmName(e.target.value)}
                  placeholder="e.g. Arifur Rahman"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newMobile}
                  onChange={e => setNewMobile(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="officer@ebl.com.bd"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password (Optional — auto-generated if blank)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Leave empty for auto Ebl#<rmCode>"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  Create RM Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RM MODAL */}
      {isEditModalOpen && editingRM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Edit RM: {editingRM.rmCode}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRM} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">RM Name</label>
                <input
                  type="text"
                  required
                  value={editingRM.rmName}
                  onChange={e => setEditingRM({ ...editingRM, rmName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  required
                  value={editingRM.mobile}
                  onChange={e => setEditingRM({ ...editingRM, mobile: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingRM.email}
                  onChange={e => setEditingRM({ ...editingRM, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPORARY PASSWORD DISPLAY POPUP (ONE-TIME VIEW) */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Credentials Issued Securely</h3>
                <p className="text-xs text-slate-500">RM Code: {resetModalData.rmCode}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                One-Time Temporary Password:
              </span>
              <div className="font-mono font-extrabold text-base text-blue-900 select-all tracking-wider bg-white p-2.5 rounded border border-slate-300">
                {resetModalData.tempPass}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                As per banking security protocol, this password will <strong>never</strong> be shown again or stored in plaintext. The RM is forced to change it on their first login.
              </p>
            </div>

            <button
              onClick={() => setResetModalData(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow"
            >
              I Have Recorded the Temporary Password
            </button>
          </div>
        </div>
      )}

      {/* DIRECT CHANGE PASSWORD MODAL */}
      {changePasswordRM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">পাসওয়ার্ড পরিবর্তন: RM {changePasswordRM.rmCode}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setChangePasswordRM(null)} 
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordDirect} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-2">
                  অফিসার: <strong className="text-slate-900">{changePasswordRM.rmName}</strong> (RM Code: {changePasswordRM.rmCode})
                </p>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড প্রদান করুন
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={newRMDirectPassword}
                  onChange={e => setNewRMDirectPassword(e.target.value)}
                  placeholder="যেমন: 123456 বা Ebl#104393"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  এই পাসওয়ার্ডটি সরাসরি ডাটাবেজ ও গুগল শিটের <strong>RM_Mapping</strong> ট্যাবে আপডেট হবে। RM এই পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordRM(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  পাসওয়ার্ড সংরক্ষণ ও শিটে সিঙ্ক
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
