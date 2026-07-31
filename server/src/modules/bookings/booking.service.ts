import { BookingRepository } from './booking.repository';
import { BookingModel, IBookingDocument } from './booking.model';
import { BikeModel } from '../bikes/bike.model';
import { SettingsModel } from '../settings/settings.model';
import { emitToAll } from '../../socket/socket';
import AppError from '../../shared/utils/appError';

export class BookingService {
  private bookingRepository = new BookingRepository();

  // Generate serial booking numbers like BKG-YYYYMMDD-XXXXX
  private async generateBookingNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // Count bookings created today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await BookingModel.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const sequence = (count + 1).toString().padStart(5, '0');
    return `BKG-${dateStr}-${sequence}`;
  }

  // Create booking
  async createBooking(bookingData: Partial<IBookingDocument>): Promise<IBookingDocument> {
    // 1. Resolve selected motorbike
    const bike = await BikeModel.findOne({ bikeId: bookingData.bikeId, isDeleted: false });
    if (!bike) {
      throw new AppError('The selected motorbike does not exist or has been removed', 404);
    }

    // 2. Validate availability for Rentals
    if (bookingData.bookingType === 'Rental') {
      if (bike.status !== 'Available') {
        throw new AppError('The selected vehicle is currently booked, inactive, or in maintenance', 400);
      }

      // Update bike status to Booked atomically
      bike.status = 'Booked';
      await bike.save();
    }

    // Prepopulate bike metadata in booking
    bookingData.bikeName = bike.name;
    bookingData.registrationNumber = bike.registrationNumber;

    // Fill backwards compatibility fields
    bookingData.bookingDate = bookingData.pickupDate;
    bookingData.bookingTime = bookingData.pickupTime;

    // Calculate dynamic pricing parameters
    if (bookingData.bookingType === 'Rental') {
      const settings = await SettingsModel.findOne({});
      const rent = bookingData.perDayRent !== undefined 
        ? bookingData.perDayRent 
        : (bike.rentPrice || settings?.defaultPerDayRent || 500);
      const deposit = bookingData.securityDeposit !== undefined 
        ? bookingData.securityDeposit 
        : (bike.securityDeposit || settings?.defaultSecurityDeposit || 1000);

      const start = new Date(bookingData.pickupDate as any);
      const end = new Date(bookingData.returnDate as any);
      const diffTime = end.getTime() - start.getTime();
      const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      bookingData.perDayRent = rent;
      bookingData.securityDeposit = deposit;
      bookingData.totalPayment = (days * rent) + deposit;
      const hasPendingVal = bookingData.pendingPayment !== undefined && bookingData.pendingPayment !== null && !isNaN(bookingData.pendingPayment);
      bookingData.pendingPayment = hasPendingVal ? bookingData.pendingPayment : bookingData.totalPayment;
      bookingData.duration = `${days} Day${days > 1 ? 's' : ''}`;
    } else {
      bookingData.perDayRent = 0;
      bookingData.securityDeposit = 0;
      bookingData.totalPayment = 0;
      bookingData.pendingPayment = 0;
      bookingData.duration = '1 Hour';
    }

    // 3. Generate booking serial number
    const bookingNumber = await this.generateBookingNumber();
    bookingData.bookingNumber = bookingNumber;

    // 4. Initialize status details
    const initialStatus = bookingData.status || 'Pending';
    const creator = bookingData.status ? 'Admin' : 'Customer';
    const initialRemark = bookingData.status 
      ? `Booking registered manually with status: ${initialStatus}.`
      : 'Booking request submitted online.';

    bookingData.status = initialStatus;
    bookingData.statusHistory = [
      {
        status: initialStatus,
        changedBy: creator,
        timestamp: new Date(),
        remark: initialRemark,
      },
    ];

    // Save booking to Database
    const booking = await this.bookingRepository.create(bookingData);

    // 5. Emit Socket.IO real-time event to Admin dashboard
    emitToAll('newBooking', booking);

    return booking;
  }

  // Get list of bookings
  async getBookingsList(
    filter: any = {},
    page: number = 1,
    limit: number = 10,
    sort: any = { createdAt: -1 }
  ): Promise<{ bookings: IBookingDocument[]; total: number }> {
    const queryFilter: any = {};

    if (filter.search) {
      queryFilter.$or = [
        { bookingNumber: { $regex: filter.search, $options: 'i' } },
        { customerName: { $regex: filter.search, $options: 'i' } },
        { mobile: { $regex: filter.search, $options: 'i' } },
        { bikeId: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.status) {
      if (typeof filter.status === 'string' && filter.status.includes(',')) {
        queryFilter.status = { $in: filter.status.split(',') };
      } else {
        queryFilter.status = filter.status;
      }
    }

    if (filter.bookingType) {
      queryFilter.bookingType = filter.bookingType;
    }

    return this.bookingRepository.findAll(queryFilter, page, limit, sort);
  }

  // Get details of a single booking
  async getBookingById(id: string): Promise<IBookingDocument> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Booking details not found', 404);
    }
    return booking;
  }

  // Get details of a booking by reference code
  async getBookingByNumber(bookingNumber: string): Promise<IBookingDocument | null> {
    return BookingModel.findOne({ bookingNumber, isDeleted: false });
  }

  // Update booking status (with auto-release trigger for bike status)
  async updateBookingStatus(
    id: string,
    status: string,
    changedBy: string,
    remark?: string
  ): Promise<IBookingDocument> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Booking details not found', 404);
    }

    const previousStatus = booking.status;
    booking.status = status as any;
    
    // Append to status change audit history logs
    booking.statusHistory.push({
      status: status as any,
      changedBy,
      timestamp: new Date(),
      remark: remark || `Booking status updated from ${previousStatus} to ${status}.`,
    });

    const updatedBooking = await this.bookingRepository.update(id, {
      status: status as any,
      statusHistory: booking.statusHistory,
      adminRemark: remark,
    } as any);

    if (!updatedBooking) {
      throw new AppError('Failed to update booking status', 500);
    }

    // Business Logic: If booking status is Completed, Cancelled, or Rejected, release bike status back to Available
    if (['Completed', 'Cancelled', 'Rejected'].includes(status)) {
      await BikeModel.findOneAndUpdate(
        { bikeId: booking.bikeId },
        { $set: { status: 'Available' } }
      );
    }

    // Emit live event update
    emitToAll('bookingUpdate', updatedBooking);

    return updatedBooking;
  }

  // Update booking details completely (with sync locks for vehicle statuses)
  async updateBooking(id: string, updateData: any, changedBy: string): Promise<IBookingDocument> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Booking details not found', 404);
    }

    const oldBikeId = booking.bikeId;
    const newBikeId = updateData.bikeId || oldBikeId;
    const oldType = booking.bookingType;
    const newType = updateData.bookingType || oldType;
    const oldStatus = booking.status;
    const newStatus = updateData.status || oldStatus;

    // 1. If changing the bikeId selection
    if (newBikeId !== oldBikeId) {
      const newBike = await BikeModel.findOne({ bikeId: newBikeId, isDeleted: false });
      if (!newBike) {
        throw new AppError('The selected motorbike does not exist', 404);
      }

      // If the booking is active and new bike is not available, block it
      if (newType === 'Rental' && !['Completed', 'Cancelled', 'Rejected'].includes(newStatus)) {
        if (newBike.status !== 'Available') {
          throw new AppError('The selected new motorbike is already booked or unavailable', 400);
        }
        // Lock new bike
        newBike.status = 'Booked';
        await newBike.save();
      }

      // Release old bike status
      if (oldType === 'Rental' && !['Completed', 'Cancelled', 'Rejected'].includes(oldStatus)) {
        await BikeModel.findOneAndUpdate(
          { bikeId: oldBikeId },
          { $set: { status: 'Available' } }
        );
      }

      // Update snapshot details in booking record
      updateData.bikeName = newBike.name;
      updateData.registrationNumber = newBike.registrationNumber;
    }
    // 2. If status or booking type changed of the same bike
    else if (newStatus !== oldStatus || newType !== oldType) {
      const bike = await BikeModel.findOne({ bikeId: oldBikeId });
      if (bike) {
        // If transitioning into active Rental state
        if (newType === 'Rental' && !['Completed', 'Cancelled', 'Rejected'].includes(newStatus)) {
          const wasLocked = oldType === 'Rental' && !['Completed', 'Cancelled', 'Rejected'].includes(oldStatus);
          if (!wasLocked) {
            if (bike.status !== 'Available') {
              throw new AppError('The selected motorbike is already booked or unavailable', 400);
            }
            bike.status = 'Booked';
            await bike.save();
          }
        }
        // If transitioning out of active Rental
        else {
          const wasLocked = oldType === 'Rental' && !['Completed', 'Cancelled', 'Rejected'].includes(oldStatus);
          if (wasLocked) {
            bike.status = 'Available';
            await bike.save();
          }
        }
      }
    }

    // Append to status history logs if status changed
    if (updateData.status && updateData.status !== booking.status) {
      booking.statusHistory.push({
        status: updateData.status as any,
        changedBy,
        timestamp: new Date(),
        remark: updateData.adminRemark || `Booking status updated by Admin from ${booking.status} to ${updateData.status}.`,
      });
      updateData.statusHistory = booking.statusHistory;
    }

    // Save modifications
    const updatedBooking = await this.bookingRepository.update(id, updateData);
    if (!updatedBooking) {
      throw new AppError('Failed to update booking details', 500);
    }

    // Emit live event update
    emitToAll('bookingUpdate', updatedBooking);

    return updatedBooking;
  }

  // Delete booking details (with automatic vehicle status release)
  async deleteBooking(id: string): Promise<boolean> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Booking details not found', 404);
    }

    const success = await this.bookingRepository.delete(id);
    if (success) {
      // Release bike back to Available if booking was active
      if (booking.bookingType === 'Rental' && !['Completed', 'Cancelled', 'Rejected'].includes(booking.status)) {
        await BikeModel.findOneAndUpdate(
          { bikeId: booking.bikeId },
          { $set: { status: 'Available' } }
        );
      }
      
      // Emit live event update
      emitToAll('bookingDelete', { id });
    }
    return success;
  }
}

export default BookingService;
