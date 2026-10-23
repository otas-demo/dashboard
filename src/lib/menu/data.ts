import connectToDatabase from '@/lib/mongodb';
import MenuSettings from '@/models/MenuSettings';
import { DEFAULT_MENU } from '@/lib/menu/defaults';
import { migrateMenu } from '@/lib/menu/migrate';
import type { MenuData } from '@/lib/menu/types';

export interface StoredMenu {
  data: MenuData;
  updatedAt: Date | null; // null until the menu is saved for the first time
  updatedByName: string | null;
  migrated: boolean;
}

let lastGoodMenu: MenuData | null = null;

export function getLastGoodMenu(): MenuData | null {
  return lastGoodMenu;
}

export function setLastGoodMenu(data: MenuData): void {
  lastGoodMenu = structuredClone(data);
}

/** The saved menu, or the built-in defaults when nothing has been saved yet. */
export async function getMenu(options?: { allowMigrationFallback?: boolean }): Promise<StoredMenu> {
  await connectToDatabase();
  const doc = await MenuSettings.findOne({ key: 'main' }).lean();
  if (!doc) {
    const data = structuredClone(DEFAULT_MENU);
    lastGoodMenu = structuredClone(data);
    return { data, updatedAt: null, updatedByName: null, migrated: false };
  }

  let data = doc.data as MenuData;
  let migrated = false;
  const rawData = doc.data as unknown as Record<string, unknown> | null;

  if (!rawData || rawData.schemaVersion !== 2) {
    migrated = true;
    try {
      data = migrateMenu(doc.data);
    } catch (error) {
      if (options?.allowMigrationFallback) {
        console.error('Menu migration failed, falling back to new defaults for editor:', error);
        data = structuredClone(DEFAULT_MENU);
        return {
          data,
          updatedAt: doc.updatedAt,
          updatedByName: doc.updatedByName ?? null,
          migrated: true,
        };
      }
      throw error;
    }
  }

  lastGoodMenu = structuredClone(data);
  return {
    data,
    updatedAt: doc.updatedAt,
    updatedByName: doc.updatedByName ?? null,
    migrated,
  };
}
