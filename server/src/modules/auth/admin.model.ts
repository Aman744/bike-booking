import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IAdmin } from 'shared';

export interface IAdminDocument extends Omit<IAdmin, '_id'>, Document {
  password?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdminDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'Admin' },
    permissions: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

// Hash password pre-save if modified
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin = model<IAdminDocument>('Admin', adminSchema);
export default Admin;
