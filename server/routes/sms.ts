import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db.js';
import { SMSService } from '../smsService.js';

const router = Router();

// GET /api/sms/logs - Get SMS dispatch logs
router.get('/logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const rmCode = user.role === 'RM' ? (user.rmCode || user.username) : undefined;
  const logs = db.getSmsLogs(rmCode);
  return res.json(logs);
});

// POST /api/sms/test - Send a test SMS alert to current user
router.post('/test', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetRm = user.rmCode || user.username;

  const log = await SMSService.sendRMAlertSMS({
    recipientRmCode: targetRm,
    fileId: 'TEST-FILE-001',
    customerName: 'Test Customer (Mobile Alert Verification)',
    action: 'UPDATE',
    performedByName: user.name,
    performedByRole: user.role,
    details: 'This is a test mobile SMS notification alert sound and vibration verification.',
  });

  return res.json({
    success: true,
    message: `Test SMS dispatched to ${log.recipientMobile} via ${log.gateway}`,
    log,
  });
});

export default router;
