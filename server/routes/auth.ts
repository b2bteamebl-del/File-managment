import { Router, Response } from 'express';
import { db, verifyPassword, hashPassword } from '../db.js';
import { generateToken, verifyToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.getUserByUsername(String(username).trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.status !== 'Active') {
    return res.status(403).json({ error: `Account is ${user.status}. Please contact bank administrator.` });
  }

  const isValid = verifyPassword(String(password), user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const now = new Date().toISOString();
  db.updateUser(user.id, { lastLogin: now });

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    action: 'LOGIN',
    details: `User ${user.username} (${user.role}) logged in successfully`,
  });

  const token = generateToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      rmCode: user.rmCode,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      lastLogin: now,
    },
  });
});

// Current user profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      rmCode: user.rmCode,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
  });
});

// Change Password (supports Bearer token and first-login credential fallback)
router.post('/change-password', (req, res) => {
  let user = undefined;

  // 1. Check Bearer token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded && decoded.sub) {
      user = db.getUserById(decoded.sub);
    }
  }

  // 2. If token expired or missing on first login, fallback to username
  const { username, currentPassword, newPassword, isForcedFirstLogin } = req.body;
  if (!user && username) {
    const found = db.getUserByUsername(String(username).trim());
    if (found && found.status === 'Active') {
      user = found;
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  // If user is not in forced change mode, verify current password
  if (!user.mustChangePassword && !isForcedFirstLogin) {
    if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash, user.salt)) {
      return res.status(400).json({ error: 'Current password does not match' });
    }
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(user.id, {
    passwordHash: hash,
    salt: salt,
    mustChangePassword: false,
  });

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    action: 'PASSWORD_CHANGE',
    details: `User ${user.username} successfully updated their password`,
  });

  const newToken = generateToken(user);

  return res.json({ 
    success: true, 
    message: 'Password updated successfully',
    token: newToken,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      rmCode: user.rmCode,
      status: user.status,
      mustChangePassword: false,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }
  });
});

export default router;
