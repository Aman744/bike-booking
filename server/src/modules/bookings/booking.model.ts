import { Schema, model, Document } from 'mongoose';
import { IBooking, IStatusHistory } from 'shared';

export interface IBookingDocument extends Omit<IBooking, '_id'>, Document {
  pendingPayment?: number;
}

const StatusHistorySchema = new Schema<IStatusHistory>({
  status: { type: String, required: true },
  changedBy: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  remark: { type: String }
});

const BookingSchema = new Schema<IBookingDocument>(
  {
    bookingNumber: { type: String, required: true, unique: true },
    bikeId: { type: String, required: true }, // The business bikeId code (e.g. BK0001)
    bikeName: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    
    // Customer Info
    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateMobile: { type: String },
    email: { type: String },
    age: { type: Number, required: true },
    gender: { type: String },
    dob: { type: Date, required: true },
    occupation: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // License Info
    licenseNumber: { type: String, required: true },
    licenseFront: { type: String, required: true }, // Base64 or URL
    licenseBack: { type: String },
    licenseExpiry: { type: Date },
    aadhaarNumber: { type: String, required: true },
    aadhaarFile: { type: String, required: true },
    aadhaarFront: { type: String },
    aadhaarBack: { type: String },
    voterId: { type: String },

    // Hotel & Travel Details
    hotelStay: { type: String },
    destination: { type: String },

    // Booking Details
    bookingType: {
      type: String,
      required: true,
      enum: ['Rental'],
      default: 'Rental',
    },
    bookingDate: { type: Date },
    bookingTime: { type: String },
    duration: { type: String },
    purpose: { type: String },

    // Pickup & Return Timeline details
    pickupDate: { type: Date, required: true },
    pickupTime: { type: String, required: true },
    returnDate: { type: Date, required: true },
    returnTime: { type: String, required: true },

    // Financial components
    perDayRent: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    totalPayment: { type: Number, default: 0 },
    pendingPayment: { type: Number, default: 0 },

    // Emergency Contact
    emergencyName: { type: String },
    emergencyMobile: { type: String },
    relationship: { type: String },

    // State parameters
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Pending Payment', 'Approved', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'Rejected'],
      default: 'Pending',
    },
    adminRemark: { type: String },
    statusHistory: [StatusHistorySchema],
    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const BookingModel = model<IBookingDocument>('Booking', BookingSchema);
export default BookingModel;
