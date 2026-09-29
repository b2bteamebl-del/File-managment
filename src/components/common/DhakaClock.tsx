import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatDhakaDateTime } from '../../utils/dateTime.js';

export const DhakaClock: React.FC<{ showReportingBadge?: boolean }> = ({ showReportingBadge = true }) => {
  const [timeStr, setTimeStr] = useState<string>(formatDhakaDateTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatDhakaDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 rounded-md border border-slate-700/60 text-xs text-slate-200">
      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight">
        <span className="font-mono font-medium tracking-tight text-white">{timeStr}</span>
        <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/50">
          Dhaka (BST)
        </span>
      </div>
      {showReportingBadge && (
        <span className="hidden lg:inline-block text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
          Sat–Fri Week
        </span>
      )}
    </div>
  );
};
