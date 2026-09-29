import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, UserRecord } from '../db.js';
import { requireAuth, requireAdminOrMentor, AuthenticatedRequest } from '../middleware/auth.js';
import { RMProfile } from '../../src/types/index.js';
import { SheetsSyncService } from '../sheetsSync.js';

const router = Router();

// All routes require Admin or Mentor
router.use(requireAuth);
router.use(requireAdminOrMentor);

// List all RMs
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().filter(u => u.role === 'RM');
  const files = db.getCustomerFiles(false);

  const list: (RMProfile & { fileCount: number; approvedCount: number })[] = users.map(u => {
    const rmCode = u.rmCode || u.username;
    const rmFiles = files.filter(f => f.rmCode === rmCode);
    const approvedFiles = rmFiles.filter(f => f.applicationStatus === 'Approved');

    return {
      rmCode,
      rmName: u.name,
      mobile: u.mobile,
      email: u.email,
      officeAddress: 'Main Office',
      ipAddress: '127.0.0.1',
      accountStatus: u.status,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      authUid: u.id,
      fileCount: rmFiles.length,
      approvedCount: approvedFiles.length,
    };
  });

  return res.json(list);
});

// Create New RM Mapping & Account
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { rmCode, rmName, mobile, email, officeAddress = 'Main Office', initialPassword } = req.body;

  if (!rmCode || !rmName || !mobile || !email) {
    return res.status(400).json({ error: 'RM Code, RM Name, Mobile, and Email are required' });
  }

  const cleanRmCode = String(rmCode).trim();
  if (db.getUserByUsername(cleanRmCode) || db.getUserByRmCode(cleanRmCode)) {
    return res.status(400).json({ error: `RM Code ${cleanRmCode} already exists. Each RM Code must be unique.` });
  }

  // Generate temporary password if not provided
  const tempPass = initialPassword && String(initialPassword).length >= 6
    ? String(initialPassword)
    : `Ebl#${cleanRmCode}`;

  const { hash, salt } = hashPassword(tempPass);
  const now = new Date().toISOString();

  const newRMUser: UserRecord = {
    id: `usr_rm_${cleanRmCode}_${crypto.randomBytes(3).toString('hex')}`,
    username: cleanRmCode,
    passwordHash: hash,
    salt,
    role: 'RM',
    name: String(rmName).trim(),
    mobile: String(mobile).trim(),
    email: String(email).trim(),
    rmCode: cleanRmCode,
    status: 'Active',
    mustChangePassword: true, // Force change on first login
    createdAt: now,
  };

  db.createUser(newRMUser);

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: cleanRmCode,
    action: 'CREATE',
    details: `Created new RM Account ${cleanRmCode} (${newRMUser.name}). Status: Active. Temporary password issued.`,
  });

  const rmProfile: RMProfile = {
    rmCode: cleanRmCode,
    rmName: newRMUser.name,
    mobile: newRMUser.mobile,
    email: newRMUser.email,
    officeAddress,
    accountStatus: 'Active',
    createdAt: now,
    authUid: newRMUser.id,
  };

  // Sync to Google Sheets
  SheetsSyncService.syncRM(rmProfile).catch(e => console.error('Failed to sync new RM to sheets:', e));

  return res.status(201).json({
    message: 'RM Account successfully created',
    rmProfile,
    temporaryPassword: tempPass,
  });
});

// Update RM Information
router.put('/:rmCode', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetRmCode = req.params.rmCode;
  const targetUser = db.getUserByRmCode(targetRmCode) || db.getUserByUsername(targetRmCode);

  if (!targetUser) {
    return res.status(404).json({ error: 'RM account not found' });
  }

  const { rmName, mobile, email } = req.body;

  const updated = db.updateUser(targetUser.id, {
    name: rmName ? String(rmName).trim() : targetUser.name,
    mobile: mobile ? String(mobile).trim() : targetUser.mobile,
    email: email ? String(email).trim() : targetUser.email,
  });

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: targetRmCode,
    action: 'UPDATE',
    details: `Updated RM information for ${targetRmCode}`,
  });

  return res.json({ success: true, user: updated });
});

// Activate / Deactivate / Suspend RM Account
router.patch('/:rmCode/status', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetRmCode = req.params.rmCode;
  const targetUser = db.getUserByRmCode(targetRmCode) || db.getUserByUsername(targetRmCode);

  if (!targetUser) {
    return res.status(404).json({ error: 'RM account not found' });
  }

  const { status } = req.body;
  if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Active, Inactive, or Suspended' });
  }

  db.updateUser(targetUser.id, { status });

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: targetRmCode,
    action: 'RM_STATUS_CHANGE',
    details: `Changed RM ${targetRmCode} status from ${targetUser.status} to ${status}`,
  });

  SheetsSyncService.syncRM({
    rmCode: targetRmCode,
    rmName: targetUser.name,
    mobile: targetUser.mobile,
    email: targetUser.email,
    officeAddress: 'Main Office',
    accountStatus: status,
    createdAt: targetUser.createdAt,
    lastLogin: targetUser.lastLogin,
    authUid: targetUser.id,
  }).catch(e => console.error('Failed to sync status change to sheets:', e));

  return res.json({ success: true, message: `RM ${targetRmCode} status updated to ${status}` });
});

// Reset RM Password
router.post('/:rmCode/reset-password', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetRmCode = req.params.rmCode;
  const targetUser = db.getUserByRmCode(targetRmCode) || db.getUserByUsername(targetRmCode);

  if (!targetUser) {
    return res.status(404).json({ error: 'RM account not found' });
  }

  const { newPassword } = req.body;
  const tempPass = newPassword && String(newPassword).length >= 6
    ? String(newPassword)
    : `Ebl#${crypto.randomBytes(3).toString('hex')}!`;

  const { hash, salt } = hashPassword(tempPass);

  db.updateUser(targetUser.id, {
    passwordHash: hash,
    salt,
    mustChangePassword: true, // Force password change on next login
  });

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: targetRmCode,
    action: 'PASSWORD_CHANGE',
    details: `Admin/Mentor reset password for RM ${targetRmCode}`,
  });

  return res.json({
    success: true,
    message: `Password reset successfully for RM ${targetRmCode}. Temporary password issued.`,
    temporaryPassword: tempPass,
  });
});

export default router;
