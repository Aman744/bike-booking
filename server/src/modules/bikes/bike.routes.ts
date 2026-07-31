import { Router } from 'express';
import {
  createBike,
  getBikesList,
  getBikeDetails,
  getBikeDetailsByBikeId,
  updateBike,
  deleteBike,
  regenerateQR,
  bulkCreateBikes,
} from './bike.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requirePermissions } from '../../shared/middleware/permission.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { PERMISSIONS } from '../../shared/constants/status.constants';
import { bikeSchema, updateBikeSchema } from 'shared';

const router = Router();

// Publicly searchable motorbike listings (needed for customer scanning and admin viewers)
router.get('/', getBikesList);
router.get('/:id', getBikeDetails);
router.get('/code/:bikeId', getBikeDetailsByBikeId);

// Guarded administrative operations
router.post(
  '/',
  authMiddleware,
  requirePermissions([PERMISSIONS.BIKE_CREATE]),
  validateRequest(bikeSchema),
  createBike
);

router.post(
  '/bulk',
  authMiddleware,
  requirePermissions([PERMISSIONS.BIKE_CREATE]),
  bulkCreateBikes
);

router.put(
  '/:id',
  authMiddleware,
  requirePermissions([PERMISSIONS.BIKE_UPDATE]),
  validateRequest(updateBikeSchema),
  updateBike
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermissions([PERMISSIONS.BIKE_UPDATE]), // soft delete requires update permission
  deleteBike
);

router.post(
  '/:id/qr',
  authMiddleware,
  requirePermissions([PERMISSIONS.BIKE_UPDATE]),
  regenerateQR
);

export default router;
