import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { SheetsSyncService } from '../sheetsSync.js';

const router = Router();
router.use(requireAuth);
// Admin cannot see or access any Google Sheet sync; ONLY Mentor is authorized
router.use(requireRoles(['Mentor']));

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

// Get Apps Script Code.gs content for one-click copy
router.get('/script-code', (req: AuthenticatedRequest, res: Response) => {
  const codePath = path.resolve(process.cwd(), 'google-apps-script/Code.gs');
  if (fs.existsSync(codePath)) {
    const code = fs.readFileSync(codePath, 'utf8');
    return res.json({ code });
  }
  return res.status(404).json({ error: 'Code.gs file not found' });
});

export default router;
