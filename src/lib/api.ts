import { CustomerFile, RMProfile, AuditLog, AppSettings, UserRole, User, UserLocation, FileAttachment, RMNotification, SMSLog } from '../types/index.js';

const TOKEN_KEY = 'rm_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('ebl_auth_token') || localStorage.getItem('client_session_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('ebl_auth_token');
  localStorage.removeItem('client_session_user');
  localStorage.removeItem('client_session_token');
  localStorage.removeItem('user');
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
    credentials: 'same-origin',
    headers,
  });

  if (res.status === 401 && !endpoint.includes('/api/auth/login')) {
    clearStoredToken();
  }

  if (!res.ok) {
    let errMsg = `Request failed (${res.status} ${res.statusText || 'Error'})`;
    try {
      const errJson = await res.json();
      if (errJson && (errJson.error || errJson.message)) {
        errMsg = errJson.error || errJson.message;
      }
    } catch {
      // not JSON
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(res.token);
    localStorage.setItem('client_session_user', JSON.stringify(res.user));
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  },

  getCurrentUser: async () => {
    return await request<{ user: User }>('/api/auth/me');
  },

  getUserPreferences: async () => {
    try {
      return await request<{ preferences: any }>('/api/auth/preferences');
    } catch {
      return { preferences: {} };
    }
  },

  saveUserPreferences: async (preferences: any) => {
    try {
      return await request<{ success: boolean; preferences: any; message: string }>('/api/auth/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences),
      });
    } catch (err: any) {
      return { success: false, preferences, message: err.message };
    }
  },

  changePassword: async (newPassword: string, currentPassword?: string, username?: string, isForcedFirstLogin?: boolean) => {
    const res = await request<{ success: boolean; message: string; token?: string; user?: User }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword, username, isForcedFirstLogin }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    if (res.user) {
      localStorage.setItem('client_session_user', JSON.stringify(res.user));
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  // Customer Files
  getFiles: async (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request<{
      data: CustomerFile[];
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`/api/files?${query}`);
  },

  getFileById: async (fileId: string) => {
    return await request<CustomerFile>(`/api/files/${fileId}`);
  },

  createFile: async (fileData: Partial<CustomerFile>) => {
    return await request<CustomerFile>('/api/files', {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  },

  updateFile: async (fileId: string, updates: Partial<CustomerFile>) => {
    return await request<CustomerFile>(`/api/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteFile: async (fileId: string, permanent: boolean = false) => {
    return await request<{ success: boolean; message: string }>(`/api/files/${fileId}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  uploadAttachment: async (fileId: string, payload: { fileName: string; fileType: string; dataUrl: string; category: string }) => {
    return await request<any>(`/api/files/${fileId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteAttachment: async (attachmentId: string) => {
    return await request<{ success: boolean }>(`/api/files/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  },

  getAttachmentPreviewUrl: (attachmentId: string) => {
    const token = getStoredToken();
    return `/api/files/attachments/${attachmentId}/preview?token=${token || ''}`;
  },

  getAttachmentDownloadUrl: (attachmentId: string) => {
    const token = getStoredToken();
    return `/api/files/attachments/${attachmentId}/download?token=${token || ''}`;
  },

  // RM Management
  getRMs: async () => {
    return await request<(RMProfile & { fileCount: number; approvedCount: number })[]>('/api/rms');
  },

  createRM: async (data: { rmCode: string; rmName: string; mobile: string; email: string; officeAddress?: string; initialPassword?: string }) => {
    return await request<{ message: string; rmProfile: RMProfile; temporaryPassword: string }>('/api/rms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRM: async (rmCode: string, data: { rmName?: string; mobile?: string; email?: string }) => {
    return await request<{ success: boolean; user: any }>(`/api/rms/${rmCode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateRMStatus: async (rmCode: string, status: 'Active' | 'Inactive' | 'Suspended') => {
    return await request<{ success: boolean; message: string }>(`/api/rms/${rmCode}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  resetRMPassword: async (rmCode: string, newPassword?: string) => {
    return await request<{ success: boolean; message: string; temporaryPassword: string }>(`/api/rms/${rmCode}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  // Reports & Summary
  getSummary: async (params: { period?: string; rmCode?: string } = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request<any>(`/api/reports/summary?${query}`);
  },

  getExportUrl: (format: 'csv' | 'xlsx' | 'pdf', params: Record<string, string> = {}) => {
    const token = getStoredToken();
    const query = new URLSearchParams({ 
      ...params, 
      format,
      ...(token ? { token } : {})
    }).toString();
    return `/api/reports/export?${query}`;
  },

  downloadExport: async (format: 'csv' | 'xlsx', params: Record<string, string> = {}, defaultFilename?: string): Promise<void> => {
    const token = getStoredToken();
    const query = new URLSearchParams({ ...params, format, ...(token ? { token } : {}) }).toString();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/reports/export?${query}`, { headers });
    if (!res.ok) {
      throw new Error(`Export download failed (${res.status} ${res.statusText})`);
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = defaultFilename || `EBL_Banking_Report_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    }, 200);
  },

  // Settings
  getSettings: async () => {
    return await request<AppSettings>('/api/settings');
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    return await request<AppSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Google Sheets Sync
  getSyncStatus: async () => {
    return await request<{
      spreadsheetId: string;
      appsScriptConfigured: boolean;
      lastSyncStatus: string;
      lastSuccessfulSync?: string;
      lastSyncAttempt?: string;
      lastSyncError?: string;
      stats: { totalFiles: number; syncedCount: number; pendingCount: number; failedCount: number };
    }>('/api/sync/status');
  },

  testSyncConnection: async (url?: string, token?: string) => {
    return await request<any>('/api/sync/test', {
      method: 'POST',
      body: JSON.stringify({ url, token }),
    });
  },

  initSheets: async (url?: string, token?: string) => {
    return await request<any>('/api/sync/init-sheets', {
      method: 'POST',
      body: JSON.stringify({ url, token }),
    });
  },

  triggerSync: async (params?: { url?: string; token?: string }) => {
    return await request<{ success: boolean; message: string; results?: any }>('/api/sync/trigger', {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  },

  getScriptCode: async () => {
    try {
      return await request<{ code: string }>('/api/sync/script-code');
    } catch {
      return { code: '' };
    }
  },

  // Audit Logs
  getAuditLogs: async (params: Record<string, string> = {}): Promise<AuditLog[]> => {
    const query = new URLSearchParams(params).toString();
    return await request<AuditLog[]>(`/api/audit-logs?${query}`);
  },

  // Location Monitoring
  recordLocationPing: async (data: { latitude: number; longitude: number; accuracy?: number; address?: string; actionContext?: string }) => {
    return await request<{ success: boolean; location: any }>('/api/locations/ping', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getLatestLocations: async (): Promise<UserLocation[]> => {
    return await request<UserLocation[]>('/api/locations/latest');
  },

  getLocationHistory: async (): Promise<UserLocation[]> => {
    return await request<UserLocation[]>('/api/locations/history');
  },

  // RM Notifications
  getNotifications: async (): Promise<{ notifications: RMNotification[]; unreadCount: number }> => {
    return await request<{ notifications: RMNotification[]; unreadCount: number }>('/api/notifications');
  },

  markNotificationAsRead: async (id: string): Promise<{ success: boolean }> => {
    return await request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllNotificationsAsRead: async (): Promise<{ success: boolean }> => {
    return await request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },

  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    return await request<{ success: boolean }>(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Mobile SMS Dispatch API
  getSmsLogs: async (): Promise<SMSLog[]> => {
    return await request<SMSLog[]>('/api/sms/logs');
  },

  sendTestSms: async (): Promise<{ success: boolean; message: string; log: SMSLog }> => {
    return await request<{ success: boolean; message: string; log: SMSLog }>('/api/sms/test', {
      method: 'POST',
    });
  },
};
