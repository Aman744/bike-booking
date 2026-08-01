import { Request, Response, NextFunction } from 'express';
import AuthService from './auth.service';
import env from '../../shared/config/env.config';

const authService = new AuthService();

const isProd = env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    const { admin, tokens } = await authService.login(email, password);

    // Adjust cookie ages if rememberMe is checked
    const customCookieOptions = { ...cookieOptions };
    const customRefreshCookieOptions = { ...refreshCookieOptions };
    
    if (!rememberMe) {
      // Session cookies (clear when browser closes)
      delete (customCookieOptions as any).maxAge;
      delete (customRefreshCookieOptions as any).maxAge;
    }

    res.cookie('token', tokens.accessToken, customCookieOptions);
    res.cookie('refreshToken', tokens.refreshToken, customRefreshCookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { admin },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: null,
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = (req as any).admin?.id;
    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
        data: null,
        errors: null,
      });
      return;
    }

    const admin = await authService.getAdminById(adminId);
    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
        data: null,
        errors: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Session verified',
      data: { admin },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const admin = await authService.register(name, email, password, role);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: { admin },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = (req as any).admin?.id;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(adminId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: null,
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    await authService.resetPasswordDirect(email, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
      data: null,
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admins = await authService.getAllAdmins();

    res.status(200).json({
      success: true,
      message: 'Administrators list retrieved successfully',
      data: { admins },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const admin = await authService.updateAdmin(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Admin account updated successfully',
      data: { admin },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await authService.deleteAdmin(id);

    res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully',
      data: null,
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};
