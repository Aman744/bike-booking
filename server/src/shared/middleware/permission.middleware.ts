import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const admin = req.admin;
      if (!admin) {
        throw new AppError('Unauthorized. Action requires authentication.', 401);
      }

      // Verify that all required permissions are present
      const hasPermission = requiredPermissions.every((perm) =>
        admin.permissions.includes(perm)
      );

      if (!hasPermission) {
        throw new AppError('Forbidden. Insufficient permissions to access this resource.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requirePermissions;
