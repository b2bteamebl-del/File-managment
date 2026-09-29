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
  /**
   * Helper to perform authenticated POST request to Google Apps Script Web App
   */
  private static async postToAppsScript(action: string, payload: any): Promise<any> {
    const settings = db.getSettings();
    const url = settings.appsScriptWebAppUrl?.trim();
    const token = settings.appsScriptSecretToken || 'RM_TEAM_SYNC_2026_SECURE_TOKEN_#99';

    if (!url) {
      throw new Error('Google Apps Script Web App URL is not configured. Please deploy the script and add the URL in App Settings.');
    }

    const body = {
      action,
      token,
      spreadsheetId: settings.googleSpreadsheetId,
      ...payload,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Apps Script responded with HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Connection to Google Apps Script timed out after 20 seconds');
      }
      throw err;
    }
  }

  /**
   * Test connection to Apps Script
   */
  public static async testConnection(url?: string, token?: string): Promise<SyncResult> {
    const settings = db.getSettings();
    const targetUrl = url || settings.appsScriptWebAppUrl?.trim();
    const targetToken = token || settings.appsScriptSecretToken;

    if (!targetUrl) {
      return {
        success: false,
        message: 'No Apps Script Web App URL provided.',
      };
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Endpoint returned HTTP ${response.status}`,
          error: response.statusText,
        };
      }

      const data = await response.json();
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
   * Sync a single customer file
   */
  public static async syncFile(file: CustomerFile): Promise<SyncResult> {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return {
        success: false,
        message: 'Apps Script URL not set. Sync queued in database.',
      };
    }

    try {
      const res = await this.postToAppsScript('syncCustomerFile', { data: file });
      if (res.success) {
        db.updateCustomerFile(file.fileId, {
          sheetsSyncStatus: 'Synced',
          sheetsSyncedAt: new Date().toISOString(),
        });
        return {
          success: true,
          message: `Synced file ${file.fileId} to Google Sheets`,
          syncedAt: new Date().toISOString(),
        };
      } else {
        throw new Error(res.error || 'Unknown Apps Script error');
      }
    } catch (err: any) {
      db.updateCustomerFile(file.fileId, {
        sheetsSyncStatus: 'Failed',
      });
      return {
        success: false,
        message: `Failed to sync file ${file.fileId} to Google Sheets`,
        error: err.message,
      };
    }
  }

  /**
   * Delete / Soft-delete customer file in Google Sheets
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
        message: res.success ? `Marked file ${fileId} as deleted in Google Sheets` : res.error,
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
   * Sync RM profile
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
        message: res.success ? `Synced RM ${rm.rmCode} to Google Sheets` : res.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to sync RM ${rm.rmCode}`,
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
        message: 'Google Apps Script Web App URL is not configured. Please paste your deployed Web App URL in App Settings.',
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

      const res = await this.postToAppsScript('batchSync', {
        files: allFiles,
        rms: rms,
      });

      if (res.success) {
        const now = new Date().toISOString();
        // Update all files to synced
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

        db.addAuditLog({
          userId: 'system',
          username: 'System Sync',
          role: 'Admin',
          action: 'SHEETS_SYNC',
          details: `Batch synchronized ${res.filesSynced || allFiles.length} files and ${res.rmsSynced || rms.length} RMs with Google Spreadsheet 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI`,
        });

        return {
          success: true,
          message: `Synchronized ${allFiles.length} files and ${rms.length} RMs successfully`,
          details: res,
          syncedAt: now,
        };
      } else {
        throw new Error(res.error || 'Apps script reported sync error');
      }
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
}
