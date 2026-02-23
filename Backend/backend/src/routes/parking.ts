import { Router } from 'express';
import { findRestrictionsNearPoint } from '../services/parkingService';

export const parkingRouter = Router();

parkingRouter.post('/check-parking', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'latitude and longitude must be numbers'
      });
    }

    // Check coordinates are within SF bounds
    if (latitude < 37.7 || latitude > 37.85 || longitude < -122.55 || longitude > -122.35) {
      return res.status(400).json({
        error: 'Coordinates out of range',
        message: 'Coordinates appear to be outside San Francisco'
      });
    }

    // Call service to find restrictions
    const restrictions = await findRestrictionsNearPoint({latitude, longitude});

    if (restrictions.length === 0) {
      return res.status(404).json({
        error: `No street sweeping schedules found near point (${latitude}, ${longitude})`,
        message: 'Might need to revisit estimated street width and gps accuracy, no street sweeping within 11m'
      })
    }

    // Return response
    res.json({
      latitude,
      longitude,
      restrictions,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// TODO: Implement POST /api/reload-data endpoint
parkingRouter.post('/reload-data', async (req, res) => {
  try {
    // TODO: Call loadStreetSweepingData
    // TODO: Return success response with count
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// TODO: (Optional) Implement GET /api/stats endpoint
parkingRouter.get('/stats', async (req, res) => {
  try {
    // TODO: Get statistics from database:
    // - Total segments
    // - Unique streets
    // - Breakdown by weekday
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});