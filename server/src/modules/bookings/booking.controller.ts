import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { BookingModel } from './booking.model';
import { BikeModel } from '../bikes/bike.model';
import AppError from '../../shared/utils/appError';

const bookingService = new BookingService();

export const createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const booking = await bookingService.createBooking(req.body);

    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully',
      data: { booking },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { search, status, bookingType, sortBy, sortOrder } = req.query;

    // Build sorting configuration
    const sortField = (sortBy as string) || 'createdAt';
    const sortDirection = (sortOrder as string) === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    const { bookings, total } = await bookingService.getBookingsList(
      { search, status, bookingType },
      page,
      limit,
      sort
    );

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
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

export const getBookingDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id);

    res.status(200).json({
      success: true,
      message: 'Booking details retrieved successfully',
      data: { booking },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicBookingDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bookingNumber } = req.params;
    const booking = await bookingService.getBookingByNumber(bookingNumber);
    if (!booking) {
      throw new AppError('Booking details not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Public booking details retrieved successfully',
      data: { booking },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    
    // The admin performing the action
    const changedBy = (req as any).admin?.name || 'Administrator';

    const booking = await bookingService.updateBookingStatus(id, status, changedBy, remark);

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalBikes = await BikeModel.countDocuments({ isDeleted: false });
    const pendingBookings = await BookingModel.countDocuments({ status: 'Pending', isDeleted: false });
    const approvedBookings = await BookingModel.countDocuments({ status: 'Approved', isDeleted: false });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const todayInquiries = await BookingModel.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false
    });

    const availableCount = await BikeModel.countDocuments({ status: 'Available', isDeleted: false });
    const bookedCount = await BikeModel.countDocuments({ status: 'Booked', isDeleted: false });
    const maintenanceCount = await BikeModel.countDocuments({ status: 'Maintenance', isDeleted: false });
    const inactiveCount = await BikeModel.countDocuments({ status: 'Inactive', isDeleted: false });

    const recentBookings = await BookingModel.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5);

    const rentalsTrendData: { day: string; rentals: number }[] = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = daysOfWeek[d.getDay()];
      
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      
      const count = await BookingModel.countDocuments({
        pickupDate: { $gte: start, $lte: end },
        isDeleted: false
      });
      
      rentalsTrendData.push({ day: dayLabel, rentals: count });
    }

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalBikes,
        pendingBookings,
        approvedBookings,
        todayInquiries,
        bikeStatusDistribution: [
          { name: 'Available', value: availableCount, color: '#3b82f6' },
          { name: 'Booked', value: bookedCount, color: '#10b981' },
          { name: 'Maintenance', value: maintenanceCount, color: '#f59e0b' },
          { name: 'Inactive', value: inactiveCount, color: '#ef4444' }
        ],
        recentBookings,
        rentalsTrendData
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const changedBy = (req as any).admin?.name || 'Administrator';

    const booking = await bookingService.updateBooking(id, req.body, changedBy);

    res.status(200).json({
      success: true,
      message: 'Booking details updated successfully',
      data: { booking },
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBookingDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await bookingService.deleteBooking(id);

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
      data: null,
      errors: null,
    });
  } catch (error) {
    next(error);
  }
};
