import { Schema, model, Document } from 'mongoose';
import { IBike } from 'shared';

export interface IBikeDocument extends Omit<IBike, '_id'>, Omit<Document, 'model'> {}

const BikeSchema = new Schema<IBikeDocument>(
  {
    bikeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    engineCC: { type: Number, required: true },
    fuelType: { type: String, required: true, default: 'Petrol' },
    color: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Available', 'Booked', 'Maintenance', 'Inactive'],
      default: 'Available',
    },
    image: { type: String, required: true }, // Image URL or Base64 string
    qrCode: { type: String }, // QR Code string representation
    rentPrice: { type: Number, required: true, default: 500 },
    securityDeposit: { type: Number, required: true, default: 1000 },
    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const BikeModel = model<IBikeDocument>('Bike', BikeSchema);
export default BikeModel;
