import mongoose, { Schema, Document, Model } from 'mongoose';

export type LicenseStatus = 'ACTIVE' | 'REVOKED';

export interface ILicense extends Document {
  deviceId: string;
  licenseKey: string;
  clientId?: mongoose.Types.ObjectId;
  contractId?: mongoose.Types.ObjectId;
  clientName: string;
  clientPhone?: string;
  status: LicenseStatus;
  generatedById: mongoose.Types.ObjectId;
  generatedByName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>(
  {
    deviceId: { type: String, required: true, trim: true, index: true },
    licenseKey: { type: String, required: true, trim: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract' },
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE' },
    generatedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    generatedByName: { type: String, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const License: Model<ILicense> =
  mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);

export default License;
