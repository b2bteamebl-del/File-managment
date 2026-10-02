export interface ThemePalette {
  id: string;
  name: string;
  bnName: string;
  description: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryText: string;
  navbarGradient: string;
  previewColors: [string, string, string, string];
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  navy: {
    id: 'navy',
    name: 'EBL Classic Navy',
    bnName: 'ক্লাসিক নেভি ব্লু (কর্পোরেট ব্যাংকিং)',
    description: 'Traditional premier corporate banking with deep ocean navy & sapphire accents.',
    primary: '#0F294A',
    primaryHover: '#163a69',
    primaryLight: '#E0F2FE',
    primaryText: '#0369A1',
    navbarGradient: 'linear-gradient(135deg, #0F294A 0%, #163a69 60%, #0A192F 100%)',
    previewColors: ['#0F294A', '#1B497E', '#0284C7', '#38BDF8'],
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Islamic Banking',
    bnName: 'ইসলামিক এমারেল্ড গ্রিন (টেকসই ব্যাংকিং)',
    description: 'Serene & prestigious Islamic banking theme with forest jade and mint.',
    primary: '#065F46',
    primaryHover: '#047857',
    primaryLight: '#D1FAE5',
    primaryText: '#065F46',
    navbarGradient: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #022C22 100%)',
    previewColors: ['#064E3B', '#059669', '#10B981', '#6EE7B7'],
  },
  indigo: {
    id: 'indigo',
    name: 'Royal Executive Indigo',
    bnName: 'রয়্যাল এক্সিকিউটিভ ইন্ডিগো (প্রিমিয়াম)',
    description: 'Modern high-tech banking aesthetic featuring royal indigo and amethyst violet.',
    primary: '#3730A3',
    primaryHover: '#4338CA',
    primaryLight: '#EEF2FF',
    primaryText: '#3730A3',
    navbarGradient: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 60%, #0F172A 100%)',
    previewColors: ['#1E1B4B', '#4F46E5', '#6366F1', '#A5B4FC'],
  },
  crimson: {
    id: 'crimson',
    name: 'Prestige Crimson Rose',
    bnName: 'প্রেস্টিজ ক্রিমসন রোজ (লাক্সারি রেড)',
    description: 'Distinguished luxury corporate theme with deep ruby red and rose quartz.',
    primary: '#881337',
    primaryHover: '#9F1239',
    primaryLight: '#FFE4E6',
    primaryText: '#9F1239',
    navbarGradient: 'linear-gradient(135deg, #4C0519 0%, #881337 60%, #1C1917 100%)',
    previewColors: ['#4C0519', '#BE123C', '#E11D48', '#FB7185'],
  },
  amber: {
    id: 'amber',
    name: 'Wealth Premier Gold',
    bnName: 'প্রিমিয়ার গোল্ড ও অ্যাম্বার (ওয়েলথ)',
    description: 'Elite private wealth banking palette with warm amber gold and deep bronze.',
    primary: '#78350F',
    primaryHover: '#92400E',
    primaryLight: '#FEF3C7',
    primaryText: '#92400E',
    navbarGradient: 'linear-gradient(135deg, #451A03 0%, #78350F 60%, #1C1917 100%)',
    previewColors: ['#451A03', '#B45309', '#D97706', '#FBBF24'],
  },
  teal: {
    id: 'teal',
    name: 'Modern FinTech Teal',
    bnName: 'মডার্ন ফিনটেক টিল (সায়ান গ্রিন)',
    description: 'Contemporary digital FinTech palette with cool oceanic cyan & deep teal.',
    primary: '#115E59',
    primaryHover: '#0F766E',
    primaryLight: '#CCFBF1',
    primaryText: '#115E59',
    navbarGradient: 'linear-gradient(135deg, #134E4A 0%, #115E59 60%, #042F2E 100%)',
    previewColors: ['#134E4A', '#0F766E', '#0D9488', '#2DD4BF'],
  },
  slate: {
    id: 'slate',
    name: 'Midnight Deep Slate',
    bnName: 'মিডনাইট ডিপ স্লেট (ডার্ক মোড ফিল)',
    description: 'Minimalist charcoal graphite & dark titanium for sleek, high-focus productivity.',
    primary: '#1E293B',
    primaryHover: '#334155',
    primaryLight: '#F1F5F9',
    primaryText: '#1E293B',
    navbarGradient: 'linear-gradient(135deg, #020617 0%, #0F172A 60%, #1E293B 100%)',
    previewColors: ['#020617', '#0F172A', '#334155', '#64748B'],
  },
};

export interface UserDisplayPreferences {
  fontSize: 'normal' | 'medium' | 'large';
  language: 'en' | 'bn';
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'siliguri';
  themeColor: keyof typeof THEME_PALETTES;
  profilePicture?: string;
}

const DEFAULT_PREFERENCES: UserDisplayPreferences = {
  fontSize: 'normal',
  language: 'en',
  fontFamily: 'inter',
  themeColor: 'navy',
  profilePicture: '',
};

import { api } from '../lib/api.js';

export function getUserPreferences(userOrUsername?: any): UserDisplayPreferences {
  if (userOrUsername && typeof userOrUsername === 'object' && userOrUsername.preferences) {
    return { ...DEFAULT_PREFERENCES, ...userOrUsername.preferences };
  }

  const username = typeof userOrUsername === 'string' ? userOrUsername : userOrUsername?.username;
  const key = `user_pref_${username || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to parse preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveUserPreferences(username: string, prefs: UserDisplayPreferences): void {
  const key = `user_pref_${username || 'default'}`;
  try {
    // 1. Instant local storage update
    localStorage.setItem(key, JSON.stringify(prefs));
    applyUserPreferences(prefs);
    window.dispatchEvent(new CustomEvent('ebl-theme-changed', { detail: prefs }));

    // 2. Permanent Database storage & real-time Google Sheets sync!
    api.saveUserPreferences(prefs).catch(err => {
      console.warn('[Sync] Could not save preferences to remote database:', err);
    });
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

export function applyUserPreferences(prefs: UserDisplayPreferences): void {
  const root = document.documentElement;

  // Apply Font Size
  root.classList.remove('text-size-normal', 'text-size-medium', 'text-size-large');
  if (prefs.fontSize === 'medium') {
    root.style.fontSize = '16.5px';
  } else if (prefs.fontSize === 'large') {
    root.style.fontSize = '18px';
  } else {
    root.style.fontSize = '15px';
  }

  // Apply Font Family
  if (prefs.fontFamily === 'roboto') {
    document.body.style.fontFamily = "'Roboto', 'Inter', sans-serif";
  } else if (prefs.fontFamily === 'poppins') {
    document.body.style.fontFamily = "'Poppins', 'Inter', sans-serif";
  } else if (prefs.fontFamily === 'siliguri') {
    document.body.style.fontFamily = "'Hind Siliguri', 'Inter', sans-serif";
  } else {
    document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
  }

  // Apply Preset Color Palette to CSS Variables
  const palette = THEME_PALETTES[prefs.themeColor] || THEME_PALETTES.navy;
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-primary-hover', palette.primaryHover);
  root.style.setProperty('--color-primary-light', palette.primaryLight);
  root.style.setProperty('--color-primary-text', palette.primaryText);
  root.style.setProperty('--theme-navbar-bg', palette.navbarGradient);

  // Apply Theme Attribute Tags
  root.setAttribute('data-theme', palette.id);
  root.setAttribute('data-lang', prefs.language || 'en');
}
