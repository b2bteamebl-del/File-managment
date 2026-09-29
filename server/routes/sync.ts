import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdminOrMentor, AuthenticatedRequest } from '../middleware/auth.js';
import { SheetsSyncService } from '../sheetsSync.js';

const router = Router();
router.use(requireAuth);
router.use(requireAdminOrMentor);

// Sync Status
router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  const allFiles = db.getCustomerFiles(true);
  const syncedCount = allFiles.filter(f => f.sheetsSyncStatus === 'Synced').length;
  const pendingCount = allFiles.filter(f => f.sheetsSyncStatus === 'Pending' || !f.sheetsSyncStatus).length;
  const failedCount = allFiles.filter(f => f.sheetsSyncStatus === 'Failed').length;

  return res.json({
    spreadsheetId: settings.googleSpreadsheetId,
    appsScriptConfigured: Boolean(settings.appsScriptWebAppUrl),
    lastSyncStatus: settings.lastSyncStatus,
    lastSuccessfulSync: settings.lastSuccessfulSync,
    lastSyncAttempt: settings.lastSyncAttempt,
    lastSyncError: settings.lastSyncError,
    stats: {
      totalFiles: allFiles.length,
      syncedCount,
      pendingCount,
      failedCount,
    },
  });
});

// Test Connection
router.post('/test', async (req: AuthenticatedRequest, res: Response) => {
  const { url, token } = req.body;
  const result = await SheetsSyncService.testConnection(url, token);
  return res.json(result);
});

// Initialize Tabs and Headers in Google Sheets
router.post('/init-sheets', async (req: AuthenticatedRequest, res: Response) => {
  const { url, token } = req.body;
  const result = await SheetsSyncService.initSheets(url, token);
  return res.json(result);
});

// Trigger Manual Sync
router.post('/trigger', async (req: AuthenticatedRequest, res: Response) => {
  const result = await SheetsSyncService.batchSyncAll();
  return res.json(result);
});

export default router;
