import mongoose, { Schema, Document, Model } from 'mongoose';

export type ContractStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface IContract extends Document {
  fullName: string;
  phoneNumber: string;
  position: string;
  businessName: string;
  signature?: string;
  agreed: boolean;
  plan: string;
  duration: number;
  startDate: string;
  status: ContractStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    position: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    signature: {
      type: String,
      required: false,
    },
    agreed: {
      type: Boolean,
      required: true,
      default: false,
    },
    plan: {
      type: String,
      required: true,
      trim: true,
      default: 'basic',
    },
    duration: {
      type: Number,
      required: true,
      default: 1,
    },
    startDate: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

ContractSchema.index({ businessName: 1 });
ContractSchema.index({ phoneNumber: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ createdAt: -1 });

export const Contract: Model<IContract> =
  mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;
