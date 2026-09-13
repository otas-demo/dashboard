import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
  shopName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  source: 'manual' | 'migrated';
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    source: { type: String, enum: ['manual', 'migrated'], default: 'manual' },
  },
  { timestamps: true }
);

export const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default Client;
