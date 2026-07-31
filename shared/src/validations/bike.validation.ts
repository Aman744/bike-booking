import { z } from 'zod';

export const bikeSchema = z.object({
  bikeId: z
    .string({ required_error: 'Bike ID is required' })
    .min(3, 'Bike ID must be at least 3 characters')
    .max(20, 'Bike ID cannot exceed 20 characters')
    .trim(),
  name: z
    .string({ required_error: 'Bike name is required' })
    .min(2, 'Bike name must be at least 2 characters')
    .trim(),
  brand: z
    .string({ required_error: 'Brand is required' })
    .min(2, 'Brand must be at least 2 characters')
    .trim(),
  model: z
    .string({ required_error: 'Model is required' })
    .min(2, 'Model must be at least 2 characters')
    .trim(),
  registrationNumber: z
    .string({ required_error: 'Registration number is required' })
    .min(5, 'Registration number must be at least 5 characters')
    .trim(),
  engineCC: z
    .number({ required_error: 'Engine CC is required' })
    .positive('Engine CC must be a positive number'),
  fuelType: z
    .string({ required_error: 'Fuel type is required' })
    .min(3, 'Fuel type is required')
    .trim(),
  color: z
    .string({ required_error: 'Color is required' })
    .min(2, 'Color is required')
    .trim(),
  status: z.enum(['Available', 'Booked', 'Maintenance', 'Inactive']).default('Available'),
  image: z
    .string({ required_error: 'Bike image is required' })
    .url('Please provide a valid image URL'),
  rentPrice: z.number().optional().default(500),
  securityDeposit: z.number().optional().default(1000),
});

export const updateBikeSchema = bikeSchema.partial().extend({
  // Allows updating subset of fields
});

export type BikeInput = z.infer<typeof bikeSchema>;
