import type { MenuData } from '@/lib/menu/types';
import defaults from '@/lib/menu/defaults.json';
import defaultsV1 from '@/lib/menu/defaults-v1.json';

/**
 * The menu as it was in the original static HTML (October 2026 price list).
 * Used until a super admin saves the menu for the first time.
 */
export const DEFAULT_MENU = defaults as unknown as MenuData;

/**
 * The v1 default menu, used when migrating an already-saved v1 menu document to schemaVersion 2.
 */
export const DEFAULT_MENU_V1 = defaultsV1;
