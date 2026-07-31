import { Router } from 'express';
import {
  login,
  logout,
  getMe,
  register,
  updatePassword,
  forgotPasswordReset,
  getAdminsList,
  updateAdminUser,
  deleteAdminUser,
} from './auth.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requirePermissions } from '../../shared/middleware/permission.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { PERMISSIONS } from '../../shared/constants/status.constants';
import { loginSchema, registerSchema } from 'shared';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate admin user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@dealership.com
 *               password:
 *                 type: string
 *                 example: admin123
 *               rememberMe:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Login successful, cookies set
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', validateRequest(loginSchema), login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout admin and clear session cookies
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Session terminated
 */
router.post('/logout', logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get currently authenticated admin profile details
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token validated, details returned
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authMiddleware, getMe);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new admin account
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@dealership.com
 *               password:
 *                 type: string
 *                 example: secure123
 *               role:
 *                 type: string
 *                 enum: [SuperAdmin, Admin, Manager, Viewer]
 *                 example: Admin
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Account already exists
 */
router.post('/register', validateRequest(registerSchema), register);

// Password Management
router.put('/password', authMiddleware, updatePassword);
router.post('/forgot-password', forgotPasswordReset);

// Staff / Users CRUD Management
router.get('/users', authMiddleware, requirePermissions([PERMISSIONS.SETTINGS_READ]), getAdminsList);
router.put('/users/:id', authMiddleware, requirePermissions([PERMISSIONS.SETTINGS_UPDATE]), updateAdminUser);
router.delete('/users/:id', authMiddleware, requirePermissions([PERMISSIONS.SETTINGS_UPDATE]), deleteAdminUser);

export default router;
