import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.config';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { ip, method, originalUrl } = req;
  const requestId = req.id;
  const userAgent = req.get('user-agent') || '';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const userId = (req as any).admin?._id || 'anonymous';

    logger.info(
      {
        requestId,
        userId,
        ipAddress: ip,
        route: originalUrl,
        method,
        statusCode,
        executionTime: `${duration}ms`,
        userAgent,
      },
      `${method} ${originalUrl} ${statusCode} - ${duration}ms`
    );
  });

  next();
};

export default loggerMiddleware;
