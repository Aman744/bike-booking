import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../shared/config/logger.config';
import env from '../shared/config/env.config';

let io: Server | null = null;

const getOriginBase = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return urlStr;
  }
};

export const initSocket = (server: HttpServer): Server => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    getOriginBase(env.CLIENT_URL).replace(/\/$/, '')
  ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('onrender.com')) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  logger.info('Socket.IO server initialized');

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

export const emitToAll = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
    logger.debug({ event }, `Socket emit: ${event}`);
  } else {
    logger.warn(`Socket.IO not initialized. Event bypassed: ${event}`);
  }
};
export default initSocket;
