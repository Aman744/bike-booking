import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (error) {
  console.warn('Warning: Failed to set custom DNS servers. Using system default resolver.', error);
}

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import env from './shared/config/env.config';
import logger from './shared/config/logger.config';
import connectDB from './shared/config/db.config';
import { swaggerSpec } from './shared/config/swagger.config';
import { initSocket } from './socket/socket';

// Middlewares
import { requestIdMiddleware } from './shared/middleware/requestId.middleware';
import { loggerMiddleware } from './shared/middleware/logger.middleware';
import { errorHandler } from './shared/middleware/error.middleware';

// Routes
import healthRouter from './routes/health.routes';
import authRouter from './modules/auth/auth.routes';
import settingsRouter from './modules/settings/settings.routes';
import bikeRouter from './modules/bikes/bike.routes';
import bookingRouter from './modules/bookings/booking.routes';

const app = express();
const server = http.createServer(app);

// Fail-fast environment check was executed on env import.
// Initialize DB Connection
connectDB();

// Global Middlewares
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false, // Disable in dev for swagger loading if needed
}));

// CORS Configuration
const getOriginBase = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return urlStr;
  }
};

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  getOriginBase(env.CLIENT_URL).replace(/\/$/, '')
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('onrender.com')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    data: null,
    errors: null,
  },
});
app.use('/api/', limiter);

// Swagger Documentation Route
app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base v1 Routes
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/bikes', bikeRouter);
app.use('/api/v1/bookings', bookingRouter);

// Fallback Route for non-existent API endpoints
app.use('/api/v1/*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    data: null,
    errors: null,
  });
});

// Global Centralized Error Handling
app.use(errorHandler);

// Initialize Socket.io Server
initSocket(server);

// Boot server
const PORT = env.PORT;
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📄 API Docs available at http://localhost:${PORT}/api/v1/api-docs`);
});

// Process rejection/exception logging
process.on('unhandledRejection', (reason: Error) => {
  logger.fatal(reason, `Unhandled Rejection: ${reason.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.fatal(error, `Uncaught Exception: ${error.message}`);
  process.exit(1);
});
