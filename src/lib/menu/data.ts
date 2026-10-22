import connectToDatabase from '@/lib/mongodb';
import MenuSettings from '@/models/MenuSettings';
import { DEFAULT_MENU } from '@/lib/menu/defaults';
import type { MenuData } from '@/lib/menu/types';

export interface StoredMenu {
  data: MenuData;
  updatedAt: Date | null; // null until the menu is saved for the first time
  updatedByName: string | null;
}

/** The saved menu, or the built-in defaults when nothing has been saved yet. */
export async function getMenu(): Promise<StoredMenu> {
  await connectToDatabase();
  const doc = await MenuSettings.findOne({ key: 'main' }).lean();
  if (!doc) {
    return { data: structuredClone(DEFAULT_MENU), updatedAt: null, updatedByName: null };
  }
  return { data: doc.data, updatedAt: doc.updatedAt, updatedByName: doc.updatedByName ?? null };
}
