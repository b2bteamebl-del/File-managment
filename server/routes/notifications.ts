import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();

// GET /api/notifications - Get notifications for the current user
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isElevated = user.role !== 'RM';
  const rmCode = user.rmCode || user.username;

  const notifications = db.getNotificationsForUser(rmCode, isElevated);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return res.json({
    notifications,
    unreadCount,
  });
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.markNotificationAsRead(id);
  return res.json({ success });
});

// PATCH /api/notifications/read-all - Mark all as read for current user
router.patch('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isElevated = user.role !== 'RM';
  const rmCode = user.rmCode || user.username;

  const success = db.markAllNotificationsAsRead(rmCode, isElevated);
  return res.json({ success });
});

// DELETE /api/notifications/:id - Delete / dismiss a notification
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteNotification(id);
  return res.json({ success });
});

export default router;
