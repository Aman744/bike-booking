import { Schema, model, Document } from 'mongoose';
import { ISettings } from 'shared';

export interface ISettingsDocument extends Omit<ISettings, '_id'>, Document {
  dealershipFavicon?: string;
  defaultPerDayRent?: number;
  defaultSecurityDeposit?: number;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    bookingSlotDurationMinutes: { type: Number, default: 30 },
    allowedBookingHoursStart: { type: String, default: '09:00' },
    allowedBookingHoursEnd: { type: String, default: '18:00' },
    maxBookingsPerBike: { type: Number, default: 5 },
    uploadSizeLimitBytes: { type: Number, default: 5 * 1024 * 1024 }, // 5MB
    dealershipName: { type: String, default: 'Lykan Rides' },
    dealershipLogo: { type: String, default: '' },
    dealershipFavicon: { type: String, default: '' },
    dealershipAddress: { type: String, default: '' },
    dealershipPhone: { type: String, default: '' },
    dealershipEmail: { type: String, default: '' },
    enableSmsNotifications: { type: Boolean, default: false },
    enableEmailNotifications: { type: Boolean, default: true },
    enableWhatsappNotifications: { type: Boolean, default: false },
    colorSystem: { type: String, default: 'blue' },
    defaultPerDayRent: { type: Number, default: 500 },
    defaultSecurityDeposit: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

export const SettingsModel = model<ISettingsDocument>('Settings', SettingsSchema);
export default SettingsModel;
