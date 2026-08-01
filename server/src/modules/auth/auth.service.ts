import jwt from 'jsonwebtoken';
import { AdminRepository } from './auth.repository';
import { IAdminDocument } from './admin.model';
import env from '../../shared/config/env.config';
import logger from '../../shared/config/logger.config';
import { ROLE_PERMISSIONS, ROLES } from '../../shared/constants/status.constants';
import { AppError } from '../../shared/utils/appError';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private adminRepository = new AdminRepository();

  constructor() {
    this.seedDefaultAdmin();
  }

  // Seed default Admin if none exists
  private async seedDefaultAdmin(): Promise<void> {
    try {
      const count = await this.adminRepository.countAdmins();
      if (count === 0) {
        const seedEmail = process.env.SEED_ADMIN_EMAIL || 'admin@lykanrides.com';
        const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123';
        logger.info('No admins found. Seeding default SuperAdmin account...');
        await this.adminRepository.create({
          name: 'Super Admin',
          email: seedEmail,
          password: seedPassword, // Will be hashed by pre-save hook
          role: ROLES.SUPER_ADMIN,
          permissions: ROLE_PERMISSIONS[ROLES.SUPER_ADMIN],
        });
        logger.info(`✅ Default SuperAdmin seeded. Use SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars to customize.`);
      }
    } catch (error: any) {
      logger.error(error, 'Failed to seed default admin user');
    }
  }

  // Login authentication
  async login(email: string, password: string): Promise<{ admin: Partial<IAdminDocument>; tokens: AuthTokens }> {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWTs
    const accessToken = jwt.sign(
      { id: admin._id, role: admin.role, permissions: admin.permissions },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRE as any }
    );

    const refreshToken = jwt.sign(
      { id: admin._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRE as any }
    );

    return {
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  // Fetch admin by ID for Me endpoint
  async getAdminById(id: string): Promise<Partial<IAdminDocument> | null> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) return null;
    return {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };
  }

  // Create a new administrative account
  async register(
    name: string,
    email: string,
    password: string,
    role: string
  ): Promise<Partial<IAdminDocument>> {
    const existing = await this.adminRepository.findByEmail(email);
    if (existing) {
      throw new AppError('An administrative account with this email already exists', 409);
    }

    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.VIEWER];

    const admin = await this.adminRepository.create({
      name,
      email,
      password,
      role,
      permissions,
    });

    return {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };
  }

  // Change password for active admin
  async changePassword(adminId: string, currentPass: string, newPass: string): Promise<void> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AppError('Admin account not found', 404);
    }

    const isMatch = await admin.comparePassword(currentPass);
    if (!isMatch) {
      throw new AppError('Incorrect current password entered', 400);
    }

    admin.password = newPass;
    await admin.save();
  }

  // Directly reset password by email (for dev simulations / forgot password endpoint)
  async resetPasswordDirect(email: string, newPass: string): Promise<void> {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      throw new AppError('No administrative account found with this email', 404);
    }

    admin.password = newPass;
    await admin.save();
  }

  // Retrieve list of all registered admins
  async getAllAdmins(): Promise<Partial<IAdminDocument>[]> {
    const admins = await this.adminRepository.findAll();
    return admins.map((admin) => ({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      createdAt: admin.createdAt,
    }));
  }

  // Update administrative user role or fields
  async updateAdmin(id: string, data: any): Promise<Partial<IAdminDocument>> {
    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name;
    if (data.password) updatePayload.password = data.password;
    if (data.role) {
      updatePayload.role = data.role;
      updatePayload.permissions = ROLE_PERMISSIONS[data.role] || ROLE_PERMISSIONS[ROLES.VIEWER];
    }

    const admin = await this.adminRepository.update(id, updatePayload);
    if (!admin) {
      throw new AppError('Admin account not found', 404);
    }

    return {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };
  }

  // Remove admin user
  async deleteAdmin(id: string): Promise<void> {
    const result = await this.adminRepository.delete(id);
    if (!result) {
      throw new AppError('Admin account not found', 404);
    }
  }
}

export default AuthService;
