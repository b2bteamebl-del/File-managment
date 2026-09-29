import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdminOrMentor, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(requireAdminOrMentor);

// Get Audit Logs
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { action, username, limit = '100' } = req.query as Record<string, string>;
  let logs = db.getAuditLogs();

  if (action && action !== 'all') {
    logs = logs.filter(l => l.action === action);
  }
  if (username) {
    logs = logs.filter(l => l.username.toLowerCase().includes(username.toLowerCase()));
  }

  const max = Math.min(500, parseInt(limit, 10) || 100);
  return res.json(logs.slice(0, max));
});

export default router;
