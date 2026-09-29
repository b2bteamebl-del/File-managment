import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  FileText, 
  AlertCircle, 
  ShieldCheck, 
  X,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { RMNotification } from '../../types/index.js';
import { formatDhakaDateTime } from '../../utils/dateTime.js';
import { showSystemMobileNotification, playMobileSmsChime } from '../../utils/mobileSoundAndHaptics.js';

interface NotificationBellProps {
  onNavigateToFile?: (fileId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateToFile }) => {
  const [notifications, setNotifications] = useState<RMNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const item = notifications.find(n => n.id === id);
        return item && !item.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch {
      // ignore
    }
  };

  const handleItemClick = (notif: RMNotification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.fileId && onNavigateToFile) {
      setIsOpen(false);
      onNavigateToFile(notif.fileId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white transition cursor-pointer"
        title="Notifications from Admin / Mentor"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-sm ring-2 ring-[#0F294A] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">RM Notifications</h4>
                <p className="text-[10px] text-blue-200">
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'No unread updates'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-xs text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When Admin or Mentor updates or deletes any of your files, you will be notified here immediately.
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const isDelete = notif.action === 'DELETE';
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      notif.isRead 
                        ? 'bg-white hover:bg-slate-50 opacity-80' 
                        : 'bg-blue-50/70 hover:bg-blue-50/90 font-medium'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                      isDelete 
                        ? 'bg-red-100 text-red-600 border border-red-200' 
                        : 'bg-blue-100 text-blue-600 border border-blue-200'
                    }`}>
                      {isDelete ? <Trash2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {notif.title}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          notif.performedByRole === 'Admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {notif.performedByRole}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5 break-words">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatDhakaDateTime(notif.timestamp)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {notif.fileId && (
                            <span className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5">
                              <span>View File</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <button
                            onClick={(e) => handleDelete(notif.id, e)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Dismiss notification"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Mobile SMS test button */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Mobile Alerts &amp; Sound</span>
            <button
              type="button"
              onClick={() => {
                showSystemMobileNotification(
                  '💬 EBL SMS Alert',
                  'Test notification! Your mobile sound and vibration are working properly.'
                );
                api.sendTestSms().catch(() => {});
              }}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
              title="Test SMS alert sound, vibration, and push banner"
            >
              <Sparkles className="w-3 h-3 text-emerald-200" />
              <span>Test Mobile SMS Sound</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
