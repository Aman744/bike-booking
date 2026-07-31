import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../shared/config/logger.config';
import env from '../shared/config/env.config';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
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
