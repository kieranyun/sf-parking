import { Router } from 'express';
import { pool } from '../db/connection';

export const healthRouter = Router();

// TODO: Implement GET /health endpoint
healthRouter.get('/', async (req, res) => {
  try {
    // TODO: Test database connection
    // TODO: Get record count from street_sweeping table
    // TODO: Get last_updated from metadata table

    res.json({
      status: 'ok',
      database: 'connected',
      // TODO: Add more health check info
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});