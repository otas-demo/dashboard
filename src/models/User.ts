import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'super_admin' | 'staff' | 'admin' | 'user';

export interface IUser extends Document {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true, default: '' },
    username: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'staff', 'admin', 'user'], default: 'staff' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
