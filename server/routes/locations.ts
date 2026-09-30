import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { UserLocation } from '../../src/types/index.js';

const router = Router();
router.use(requireAuth);

// Record a location ping from authenticated user (e.g. RM check-in or auto-detect)
router.post('/ping', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { latitude, longitude, accuracy, address, actionContext = 'General Check-In' } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }

  const loc: UserLocation = {
    userId: user.id,
    username: user.username,
    rmCode: user.rmCode || user.username,
    name: user.name,
    role: user.role,
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy: accuracy ? Number(accuracy) : undefined,
    address: address ? String(address).trim() : undefined,
    timestamp: new Date().toISOString(),
    actionContext,
  };

  const recorded = db.recordUserLocation(loc);

  return res.json({ success: true, location: recorded });
});

// ONLY Mentor: Get latest known location of each active team member (Admin cannot see location)
router.get('/latest', requireRoles(['Mentor']), (req: AuthenticatedRequest, res: Response) => {
  const latestLocations = db.getLatestUserLocations();
  return res.json(latestLocations);
});

// ONLY Mentor: Get all recent location events (Admin cannot see location)
router.get('/history', requireRoles(['Mentor']), (req: AuthenticatedRequest, res: Response) => {
  const allLocations = db.getAllUserLocations();
  return res.json(allLocations);
});

export default router;
