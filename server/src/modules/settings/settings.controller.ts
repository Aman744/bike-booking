import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';

const settingsService = new SettingsService();

export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await settingsService.getSettings();

    res.status(200).json({
      success: true,
      message: 'Settings retrieved successfully',
      data: { settings },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await settingsService.updateSettings(req.body);

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: { settings },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};
