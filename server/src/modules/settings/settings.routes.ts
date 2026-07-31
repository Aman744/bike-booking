import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requirePermissions } from '../../shared/middleware/permission.middleware';
import { PERMISSIONS } from '../../shared/constants/status.constants';

const router = Router();

// Publicly retrieve dealership details & constraints
router.get('/', getSettings);

// Guarded dealership settings modification
router.put(
  '/',
  authMiddleware,
  requirePermissions([PERMISSIONS.SETTINGS_UPDATE]),
  updateSettings
);

export default router;
