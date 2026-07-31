import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import env from '../shared/config/env.config';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: General health check status
 *     responses:
 *       200:
 *         description: Server is online
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      status: 'UP',
    },
    errors: null,
  });
});

/**
 * @openapi
 * /health/database:
 *   get:
 *     summary: Database connectivity health check
 *     responses:
 *       200:
 *         description: Connection status
 */
router.get('/health/database', (req: Request, res: Response) => {
  const state = mongoose.connection.readyState;
  const statesMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isHealthy = state === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'Database is healthy' : 'Database connection error',
    data: {
      state: statesMap[state] || 'unknown',
      status: isHealthy ? 'UP' : 'DOWN',
    },
    errors: null,
  });
});

/**
 * @openapi
 * /version:
 *   get:
 *     summary: Get application current version
 *     responses:
 *       200:
 *         description: Returns version string
 */
router.get('/version', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'System version retrieved',
    data: {
      version: '1.0.0',
      environment: env.NODE_ENV,
    },
    errors: null,
  });
});

/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Metrics endpoint for monitoring systems
 *     responses:
 *       200:
 *         description: System metrics details
 */
router.get('/metrics', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    success: true,
    message: 'System metrics retrieved',
    data: {
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      },
      cpu: process.cpuUsage(),
      activeConnections: mongoose.connections.length,
      uptimeSeconds: process.uptime(),
    },
    errors: null,
  });
});

export default router;
