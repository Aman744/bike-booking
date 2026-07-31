import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import logger from '../config/logger.config';
import env from '../config/env.config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.id;
  const { method, originalUrl } = req;
  const ipAddress = req.ip;

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] | null = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'ValidationError') {
    // Mongoose Validation Error
    statusCode = 400;
    message = 'Validation Failed';
    const mongooseErrors = err as any;
    errors = Object.keys(mongooseErrors.errors).map((key) => ({
      field: key,
      message: mongooseErrors.errors[key].message,
    }));
  } else if ((err as any).code === 11000) {
    // Mongoose Duplicate Key Error
    statusCode = 409;
    const field = Object.keys((err as any).keyValue)[0];
    message = `Duplicate field value entered: ${field}`;
    errors = [{ field, message }];
  } else if (err.name === 'CastError') {
    // Mongoose Cast Error (e.g. invalid ObjectId)
    statusCode = 400;
    message = `Invalid format for field: ${(err as any).path}`;
    errors = [{ field: (err as any).path, message: `Invalid ${(err as any).path}` }];
  }

  // Log error using Pino
  logger.error(
    {
      requestId,
      ipAddress,
      route: originalUrl,
      method,
      statusCode,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    `Error occurred during ${method} ${originalUrl}: ${err.message}`
  );

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
  });
};

export default errorHandler;
