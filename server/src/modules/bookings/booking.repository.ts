import { BookingModel, IBookingDocument } from './booking.model';

export class BookingRepository {
  async findById(id: string): Promise<IBookingDocument | null> {
    return BookingModel.findOne({ _id: id, isDeleted: false });
  }

  async findByBookingNumber(bookingNumber: string): Promise<IBookingDocument | null> {
    return BookingModel.findOne({ bookingNumber, isDeleted: false });
  }

  async create(bookingData: Partial<IBookingDocument>): Promise<IBookingDocument> {
    const booking = new BookingModel(bookingData);
    return booking.save();
  }

  async update(id: string, bookingData: Partial<IBookingDocument>): Promise<IBookingDocument | null> {
    return BookingModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: bookingData },
      { new: true }
    );
  }

  async findAll(
    filter: any = {},
    page: number = 1,
    limit: number = 10,
    sort: any = { createdAt: -1 }
  ): Promise<{ bookings: IBookingDocument[]; total: number }> {
    const queryFilter = { ...filter, isDeleted: false };
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      BookingModel.find(queryFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      BookingModel.countDocuments(queryFilter),
    ]);

    return { bookings, total };
  }

  async delete(id: string): Promise<boolean> {
    const result = await BookingModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );
    return !!result;
  }

  async countBookings(filter: any = {}): Promise<number> {
    return BookingModel.countDocuments({ ...filter, isDeleted: false });
  }
}

export default BookingRepository;
