/**
 * Asia/Dhaka Timezone & Banking Reporting Period Utilities
 * UTC+6, Saturday to Friday reporting week
 */

import { TimeRangeFilter } from '../types/index.js';

export const DHAKA_TIMEZONE = 'Asia/Dhaka';

export function getDhakaNow(): Date {
  // Returns current date adjusted to Asia/Dhaka
  const now = new Date();
  return now;
}

export function formatDhakaDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DHAKA_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export function formatDhakaDateOnly(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DHAKA_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export function getDhakaDateParts(date: Date = new Date()): { year: number; month: number; day: number; dayOfWeek: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: DHAKA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const weekdayStr = getPart('weekday'); // 'Sat', 'Sun', etc.
  const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: parseInt(getPart('year'), 10),
    month: parseInt(getPart('month'), 10), // 1-12
    day: parseInt(getPart('day'), 10),
    dayOfWeek: daysMap[weekdayStr] ?? date.getDay(),
    hour: parseInt(getPart('hour'), 10) || 0,
    minute: parseInt(getPart('minute'), 10) || 0,
  };
}

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
}

export function getPeriodRange(
  period: TimeRangeFilter,
  weekStartDay: 'Saturday' | 'Sunday' | 'Monday' = 'Saturday'
): { start: Date | null; end: Date | null } {
  const now = new Date();
  const dhaka = getDhakaDateParts(now);

  // Helper to create date in Dhaka as ISO string
  const createDhakaDayStart = (year: number, month: number, day: number) => {
    // Format: YYYY-MM-DDTHH:mm:ss+06:00
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return new Date(`${year}-${m}-${d}T00:00:00+06:00`);
  };

  const createDhakaDayEnd = (year: number, month: number, day: number) => {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return new Date(`${year}-${m}-${d}T23:59:59.999+06:00`);
  };

  if (period === 'All Time' || period === 'Custom') {
    return { start: null, end: null };
  }

  if (period === 'Today') {
    return {
      start: createDhakaDayStart(dhaka.year, dhaka.month, dhaka.day),
      end: createDhakaDayEnd(dhaka.year, dhaka.month, dhaka.day),
    };
  }

  if (period === 'This Month') {
    const lastDayOfMonth = new Date(Date.UTC(dhaka.year, dhaka.month, 0)).getUTCDate();
    return {
      start: createDhakaDayStart(dhaka.year, dhaka.month, 1),
      end: createDhakaDayEnd(dhaka.year, dhaka.month, lastDayOfMonth),
    };
  }

  if (period === 'Last Month') {
    let prevYear = dhaka.year;
    let prevMonth = dhaka.month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const lastDayOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    return {
      start: createDhakaDayStart(prevYear, prevMonth, 1),
      end: createDhakaDayEnd(prevYear, prevMonth, lastDayOfPrevMonth),
    };
  }

  // Week calculation (Default Saturday to Friday)
  // Day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const startDayNum = weekStartDay === 'Saturday' ? 6 : weekStartDay === 'Sunday' ? 0 : 1;
  const currentDayOfWeek = dhaka.dayOfWeek;
  
  // Calculate days offset from week start
  let daysSinceStart = (currentDayOfWeek - startDayNum + 7) % 7;
  
  // Today's midnight in UTC epoch
  const todayStart = createDhakaDayStart(dhaka.year, dhaka.month, dhaka.day);

  if (period === 'This Week') {
    const weekStartDate = new Date(todayStart.getTime() - daysSinceStart * 24 * 60 * 60 * 1000);
    const weekEndDate = new Date(weekStartDate.getTime() + (7 * 24 * 60 * 60 * 1000) - 1);
    return { start: weekStartDate, end: weekEndDate };
  }

  if (period === 'Last Week') {
    const lastWeekEndDate = new Date(todayStart.getTime() - daysSinceStart * 24 * 60 * 60 * 1000 - 1);
    const lastWeekStartDate = new Date(lastWeekEndDate.getTime() - 7 * 24 * 60 * 60 * 1000 + 1);
    return { start: lastWeekStartDate, end: lastWeekEndDate };
  }

  return { start: null, end: null };
}

export function isDateInPeriod(
  dateInput: string | Date | undefined,
  period: TimeRangeFilter,
  weekStartDay: 'Saturday' | 'Sunday' | 'Monday' = 'Saturday'
): boolean {
  if (!dateInput) return false;
  if (period === 'All Time' || period === 'Custom') return true;

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;

  const { start, end } = getPeriodRange(period, weekStartDay);
  if (!start || !end) return true;

  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}
