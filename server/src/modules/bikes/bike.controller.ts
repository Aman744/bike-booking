import { Request, Response, NextFunction } from 'express';
import { BikeService } from './bike.service';

const bikeService = new BikeService();

export const createBike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bike = await bikeService.createBike(req.body);

    res.status(201).json({
      success: true,
      message: 'Motorbike registered successfully in inventory',
      data: { bike },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getBikesList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { search, brand, status } = req.query;

    const { bikes, total } = await bikeService.getBikesList({ search, brand, status }, page, limit);

    res.status(200).json({
      success: true,
      message: 'Motorbikes retrieved successfully',
      data: {
        bikes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getBikeDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const bike = await bikeService.getBikeById(id);

    res.status(200).json({
      success: true,
      message: 'Motorbike details retrieved successfully',
      data: { bike },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getBikeDetailsByBikeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bikeId } = req.params;
    const bike = await bikeService.getBikeByBikeId(bikeId);

    res.status(200).json({
      success: true,
      message: 'Motorbike details retrieved successfully',
      data: { bike },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const bike = await bikeService.updateBike(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Motorbike details updated successfully',
      data: { bike },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await bikeService.deleteBike(id);

    res.status(200).json({
      success: true,
      message: 'Motorbike removed from inventory successfully',
      data: null,
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const qrCode = await bikeService.regenerateQR(id);

    res.status(200).json({
      success: true,
      message: 'QR code regenerated successfully',
      data: { qrCode },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateBikes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bikes } = req.body;
    if (!Array.isArray(bikes) || bikes.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Request body must contain a non-empty array of bikes',
        data: null,
        errors: ['Invalid request format'],
      });
      return;
    }

    const createdBikes = await bikeService.bulkCreateBikes(bikes);

    res.status(201).json({
      success: true,
      message: `${createdBikes.length} motorbikes registered successfully`,
      data: { bikes: createdBikes },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};
