import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Filter, RefreshCw, ShieldCheck, User, Clock } from 'lucide-react';
import { api } from '../lib/api.js';
import { AuditLog } from '../types/index.js';
import { formatDhakaDateTime } from '../utils/dateTime.js';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchUser, setSearchUser] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter !== 'all') params.action = actionFilter;
      if (searchUser.trim()) params.username = searchUser.trim();
      const data = await api.getAuditLogs(params);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, searchUser]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DELETE': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'LOGIN': return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'PASSWORD_CHANGE': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'EXPORT': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SHEETS_SYNC': return 'bg-teal-100 text-teal-800 border-teal-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-600" />
            <span>Audit Trail & Security Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable regulatory tracking of all system modifications, record entries, deletions, exports, and authentications.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200 self-start sm:self-auto"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            placeholder="Search by username or RM Code..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Action:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
            <option value="EXPORT">EXPORT</option>
            <option value="SHEETS_SYNC">SHEETS_SYNC</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0F294A] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Timestamp (Dhaka BST)</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2">Action</th>
                <th className="py-3 px-2">File ID</th>
                <th className="py-3 px-2">RM Code</th>
                <th className="py-3 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">No audit records found.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {formatDhakaDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.username}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="font-semibold text-slate-600">{log.role}</span>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-blue-700 font-bold whitespace-nowrap">
                      {log.fileId || '—'}
                    </td>
                    <td className="py-3 px-2 font-mono text-indigo-700 whitespace-nowrap">
                      {log.rmCode || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {log.details}
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
