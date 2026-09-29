import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdminOrMentor, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Get app settings (accessible to all authenticated users)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  // Don't expose sensitive secret token to non-admin users
  if (req.user?.role === 'RM') {
    const { appsScriptSecretToken, ...safeSettings } = settings;
    return res.json(safeSettings);
  }
  return res.json(settings);
});

// Update app settings (Admin & Mentor only)
router.put('/', requireAdminOrMentor, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const body = req.body;

  const updates: any = {
    updatedBy: user.username,
  };

  if (body.appName && typeof body.appName === 'string') {
    updates.appName = String(body.appName).trim();
  }
  if (body.teamName && typeof body.teamName === 'string') {
    updates.teamName = String(body.teamName).trim();
  }
  if (body.googleSpreadsheetId && typeof body.googleSpreadsheetId === 'string') {
    let rawSheet = String(body.googleSpreadsheetId).trim();
    // If user pasted a full Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/1lb9Wou.../edit), extract ID
    const urlMatch = rawSheet.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      updates.googleSpreadsheetId = urlMatch[1];
    } else {
      updates.googleSpreadsheetId = rawSheet;
    }
  }

  if (Array.isArray(body.productTypes)) updates.productTypes = body.productTypes;
  if (Array.isArray(body.pendingDocOptions)) updates.pendingDocOptions = body.pendingDocOptions;
  if (Array.isArray(body.applicationStatuses)) updates.applicationStatuses = body.applicationStatuses;
  if (['Saturday', 'Sunday', 'Monday'].includes(body.reportingWeekStart)) {
    updates.reportingWeekStart = body.reportingWeekStart;
  }
  if (body.appsScriptWebAppUrl !== undefined) {
    updates.appsScriptWebAppUrl = String(body.appsScriptWebAppUrl).trim();
  }
  if (body.appsScriptSecretToken !== undefined) {
    updates.appsScriptSecretToken = String(body.appsScriptSecretToken).trim();
  }
  if (body.syncIntervalMinutes && typeof body.syncIntervalMinutes === 'number') {
    updates.syncIntervalMinutes = body.syncIntervalMinutes;
  }

  const updated = db.updateSettings(updates);

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'UPDATE',
    details: `Updated application settings and dropdown configurations`,
  });

  return res.json(updated);
});

export default router;
