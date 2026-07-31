import { z } from 'zod';

export const bookingSchema = z.object({
  bikeId: z.string({ required_error: 'Bike identifier is required' }),
  bikeName: z.string({ required_error: 'Bike name snapshot is required' }),
  registrationNumber: z.string({ required_error: 'Registration number snapshot is required' }),

  // Customer Details
  customerName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Full name must be at least 2 characters')
    .trim(),
  mobile: z
    .string({ required_error: 'Mobile number is required' })
    .regex(/^\d{10}$/, 'Mobile number must contain exactly 10 digits'),
  alternateMobile: z
    .string()
    .regex(/^\d{10}$/, 'Alternate mobile number must contain exactly 10 digits')
    .or(z.literal(''))
    .optional(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .or(z.literal(''))
    .optional(),
  age: z
    .number({ required_error: 'Age is required' })
    .min(18, 'Age must be 18 or above to book a bike'),
  gender: z.string().optional(),
  dob: z
    .string({ required_error: 'Date of birth is required' })
    .or(z.date())
    .refine((val) => {
      const birthDate = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18;
    }, 'Date of birth must resolve to age 18 or above'),
  occupation: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),

  // Identity Details
  licenseNumber: z
    .string({ required_error: 'Driving license number is required' })
    .min(5, 'Driving license must be at least 5 characters')
    .trim(),
  licenseFront: z
    .string({ required_error: 'Driving license front copy is required' })
    .min(1, 'Please upload driving license front page'),
  licenseBack: z.string().optional(),
  licenseExpiry: z.string().or(z.date()).optional(),
  aadhaarNumber: z
    .string({ required_error: 'Aadhaar number is required' })
    .regex(/^\d{12}$/, 'Aadhaar number must contain exactly 12 digits'),
  aadhaarFile: z
    .string({ required_error: 'Aadhaar copy is required' })
    .min(1, 'Please upload Aadhaar card copy'),
  aadhaarFront: z.string().optional(),
  aadhaarBack: z.string().optional(),
  voterId: z.string().optional(),

  // Hotel & Travel Details
  hotelStay: z.string().optional(),
  destination: z.string().optional(),

  // Booking Details
  bookingType: z.enum(['Rental'], {
    required_error: 'Please choose booking type',
  }),
  bookingDate: z.string().or(z.date()).optional(),
  bookingTime: z.string().optional(),
  duration: z.string().optional(),
  purpose: z.string().optional(),

  // Pickup & Return Timeline details
  pickupDate: z
    .string({ required_error: 'Pickup date is required' })
    .or(z.date()),
  pickupTime: z
    .string({ required_error: 'Pickup time is required' })
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please specify time as HH:MM'),
  returnDate: z
    .string({ required_error: 'Return date is required' })
    .or(z.date()),
  returnTime: z
    .string({ required_error: 'Return time is required' })
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please specify time as HH:MM'),

  // Financial components
  perDayRent: z.number().optional(),
  securityDeposit: z.number().optional(),
  totalPayment: z.number().optional(),

  // Emergency contact
  emergencyName: z.string().optional(),
  emergencyMobile: z
    .string()
    .regex(/^\d{10}$/, 'Emergency contact mobile must contain exactly 10 digits')
    .or(z.literal(''))
    .optional(),
  relationship: z.string().optional(),

  // Declarations
  confirmCorrect: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that all details are correct' }),
  }),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
  }),
});

export type BookingInput = z.infer<typeof bookingSchema>;
