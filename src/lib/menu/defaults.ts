import type { MenuData } from '@/lib/menu/types';
import defaults from '@/lib/menu/defaults.json';

/**
 * The menu as it was in the original static HTML (October 2026 price list).
 * Used until a super admin saves the menu for the first time.
 */
export const DEFAULT_MENU = defaults as unknown as MenuData;
