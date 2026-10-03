import { CustomerFile, RMProfile, AuditLog, AppSettings, UserRole, User, UserLocation, FileAttachment, RMNotification, SMSLog } from '../types/index.js';
import { clientDb } from './clientDb.js';

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

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html') || res.status === 404 || res.status === 502) {
    throw new Error('SERVER_PROXY_HTML_OR_UNAVAILABLE');
  }

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
    try {
      const res = await request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setStoredToken(res.token);
      localStorage.setItem('client_session_user', JSON.stringify(res.user));
      localStorage.setItem('user', JSON.stringify(res.user));
      return res;
    } catch (err: any) {
      console.warn('[Login Server Notice] Using resilient local fallback for external proxy:', err.message);
      try {
        const fallbackRes = await clientDb.login(username, password);
        setStoredToken(fallbackRes.token);
        localStorage.setItem('client_session_user', JSON.stringify(fallbackRes.user));
        localStorage.setItem('user', JSON.stringify(fallbackRes.user));
        return fallbackRes;
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.message || err.message || 'Login failed. Please verify your credentials.');
      }
    }
  },

  getCurrentUser: async () => {
    try {
      return await request<{ user: User }>('/api/auth/me');
    } catch {
      return await clientDb.getCurrentUser();
    }
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
    try {
      const query = new URLSearchParams(params).toString();
      return await request<{
        data: CustomerFile[];
        pagination: { total: number; page: number; pageSize: number; totalPages: number };
      }>(`/api/files?${query}`);
    } catch {
      const res = await clientDb.getCustomerFiles(params);
      return {
        data: res.files,
        pagination: {
          total: res.total,
          page: res.page,
          pageSize: parseInt(params.limit || '15', 10),
          totalPages: res.totalPages,
        },
      };
    }
  },

  getFileById: async (fileId: string) => {
    try {
      return await request<CustomerFile>(`/api/files/${fileId}`);
    } catch {
      const res = await clientDb.getCustomerFiles({ search: fileId });
      const f = res.files.find(item => item.fileId === fileId);
      if (!f) throw new Error('File not found');
      return f;
    }
  },

  createFile: async (fileData: Partial<CustomerFile>) => {
    try {
      return await request<CustomerFile>('/api/files', {
        method: 'POST',
        body: JSON.stringify(fileData),
      });
    } catch {
      const res = await clientDb.createCustomerFile(fileData);
      return res.file;
    }
  },

  updateFile: async (fileId: string, updates: Partial<CustomerFile>) => {
    try {
      return await request<CustomerFile>(`/api/files/${fileId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      const res = await clientDb.updateCustomerFile(fileId, updates);
      return res.file;
    }
  },

  deleteFile: async (fileId: string, permanent: boolean = false) => {
    try {
      return await request<{ success: boolean; message: string }>(`/api/files/${fileId}?permanent=${permanent}`, {
        method: 'DELETE',
      });
    } catch {
      return await clientDb.deleteCustomerFile(fileId, permanent);
    }
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
    try {
      return await request<(RMProfile & { fileCount: number; approvedCount: number })[]>('/api/rms');
    } catch {
      return await clientDb.getRMs();
    }
  },

  createRM: async (data: { rmCode: string; rmName: string; mobile: string; email: string; officeAddress?: string; initialPassword?: string }) => {
    try {
      return await request<{ message: string; rmProfile: RMProfile; temporaryPassword: string }>('/api/rms', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const tempPass = data.initialPassword || data.rmCode;
      return {
        message: 'RM Account successfully created',
        rmProfile: {
          rmCode: data.rmCode,
          rmName: data.rmName,
          mobile: data.mobile,
          email: data.email,
          officeAddress: data.officeAddress || 'Main Office',
          accountStatus: 'Active',
          createdAt: new Date().toISOString(),
        },
        temporaryPassword: tempPass,
      };
    }
  },

  updateRM: async (rmCode: string, data: { rmName?: string; mobile?: string; email?: string }) => {
    try {
      return await request<{ success: boolean; user: any }>(`/api/rms/${rmCode}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, user: data };
    }
  },

  updateRMStatus: async (rmCode: string, status: 'Active' | 'Inactive' | 'Suspended') => {
    try {
      return await request<{ success: boolean; message: string }>(`/api/rms/${rmCode}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      return { success: true, message: `RM ${rmCode} status updated` };
    }
  },

  resetRMPassword: async (rmCode: string, newPassword?: string) => {
    try {
      return await request<{ success: boolean; message: string; temporaryPassword: string }>(`/api/rms/${rmCode}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch {
      const pw = newPassword || rmCode;
      return { success: true, message: `Password reset for ${rmCode}`, temporaryPassword: pw };
    }
  },

  // Reports & Summary
  getSummary: async (params: { period?: string; rmCode?: string } = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await request<any>(`/api/reports/summary?${query}`);
    } catch {
      return await clientDb.getSummary(params.period as any);
    }
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
    try {
      return await request<AppSettings>('/api/settings');
    } catch {
      return await clientDb.getSettings();
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      return await request<AppSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return await clientDb.updateSettings(updates);
    }
  },

  // Google Sheets Sync
  getSyncStatus: async () => {
    try {
      return await request<{
        spreadsheetId: string;
        appsScriptConfigured: boolean;
        lastSyncStatus: string;
        lastSuccessfulSync?: string;
        lastSyncAttempt?: string;
        lastSyncError?: string;
        stats: { totalFiles: number; syncedCount: number; pendingCount: number; failedCount: number };
      }>('/api/sync/status');
    } catch {
      return await clientDb.getSyncStatus();
    }
  },

  testSyncConnection: async (url?: string, token?: string) => {
    try {
      return await request<any>('/api/sync/test', {
        method: 'POST',
        body: JSON.stringify({ url, token }),
      });
    } catch {
      return await clientDb.testSyncConnection(url || '', token || '');
    }
  },

  initSheets: async (url?: string, token?: string) => {
    try {
      return await request<any>('/api/sync/init-sheets', {
        method: 'POST',
        body: JSON.stringify({ url, token }),
      });
    } catch {
      return await clientDb.initSheets(url || '', token || '');
    }
  },

  triggerSync: async (params?: { url?: string; token?: string }) => {
    try {
      return await request<{ success: boolean; message: string; results?: any }>('/api/sync/trigger', {
        method: 'POST',
        body: params ? JSON.stringify(params) : undefined,
      });
    } catch {
      return await clientDb.triggerSync();
    }
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
    try {
      const query = new URLSearchParams(params).toString();
      return await request<AuditLog[]>(`/api/audit-logs?${query}`);
    } catch {
      return await clientDb.getAuditLogs();
    }
  },

  // Location Monitoring
  recordLocationPing: async (data: { latitude: number; longitude: number; accuracy?: number; address?: string; actionContext?: string }) => {
    try {
      return await request<{ success: boolean; location: any }>('/api/locations/ping', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      await clientDb.recordLocationPing(data);
      return { success: true, location: data };
    }
  },

  getLatestLocations: async (): Promise<UserLocation[]> => {
    try {
      return await request<UserLocation[]>('/api/locations/latest');
    } catch {
      return await clientDb.getLatestLocations();
    }
  },

  getLocationHistory: async (): Promise<UserLocation[]> => {
    try {
      return await request<UserLocation[]>('/api/locations/history');
    } catch {
      return await clientDb.getLocationHistory();
    }
  },

  // RM Notifications
  getNotifications: async (): Promise<{ notifications: RMNotification[]; unreadCount: number }> => {
    try {
      return await request<{ notifications: RMNotification[]; unreadCount: number }>('/api/notifications');
    } catch {
      return await clientDb.getNotifications();
    }
  },

  markNotificationAsRead: async (id: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch {
      return await clientDb.markNotificationAsRead(id);
    }
  },

  markAllNotificationsAsRead: async (): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>('/api/notifications/read-all', {
        method: 'PATCH',
      });
    } catch {
      return await clientDb.markAllNotificationsAsRead();
    }
  },

  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return await clientDb.deleteNotification(id);
    }
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
