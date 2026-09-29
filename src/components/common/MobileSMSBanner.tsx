import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Bell, ExternalLink, Sparkles, Volume2 } from 'lucide-react';
import { 
  playMobileSmsChime, 
  triggerMobileVibration, 
  requestNotificationPermission 
} from '../../utils/mobileSoundAndHaptics.js';
import { api } from '../../lib/api.js';

interface SMSBannerPayload {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  fileId?: string;
}

export const MobileSMSBanner: React.FC<{ onNavigateToFiles?: (fileId?: string) => void }> = ({ onNavigateToFiles }) => {
  const [currentSms, setCurrentSms] = useState<SMSBannerPayload | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [lastSeenId, setLastSeenId] = useState<string>('');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'default') {
        // Show friendly prompt after 3 seconds on mobile
        const timer = setTimeout(() => setShowPermissionPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  // Listen to custom local SMS notification events
  useEffect(() => {
    const handleCustomSms = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setCurrentSms({
          id: `local_${Date.now()}`,
          title: detail.title,
          body: detail.body,
          timestamp: 'Now',
          fileId: detail.fileId,
        });
        playMobileSmsChime();
        triggerMobileVibration();
      }
    };

    window.addEventListener('ebl-mobile-sms-notification', handleCustomSms);
    return () => window.removeEventListener('ebl-mobile-sms-notification', handleCustomSms);
  }, []);

  // Poll for newly created server notifications for this RM
  useEffect(() => {
    let isInitial = true;

    async function checkForNewUpdates() {
      try {
        const res = await api.getNotifications();
        const unread = (res.notifications || []).filter(n => !n.isRead);
        if (unread.length > 0) {
          const newest = unread[0];
          // If a new notification arrived after mount
          if (!isInitial && newest.id !== lastSeenId) {
            setLastSeenId(newest.id);
            setCurrentSms({
              id: newest.id,
              title: newest.title,
              body: newest.message,
              timestamp: 'Now',
              fileId: newest.fileId,
            });
            playMobileSmsChime();
            triggerMobileVibration();
          } else if (isInitial) {
            setLastSeenId(newest.id);
          }
        }
        isInitial = false;
      } catch {
        // ignore
      }
    }

    checkForNewUpdates();
    const interval = setInterval(checkForNewUpdates, 12000);
    return () => clearInterval(interval);
  }, [lastSeenId]);

  // Auto-dismiss SMS pop-down after 8 seconds
  useEffect(() => {
    if (currentSms) {
      const timeout = setTimeout(() => {
        setCurrentSms(null);
      }, 8500);
      return () => clearTimeout(timeout);
    }
  }, [currentSms]);

  const handleGrantPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm);
    setShowPermissionPrompt(false);
    if (perm === 'granted') {
      playMobileSmsChime();
      triggerMobileVibration();
    }
  };

  const handleBannerClick = () => {
    if (currentSms && onNavigateToFiles) {
      const fileId = currentSms.fileId;
      setCurrentSms(null);
      onNavigateToFiles(fileId);
    } else {
      setCurrentSms(null);
    }
  };

  return (
    <>
      {/* 1. Mobile SMS-Style Heads-Up Notification Banner (Pop-Down Alert) */}
      {currentSms && (
        <div className="fixed top-2 left-2 right-2 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-top-4 duration-300">
          <div 
            onClick={handleBannerClick}
            className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 cursor-pointer hover:bg-slate-900 transition flex items-start gap-3.5 relative overflow-hidden"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-500" />

            {/* SMS Icon Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 text-white mt-0.5">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold tracking-wider uppercase mb-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>SMS ALERT • EBL RM</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal font-mono">
                  {currentSms.timestamp}
                </span>
              </div>

              <h4 className="font-bold text-xs text-white leading-snug line-clamp-1">
                {currentSms.title}
              </h4>

              <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                {currentSms.body}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[10px] text-blue-400 font-bold">
                <span>Tap to view updated file</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSms(null);
              }}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white rounded-lg transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Mobile Permission Prompt Banner (Allow Phone Notifications like SMS) */}
      {showPermissionPrompt && permissionStatus === 'default' && (
        <div className="fixed bottom-3 inset-x-3 sm:left-auto sm:right-4 sm:w-96 z-40 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-blue-500/30 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs text-white">
                মোবাইলে SMS-স্টাইল নোটিফিকেশন চান?
              </h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Admin বা Mentor আপনার ফাইলে কোনো পরিবর্তন বা ডিলিট করলে সাথে সাথে মোবাইলে অ্যালার্ট ও সাউন্ড পেতে নোটিফিকেশন অন করুন।
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGrantPermission}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Allow Mobile Alerts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPermissionPrompt(false)}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs rounded-lg transition cursor-pointer"
                >
                  Not Now
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPermissionPrompt(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
