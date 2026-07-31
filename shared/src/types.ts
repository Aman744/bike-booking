export type BikeStatus = 'Available' | 'Booked' | 'Maintenance' | 'Inactive';

export type BookingType = 'Test Ride' | 'Rental' | 'Service' | 'Inquiry';

export type BookingStatus =
  | 'Pending'
  | 'Pending Payment'
  | 'Approved'
  | 'Checked In'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export interface IStatusHistory {
  status: BookingStatus;
  changedBy: string; // Admin name or "System"
  timestamp: Date | string;
  remark?: string;
}

export interface IBike {
  _id?: string;
  bikeId: string; // e.g. BK0001
  name: string;
  brand: string;
  model: string;
  registrationNumber: string;
  engineCC: number;
  fuelType: string;
  color: string;
  status: BikeStatus;
  image: string; // Cloudinary URL
  qrCode?: string; // Cloudinary URL or generated
  rentPrice?: number;
  securityDeposit?: number;
  isDeleted: boolean;
  deletedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IBooking {
  _id?: string;
  bookingNumber: string; // e.g. BKG-20260731-00001
  bike?: string | IBike; // ObjectId or full details
  bikeId: string;
  bikeName: string;
  registrationNumber: string;

  // Customer details
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  age: number;
  gender?: string;
  dob: Date | string;
  occupation?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Identity details
  licenseNumber: string;
  licenseFront: string;
  licenseBack?: string;
  licenseExpiry?: Date | string;
  aadhaarNumber?: string;
  aadhaarFile?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  voterId?: string;

  // Hotel & Travel Details
  hotelStay?: string;
  destination?: string;

  // Booking details
  bookingType: BookingType;
  bookingDate: Date | string;
  bookingTime: string;
  duration?: string;
  purpose?: string;

  // Pickup & Return Timeline details
  pickupDate: Date | string;
  pickupTime: string;
  returnDate: Date | string;
  returnTime: string;

  // Financial components
  perDayRent?: number;
  securityDeposit?: number;
  totalPayment?: number;
  pendingPayment?: number;

  // Emergency contact
  emergencyName?: string;
  emergencyMobile?: string;
  relationship?: string;

  // Status logs
  status: BookingStatus;
  adminRemark?: string;
  statusHistory: IStatusHistory[];

  isDeleted: boolean;
  deletedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IAdmin {
  _id?: string;
  name: string;
  email: string;
  role: string; // e.g. SuperAdmin, Admin, Manager, Viewer
  permissions: string[]; // e.g. ["booking.read", "booking.update"]
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ISettings {
  _id?: string;
  bookingSlotDurationMinutes: number;
  allowedBookingHoursStart: string; // e.g. "09:00"
  allowedBookingHoursEnd: string; // e.g. "18:00"
  maxBookingsPerBike: number;
  uploadSizeLimitBytes: number;
  dealershipName: string;
  dealershipLogo?: string;
  dealershipFavicon?: string;
  dealershipAddress?: string;
  dealershipPhone?: string;
  dealershipEmail?: string;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
  enableWhatsappNotifications: boolean;
  colorSystem?: string;
  defaultPerDayRent?: number;
  defaultSecurityDeposit?: number;
  updatedAt?: Date | string;
}

export interface IAuditLog {
  _id?: string;
  adminId: string;
  adminName: string;
  action: string;
  entity: 'Bike' | 'Booking' | 'Admin' | 'Settings' | 'Auth';
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp: Date | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: Array<{ field: string; message: string }> | null;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
