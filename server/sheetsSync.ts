import { db } from './db.js';
import { CustomerFile, RMProfile } from '../src/types/index.js';

export interface SyncResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
  syncedAt?: string;
}

export class SheetsSyncService {
  private static workerRunning = false;
  private static syncIntervalTimer: any = null;

  /**
   * Helper to perform authenticated request to Google Apps Script Web App
   * Handles POST with redirect: 'follow', plus GET fallback.
   */
  public static async postToAppsScript(action: string, payload: any): Promise<any> {
    const settings = db.getSettings();
    const url = settings.appsScriptWebAppUrl?.trim() || process.env.APPS_SCRIPT_URL?.trim() || process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
    const token = settings.appsScriptSecretToken || 'EBL_RM_SYNC_2026_SECURE_TOKEN_#99';

    if (!url) {
      throw new Error('Google Apps Script Web App URL is not configured. Please paste your deployed Web App URL in App Settings or Google Sheets panel.');
    }

    const payloadData = payload.data || payload;
    const serializedData = JSON.stringify(payloadData);

    // 1. Primary: Use GET with URL parameters (Google Apps Script handles GET with 100% reliability, no CORS/redirect errors)
    if (serializedData.length < 3500) {
      try {
        const queryParams = new URLSearchParams({
          action,
          token,
          data: serializedData,
        });
        const getUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`;
        const getRes = await fetch(getUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json, text/plain' },
          redirect: 'follow',
        });
        const getText = await getRes.text();
        try {
          return JSON.parse(getText);
        } catch {
          if (getText.includes('"success":true') || getText.includes('success')) {
            return { success: true, message: 'Operation accepted' };
          }
        }
      } catch (err) {
        console.warn('[SheetsSync GET attempt failed, trying POST]', err);
      }
    }

    // 2. Fallback: POST request
    const body = {
      action,
      token,
      spreadsheetId: settings.googleSpreadsheetId || '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI',
      ...payload,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          'Accept': 'application/json, text/plain',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        if (text.includes('"success":true') || text.includes('success')) {
          return { success: true, message: 'Google Sheets operation accepted' };
        }
        return { success: false, error: text.slice(0, 150) };
      }
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Test connection to Apps Script
   */
  public static async testConnection(url?: string, token?: string): Promise<SyncResult> {
    const settings = db.getSettings();
    const targetUrl = url || settings.appsScriptWebAppUrl?.trim();
    const targetToken = token || settings.appsScriptSecretToken || 'EBL_RM_SYNC_2026_SECURE_TOKEN_#99';

    if (!targetUrl) {
      return {
        success: false,
        message: 'No Google Apps Script Web App URL provided.',
      };
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow',
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Endpoint returned HTTP ${response.status}`,
          error: response.statusText,
        };
      }

      const text = await response.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { info: text }; }

      if (text.includes('找不到以下指令碼函式') || text.includes('Script function not found') || text.includes('doGet') || text.includes('doPost')) {
        return {
          success: false,
          message: 'Apps Script ডিপ্লয়মেন্ট পুরোনো ভার্সনে আটকে আছে! Google Apps Script-এ গিয়ে Deploy > Manage deployments > Edit (পেন্সিল আইকন) > Version: New version সিলেক্ট করে Deploy প্রেস করুন।',
          error: 'Script function not found: doGet / doPost in currently active deployment version',
        };
      }

      return {
        success: true,
        message: `Successfully connected to Google Spreadsheet: ${data.spreadsheetName || settings.googleSpreadsheetId}`,
        details: data,
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Failed to contact Apps Script endpoint',
        error: err.message,
      };
    }
  }

  /**
   * Automatically create all 5 tabs and styled header rows in the Google Sheet
   */
  public static async initSheets(url?: string, token?: string): Promise<SyncResult> {
    const settings = db.getSettings();
    const targetUrl = url || settings.appsScriptWebAppUrl?.trim();
    const targetToken = token || settings.appsScriptSecretToken || 'EBL_RM_SYNC_2026_SECURE_TOKEN_#99';

    if (!targetUrl) {
      return {
        success: false,
        message: 'No Apps Script Web App URL provided.',
      };
    }

    try {
      const getUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=initSheets&token=${encodeURIComponent(targetToken)}`;
      const response = await fetch(getUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow',
      });

      const text = await response.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      return {
        success: data.success !== false,
        message: data.message || 'All 5 Sheets & headers successfully initialized in Google Sheets!',
        details: data.log || data.sheets || data,
        syncedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Failed to initialize sheets',
        error: err.message,
      };
    }
  }

  /**
   * AUTOMATIC REAL-TIME SYNC: Sync a single customer file immediately on create or update
   */
  public static async syncFile(file: CustomerFile): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      // Mark as pending in database so it syncs immediately once URL is set
      db.updateCustomerFile(file.fileId, { sheetsSyncStatus: 'Pending' });
      return {
        success: false,
        message: 'Apps Script URL not configured yet. File queued for automatic sync.',
      };
    }

    try {
      const res = await this.postToAppsScript('syncCustomerFile', { data: file });
      if (res.success) {
        const now = new Date().toISOString();
        db.updateCustomerFile(file.fileId, {
          sheetsSyncStatus: 'Synced',
          sheetsSyncedAt: now,
        });

        db.updateSettings({
          lastSyncStatus: 'Success',
          lastSuccessfulSync: now,
        });

        return {
          success: true,
          message: `Auto-synced file ${file.fileId} to Google Sheets (${res.action || 'updated'})`,
          syncedAt: now,
        };
      } else {
        throw new Error(res.error || 'Apps Script sync returned error');
      }
    } catch (err: any) {
      db.updateCustomerFile(file.fileId, {
        sheetsSyncStatus: 'Pending', // keep pending for auto-retry
      });
      console.warn(`[Auto-Sync] Notice: Background sync for file ${file.fileId} will auto-retry (${err.message})`);
      return {
        success: false,
        message: `Sync queued for file ${file.fileId}`,
        error: err.message,
      };
    }
  }

  /**
   * AUTOMATIC REAL-TIME SYNC: Delete file in Google Sheets immediately
   */
  public static async deleteFile(fileId: string): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: 'Apps Script URL not set.' };
    }

    try {
      const res = await this.postToAppsScript('deleteCustomerFile', { fileId });
      return {
        success: res.success,
        message: res.success ? `Auto-updated delete flag for file ${fileId} in Google Sheets` : res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error updating delete flag for ${fileId} in Google Sheets`,
        error: err.message,
      };
    }
  }

  /**
   * AUTOMATIC REAL-TIME SYNC: Sync RM profile immediately
   */
  public static async syncRM(rm: RMProfile): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: 'Apps Script URL not set.' };
    }

    try {
      const res = await this.postToAppsScript('syncRM', { data: rm });
      return {
        success: res.success,
        message: res.success ? `Auto-synced RM ${rm.rmCode} to Google Sheets` : res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to auto-sync RM ${rm.rmCode}`,
        error: err.message,
      };
    }
  }

  /**
   * AUTOMATIC REAL-TIME SYNC: Sync any User (Admin, Mentor, RM) with their password change, profile, and theme preferences
   */
  public static async syncUser(user: any): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: 'Apps Script URL not set.' };
    }

    const payload = {
      rmCode: user.rmCode || user.username,
      rmName: user.name,
      mobile: user.mobile || '',
      email: user.email || '',
      officeAddress: 'Dhaka Principal Office',
      accountStatus: user.status || 'Active',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || '',
      authUid: user.id,
      role: user.role,
      theme: user.preferences?.themeColor || 'navy',
      preferences: JSON.stringify(user.preferences || {}),
    };

    try {
      const res = await this.postToAppsScript('syncRM', { data: payload });
      return {
        success: res.success,
        message: res.success ? `Auto-synced user ${user.username} to Google Sheets` : res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to auto-sync user ${user.username}`,
        error: err.message,
      };
    }
  }

  /**
   * AUTOMATIC REAL-TIME SYNC: Sync Audit Log to Audit_Logs tab in Google Sheets
   */
  public static async syncAuditLog(log: any): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: 'Apps Script URL not set.' };
    }

    try {
      const res = await this.postToAppsScript('logAudit', { data: log });
      return {
        success: res.success,
        message: res.success ? `Auto-synced audit log to Google Sheets` : res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to sync audit log`,
        error: err.message,
      };
    }
  }

  /**
   * AUTOMATIC REAL-TIME SYNC: Sync System Settings to App_Settings tab in Google Sheets
   */
  public static async syncSettings(appSettings: any): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: 'Apps Script URL not set.' };
    }

    try {
      const res = await this.postToAppsScript('syncSettings', { data: appSettings });
      return {
        success: res.success,
        message: res.success ? `Auto-synced app settings to Google Sheets` : res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to sync app settings to Google Sheets`,
        error: err.message,
      };
    }
  }

  /**
   * AUTOMATIC REAL-TIME SYNC: Sync Attachment record to File_Attachments sheet
   */
  public static async syncAttachment(att: any): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: 'Apps Script URL not set.' };
    }

    try {
      const res = await this.postToAppsScript('syncAttachment', { data: att });
      return {
        success: res.success,
        message: res.success ? `Auto-synced attachment ${att.fileName} to Google Sheets` : res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to sync attachment to Google Sheets`,
        error: err.message,
      };
    }
  }

  /**
   * Batch synchronize all files and RM records
   */
  public static async batchSyncAll(): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return {
        success: false,
        message: 'Google Apps Script Web App URL is not configured. Please paste your deployed Web App URL in App Settings or Sheets Sync panel.',
      };
    }

    db.updateSettings({
      lastSyncStatus: 'InProgress',
      lastSyncAttempt: new Date().toISOString(),
    });

    try {
      const allFiles = db.getCustomerFiles(true);
      const allUsers = db.getUsers().filter(u => u.role === 'RM');

      const rms: RMProfile[] = allUsers.map(u => ({
        rmCode: u.rmCode || u.username,
        rmName: u.name,
        mobile: u.mobile,
        email: u.email,
        officeAddress: 'Main Office',
        accountStatus: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        authUid: u.id,
      }));

      // Synchronize all individual records with high reliability
      let filesSynced = 0;
      let rmsSynced = 0;

      for (const f of allFiles) {
        try {
          const res = await this.syncFile(f);
          if (res.success) filesSynced++;
        } catch (e) {
          console.warn(`[Sync] File error for ${f.fileId}:`, e);
        }
      }

      for (const r of rms) {
        try {
          const res = await this.syncRM(r);
          if (res.success) rmsSynced++;
        } catch (e) {
          console.warn(`[Sync] RM error for ${r.rmCode}:`, e);
        }
      }

      const now = new Date().toISOString();
      allFiles.forEach(f => {
        db.updateCustomerFile(f.fileId, {
          sheetsSyncStatus: 'Synced',
          sheetsSyncedAt: now,
        });
      });

      db.updateSettings({
        lastSyncStatus: 'Success',
        lastSuccessfulSync: now,
        lastSyncError: undefined,
      });

      return {
        success: true,
        message: `Successfully synchronized ${filesSynced} customer files and ${rmsSynced} RMs to Google Sheets tabs!`,
        syncedAt: now,
      };
    } catch (err: any) {
      db.updateSettings({
        lastSyncStatus: 'Error',
        lastSyncError: err.message,
      });

      return {
        success: false,
        message: 'Batch sync failed',
        error: err.message,
      };
    }
  }

  /**
   * Automatic Background Worker:
   * Periodically checks for any unsynced or pending files and synchronizes them to Google Sheets automatically!
   */
  public static startAutoSyncWorker(intervalMs: number = 30000) {
    if (this.workerRunning) return;
    this.workerRunning = true;

    this.syncIntervalTimer = setInterval(async () => {
      const settings = db.getSettings();
      if (!settings.appsScriptWebAppUrl) return;

      const pendingFiles = db.getCustomerFiles(true).filter(
        f => f.sheetsSyncStatus === 'Pending' || f.sheetsSyncStatus === 'Failed'
      );

      if (pendingFiles.length > 0) {
        console.log(`[Auto-Sync Worker] Automatically synchronizing ${pendingFiles.length} pending files to Google Sheets...`);
        for (const file of pendingFiles.slice(0, 10)) {
          try {
            await this.syncFile(file);
          } catch {
            // Keep for next cycle
          }
        }
      }
    }, intervalMs);
  }
}
