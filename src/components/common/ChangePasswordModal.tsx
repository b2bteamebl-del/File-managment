import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isForcedFirstLogin?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isForcedFirstLogin = false,
}) => {
  const { user, updateUserLocal } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    if (!isForcedFirstLogin && !currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.changePassword(newPassword, isForcedFirstLogin ? undefined : currentPassword);
      setSuccess(res.message || 'Password changed successfully!');
      updateUserLocal({ mustChangePassword: false });
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 text-white flex items-center gap-3 ${isForcedFirstLogin ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <div className="p-2 bg-white/20 rounded-lg">
            {isForcedFirstLogin ? <ShieldAlert className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="font-semibold text-base">
              {isForcedFirstLogin ? 'Initial Security Setup Required' : 'Change Password'}
            </h3>
            <p className="text-xs text-white/80">
              {isForcedFirstLogin
                ? 'Security policy requires a new password on your first login.'
                : 'Keep your account secure with a strong password.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!isForcedFirstLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            {!isForcedFirstLogin && onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
