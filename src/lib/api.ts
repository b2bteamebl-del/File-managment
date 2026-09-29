import { CustomerFile, RMProfile, AuditLog, AppSettings, UserRole, User } from '../types/index.js';

const TOKEN_KEY = 'rm_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('ebl_auth_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.statusText}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.error || errJson.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getCurrentUser: () =>
    request<{ user: User }>('/api/auth/me'),

  changePassword: (newPassword: string, currentPassword?: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword }),
    }),

  // Customer Files
  getFiles: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{
      data: CustomerFile[];
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`/api/files?${query}`);
  },

  getFileById: (fileId: string) =>
    request<CustomerFile>(`/api/files/${fileId}`),

  createFile: (fileData: Partial<CustomerFile>) =>
    request<CustomerFile>('/api/files', {
      method: 'POST',
      body: JSON.stringify(fileData),
    }),

  updateFile: (fileId: string, updates: Partial<CustomerFile>) =>
    request<CustomerFile>(`/api/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteFile: (fileId: string, permanent: boolean = false) =>
    request<{ success: boolean; message: string }>(`/api/files/${fileId}?permanent=${permanent}`, {
      method: 'DELETE',
    }),

  uploadAttachment: (fileId: string, payload: { fileName: string; fileType: string; dataUrl: string; category: string }) =>
    request<any>(`/api/files/${fileId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteAttachment: (attachmentId: string) =>
    request<{ success: boolean }>(`/api/files/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),

  getAttachmentPreviewUrl: (attachmentId: string) => {
    const token = getStoredToken();
    return `/api/files/attachments/${attachmentId}/preview?token=${token || ''}`;
  },

  getAttachmentDownloadUrl: (attachmentId: string) => {
    const token = getStoredToken();
    return `/api/files/attachments/${attachmentId}/download?token=${token || ''}`;
  },

  // RM Management
  getRMs: () =>
    request<(RMProfile & { fileCount: number; approvedCount: number })[]>('/api/rms'),

  createRM: (data: { rmCode: string; rmName: string; mobile: string; email: string; officeAddress?: string; initialPassword?: string }) =>
    request<{ message: string; rmProfile: RMProfile; temporaryPassword: string }>('/api/rms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRM: (rmCode: string, data: { rmName?: string; mobile?: string; email?: string }) =>
    request<{ success: boolean; user: any }>(`/api/rms/${rmCode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateRMStatus: (rmCode: string, status: 'Active' | 'Inactive' | 'Suspended') =>
    request<{ success: boolean; message: string }>(`/api/rms/${rmCode}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  resetRMPassword: (rmCode: string, newPassword?: string) =>
    request<{ success: boolean; message: string; temporaryPassword: string }>(`/api/rms/${rmCode}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  // Reports & Summary
  getSummary: (params: { period?: string; rmCode?: string } = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/reports/summary?${query}`);
  },

  getExportUrl: (format: 'csv' | 'xlsx', params: Record<string, string> = {}) => {
    const token = getStoredToken();
    const query = new URLSearchParams({ ...params, format }).toString();
    return `/api/reports/export?${query}`;
  },

  // Settings
  getSettings: () =>
    request<AppSettings>('/api/settings'),

  updateSettings: (updates: Partial<AppSettings>) =>
    request<AppSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Google Sheets Sync
  getSyncStatus: () =>
    request<{
      spreadsheetId: string;
      appsScriptConfigured: boolean;
      lastSyncStatus: string;
      lastSuccessfulSync?: string;
      lastSyncAttempt?: string;
      lastSyncError?: string;
      stats: { totalFiles: number; syncedCount: number; pendingCount: number; failedCount: number };
    }>('/api/sync/status'),

  testSyncConnection: (url?: string, token?: string) =>
    request<any>('/api/sync/test', {
      method: 'POST',
      body: JSON.stringify({ url, token }),
    }),

  triggerSync: () =>
    request<any>('/api/sync/trigger', {
      method: 'POST',
    }),

  // Audit Logs
  getAuditLogs: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<AuditLog[]>(`/api/audit-logs?${query}`);
  },

  // Location Monitoring
  recordLocationPing: (data: { latitude: number; longitude: number; accuracy?: number; address?: string; actionContext?: string }) =>
    request<{ success: boolean; location: any }>('/api/locations/ping', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLatestLocations: () =>
    request<any[]>('/api/locations/latest'),

  getLocationHistory: () =>
    request<any[]>('/api/locations/history'),
};
