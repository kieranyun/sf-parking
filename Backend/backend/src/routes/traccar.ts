import { Router } from 'express';
import { pool } from '../db/connection';
import { QUERIES } from '../db/queries';
import { sendDataPushToDevice, scheduleSweepWarning, cancelSweepWarning } from '../services/notificationService';
import { findRestrictionsNearPoint } from '../services/parkingService';
import { NextSweep } from '../types';

export const traccarRouter = Router();

/**
 * Webhook endpoint that receives forwarded events from Traccar.
 *
 * Each event payload has event, position, and device objects.
 */
traccarRouter.post('/traccar-webhook', async (req, res) => {
  try {
    const { device, position, event } = req.body;

    console.log('new webhook');
    console.log(req.body);

    if (!device?.uniqueId || !position || !event) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const deviceId = device.uniqueId;
    const { latitude, longitude } = position;
    const deviceEventTime = position.fixTime || position.deviceTime || position.serverTime || Date.now()

    console.log(`Traccar webhook: deviceName=${device?.name}, lat=${latitude}, lng=${longitude}`);

    switch (event.type) {
      case 'ignitionOff': {
        console.log(`${device?.name} ignition off event received`);

        // 1. Store parked location
        await pool.query(QUERIES.upsertParkedVehicle, [deviceId, latitude, longitude, deviceEventTime]);
        console.log(`Device ${deviceId} parked at ${latitude}, ${longitude}`);

        // 2. Query street sweeping restrictions (nextSweep is now included on each restriction)
        const restrictions = await findRestrictionsNearPoint({ latitude, longitude });
        console.log(`Found ${restrictions.length} restrictions near parked location`);

        // 3. Find soonest sweep across all restrictions for notification scheduling
        const soonest = findSoonestSweep(restrictions);
        if (soonest) {
          console.log(`Next sweep: ${soonest.street} (${soonest.blockside}) at ${soonest.date}`);
        } else {
          console.log('No upcoming sweeps found for this location');
        }

        // 4. Send silent data push to update app state
        sendDataPushToDevice(deviceId, {
          type: 'parked',
          latitude,
          longitude,
          restrictions,
        });

        // 5. Schedule a sweep warning if there's an upcoming sweep
        if (soonest) {
          scheduleSweepWarning(deviceId, new Date(soonest.date), {
            street: soonest.street,
            blockside: soonest.blockside,
            fromHour: soonest.fromHour,
          });
        }
        break;
      }

      case 'deviceMoving': {
        console.log(`${device?.name} device moving event received`);

        // 1. Mark vehicle as unparked
        await pool.query(QUERIES.markVehicleUnparked, [deviceId, deviceEventTime]);
        console.log(`Device ${deviceId} unparked`);

        // 2. Send silent data push to clear parked state in app
        sendDataPushToDevice(deviceId, { type: 'unparked' });

        // 3. Cancel any pending sweep warning
        cancelSweepWarning(deviceId);
        break;
      }

      default:
        console.log(`event type ${event.type} not currently handled, ignoring webhook`)
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Traccar webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Returns the current parking status for a device, including restrictions and next sweep.
 */
traccarRouter.get('/parked-location/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await pool.query(QUERIES.getParkedVehicle, [deviceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const vehicle = result.rows[0];

    // If not parked, return basic status
    if (!vehicle.is_parked) {
      return res.json({
        deviceId: vehicle.device_id,
        isParked: false,
      });
    }

    // If parked, include restrictions (each with their own nextSweep)
    const restrictions = await findRestrictionsNearPoint({
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
    });

    res.json({
      deviceId: vehicle.device_id,
      isParked: true,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      parkedAt: vehicle.parked_at,
      restrictions,
    });
  } catch (error) {
    console.error('Parked location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Finds the soonest upcoming sweep across all restrictions, using the
 * nextSweep already calculated on each restriction by parkingService.
 */
function findSoonestSweep(restrictions: { nextSweep?: NextSweep | null; parkingSpot: { street: string; blockside: string }; sweepSchedule: { fromHour: number } }[]): NextSweep | null {
  return restrictions.reduce<NextSweep | null>((soonest, r) => {
    if (!r.nextSweep) return soonest;
    if (!soonest) return r.nextSweep;
    return new Date(r.nextSweep.date) < new Date(soonest.date) ? r.nextSweep : soonest;
  }, null);
}
