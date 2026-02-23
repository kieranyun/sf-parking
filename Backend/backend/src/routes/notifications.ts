import { Router } from 'express';
import { pool } from '../db/connection';
import { QUERIES } from '../db/queries';

export const notificationsRouter = Router();

/**
 * Registers an Expo push token for a Traccar device.
 * Called by the mobile app on startup after getting notification permissions.
 *
 * Body: { deviceId: string, pushToken: string }
 */
notificationsRouter.post('/register-push-token', async (req, res) => {
  try {
    const { deviceId, pushToken } = req.body;

    if (!deviceId || !pushToken) {
      return res.status(400).json({ error: 'deviceId and pushToken are required' });
    }

    await pool.query(QUERIES.upsertPushToken, [pushToken, deviceId]);
    console.log(`Push token registered for device ${deviceId}: ${pushToken.substring(0, 20)}...`);

    res.json({ ok: true });
  } catch (error) {
    console.error('Push token registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});