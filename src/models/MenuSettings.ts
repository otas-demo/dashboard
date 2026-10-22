import mongoose, { Schema, Document, Model } from 'mongoose';
import type { MenuData } from '@/lib/menu/types';

export interface IMenuSettings extends Document {
  key: string; // always 'main' — the menu is a single document
  data: MenuData;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSettingsSchema = new Schema<IMenuSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'main' },
    // validated by validateMenuUpdate() before every save
    data: { type: Schema.Types.Mixed, required: true },
    updatedByName: { type: String, trim: true },
  },
  { timestamps: true, minimize: false }
);

export const MenuSettings: Model<IMenuSettings> =
  mongoose.models.MenuSettings || mongoose.model<IMenuSettings>('MenuSettings', MenuSettingsSchema);

export default MenuSettings;
