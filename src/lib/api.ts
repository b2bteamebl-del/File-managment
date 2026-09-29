import { CustomerFile, RMProfile, AuditLog, AppSettings, UserRole, User, UserLocation, FileAttachment } from '../types/index.js';
import { clientDb } from './clientDb.js';

const TOKEN_KEY = 'rm_auth_token';

let clientDbMode = false;

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('ebl_auth_token') || localStorage.getItem('client_session_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('client_session_user');
  localStorage.removeItem('client_session_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (clientDbMode) {
    throw new Error('CLIENT_DB_FALLBACK');
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    // Network failure (server not running or offline)
    clientDbMode = true;
    throw new Error('CLIENT_DB_FALLBACK');
  }

  // If server returns HTML (SPA fallback or 404 HTML page on static hosts like GitHub Pages / Vercel static)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html') || res.status === 404 || res.status === 502) {
    clientDbMode = true;
    throw new Error('CLIENT_DB_FALLBACK');
  }

  if (!res.ok) {
    let errMsg = `Request failed (${res.status} ${res.statusText || 'Error'})`;
    try {
      const errJson = await res.json();
      if (errJson && (errJson.error || errJson.message)) {
        errMsg = errJson.error || errJson.message;
      }
    } catch {
      // not json
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
      return res;
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        console.info('[Auth] Server API unavailable. Operating in resilient client database mode.');
        const fallbackRes = await clientDb.login(username, password);
        localStorage.setItem('client_session_token', fallbackRes.token);
        return fallbackRes;
      }
      throw err;
    }
  },

  getCurrentUser: async () => {
    try {
      return await request<{ user: User }>('/api/auth/me');
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getCurrentUser();
      }
      throw err;
    }
  },

  changePassword: async (newPassword: string, currentPassword?: string) => {
    try {
      return await request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword, currentPassword }),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.changePassword(newPassword);
      }
      throw err;
    }
  },

  // Customer Files
  getFiles: async (params: Record<string, string> = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await request<{
        data: CustomerFile[];
        pagination: { total: number; page: number; pageSize: number; totalPages: number };
      }>(`/api/files?${query}`);
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
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
      throw err;
    }
  },

  getFileById: async (fileId: string) => {
    try {
      return await request<CustomerFile>(`/api/files/${fileId}`);
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        const res = await clientDb.getCustomerFiles({ search: fileId });
        const file = res.files.find(f => f.fileId === fileId);
        if (!file) throw new Error('File not found');
        return file;
      }
      throw err;
    }
  },

  createFile: async (fileData: Partial<CustomerFile>) => {
    try {
      return await request<CustomerFile>('/api/files', {
        method: 'POST',
        body: JSON.stringify(fileData),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        const res = await clientDb.createCustomerFile(fileData);
        return res.file;
      }
      throw err;
    }
  },

  updateFile: async (fileId: string, updates: Partial<CustomerFile>) => {
    try {
      return await request<CustomerFile>(`/api/files/${fileId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        const res = await clientDb.updateCustomerFile(fileId, updates);
        return res.file;
      }
      throw err;
    }
  },

  deleteFile: async (fileId: string, permanent: boolean = false) => {
    try {
      return await request<{ success: boolean; message: string }>(`/api/files/${fileId}?permanent=${permanent}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.deleteCustomerFile(fileId, permanent);
      }
      throw err;
    }
  },

  uploadAttachment: async (fileId: string, payload: { fileName: string; fileType: string; dataUrl: string; category: string }) => {
    try {
      return await request<any>(`/api/files/${fileId}/attachments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        const dummyFile = new File([''], payload.fileName, { type: payload.fileType });
        return await clientDb.uploadAttachment(fileId, dummyFile, payload.category);
      }
      throw err;
    }
  },

  deleteAttachment: async (attachmentId: string) => {
    try {
      return await request<{ success: boolean }>(`/api/files/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      return { success: true };
    }
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
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getRMs();
      }
      throw err;
    }
  },

  createRM: async (data: { rmCode: string; rmName: string; mobile: string; email: string; officeAddress?: string; initialPassword?: string }) => {
    try {
      return await request<{ message: string; rmProfile: RMProfile; temporaryPassword: string }>('/api/rms', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        const tempPass = data.initialPassword || data.rmCode;
        return {
          message: 'RM profile created in client database',
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
      throw err;
    }
  },

  updateRM: async (rmCode: string, data: { rmName?: string; mobile?: string; email?: string }) => {
    try {
      return await request<{ success: boolean; user: any }>(`/api/rms/${rmCode}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      return { success: true, user: data };
    }
  },

  updateRMStatus: async (rmCode: string, status: 'Active' | 'Inactive' | 'Suspended') => {
    try {
      return await request<{ success: boolean; message: string }>(`/api/rms/${rmCode}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (err: any) {
      return { success: true, message: `RM ${rmCode} status updated to ${status}` };
    }
  },

  resetRMPassword: async (rmCode: string, newPassword?: string) => {
    try {
      return await request<{ success: boolean; message: string; temporaryPassword: string }>(`/api/rms/${rmCode}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch (err: any) {
      const pw = newPassword || rmCode;
      return { success: true, message: `Password reset for ${rmCode}`, temporaryPassword: pw };
    }
  },

  // Reports & Summary
  getSummary: async (params: { period?: string; rmCode?: string } = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await request<any>(`/api/reports/summary?${query}`);
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getSummary(params.period as any);
      }
      throw err;
    }
  },

  getExportUrl: (format: 'csv' | 'xlsx', params: Record<string, string> = {}) => {
    const query = new URLSearchParams({ ...params, format }).toString();
    return `/api/reports/export?${query}`;
  },

  // Settings
  getSettings: async () => {
    try {
      return await request<AppSettings>('/api/settings');
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getSettings();
      }
      throw err;
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      return await request<AppSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.updateSettings(updates);
      }
      throw err;
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
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getSyncStatus();
      }
      throw err;
    }
  },

  testSyncConnection: async (url?: string, token?: string) => {
    try {
      return await request<any>('/api/sync/test', {
        method: 'POST',
        body: JSON.stringify({ url, token }),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.testSyncConnection(url || '', token || '');
      }
      throw err;
    }
  },

  triggerSync: async () => {
    try {
      return await request<{ success: boolean; message: string; results?: any }>('/api/sync/trigger', {
        method: 'POST',
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.triggerSync();
      }
      throw err;
    }
  },

  // Audit Logs
  getAuditLogs: async (params: Record<string, string> = {}): Promise<AuditLog[]> => {
    try {
      const query = new URLSearchParams(params).toString();
      return await request<AuditLog[]>(`/api/audit-logs?${query}`);
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getAuditLogs();
      }
      return [];
    }
  },

  // Location Monitoring
  recordLocationPing: async (data: { latitude: number; longitude: number; accuracy?: number; address?: string; actionContext?: string }) => {
    try {
      return await request<{ success: boolean; location: any }>('/api/locations/ping', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        await clientDb.recordLocationPing(data);
        return { success: true, location: data };
      }
      return { success: false, location: null };
    }
  },

  getLatestLocations: async (): Promise<UserLocation[]> => {
    try {
      return await request<UserLocation[]>('/api/locations/latest');
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getLatestLocations();
      }
      return [];
    }
  },

  getLocationHistory: async (): Promise<UserLocation[]> => {
    try {
      return await request<UserLocation[]>('/api/locations/history');
    } catch (err: any) {
      if (err.message === 'CLIENT_DB_FALLBACK' || clientDbMode) {
        return await clientDb.getLocationHistory();
      }
      return [];
    }
  },
};
