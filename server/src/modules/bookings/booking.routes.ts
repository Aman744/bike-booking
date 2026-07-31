import { Router } from 'express';
import {
  createBooking,
  getBookingsList,
  getBookingDetails,
  updateBookingStatus,
  getDashboardStats,
  updateBookingDetails,
  getPublicBookingDetails,
  deleteBookingDetails,
} from './booking.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requirePermissions } from '../../shared/middleware/permission.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { PERMISSIONS } from '../../shared/constants/status.constants';
import { bookingSchema } from 'shared';

const router = Router();

// Publicly accessible path for customers submitting booking requests
router.post('/', validateRequest(bookingSchema), createBooking);

// Public route to view customer invoice receipt by reference number
router.get('/reference/:bookingNumber', getPublicBookingDetails);

// Protected routes for admins managing and reading logs
router.get(
  '/stats',
  authMiddleware,
  requirePermissions([PERMISSIONS.BOOKING_READ]),
  getDashboardStats
);

router.get(
  '/',
  authMiddleware,
  requirePermissions([PERMISSIONS.BOOKING_READ]),
  getBookingsList
);

router.get(
  '/:id',
  authMiddleware,
  requirePermissions([PERMISSIONS.BOOKING_READ]),
  getBookingDetails
);

router.put(
  '/:id/status',
  authMiddleware,
  requirePermissions([PERMISSIONS.BOOKING_UPDATE]),
  updateBookingStatus
);

router.put(
  '/:id',
  authMiddleware,
  requirePermissions([PERMISSIONS.BOOKING_UPDATE]),
  updateBookingDetails
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermissions([PERMISSIONS.BOOKING_UPDATE]),
  deleteBookingDetails
);

export default router;
