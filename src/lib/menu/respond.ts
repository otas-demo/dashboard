import { getLastGoodMenu, getMenu } from '@/lib/menu/data';
import { renderMenuPage } from '@/lib/menu/render';
import type { MenuPageKey } from '@/lib/menu/templates';
import type { MenuData } from '@/lib/menu/types';

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  // always serve the latest prices
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const UNAVAILABLE_PAGE = `<!doctype html><html lang="my"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Auto Shop Menu</title></head>
<body style="font-family:sans-serif;padding:40px 16px;text-align:center;color:#334155">
<h1 style="font-size:20px">Menu is temporarily unavailable</h1><p>ခဏနေမှ ပြန်ဖွင့်ကြည့်ပေးပါ။</p></body></html>`;

// When a remembered menu exists, customers get it after this long instead of waiting on a slow database.
const FALLBACK_AFTER_MS = 4000;

function rejectAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`Menu load timed out after ${ms}ms`)), ms));
}

/**
 * The menu for public pages and the public API. If the database is slow or down, returns
 * the last menu this server loaded; throws only when there is none. Never returns the
 * built-in defaults as a fallback: customers must not see outdated numbers.
 */
export async function loadPublicMenu(): Promise<MenuData> {
  try {
    // Without a remembered menu there is nothing to fall back to, so wait for the database
    // (bounded by the connection timeout) rather than failing a slow first connection.
    const load = getMenu();
    const { data } = await (getLastGoodMenu() ? Promise.race([load, rejectAfter(FALLBACK_AFTER_MS)]) : load);
    return data;
  } catch (error) {
    const fallback = getLastGoodMenu();
    if (!fallback) throw error;
    console.warn('Menu failed to load from DB, serving lastGoodMenu:', error);
    return fallback;
  }
}

/** Public, login-free HTML response for one menu page. */
export async function menuPageResponse(key: MenuPageKey): Promise<Response> {
  try {
    const data = await loadPublicMenu();
    return new Response(renderMenuPage(key, data), { headers: HTML_HEADERS });
  } catch (error) {
    console.error(`Menu page "${key}" failed:`, error);
    return new Response(UNAVAILABLE_PAGE, { status: 503, headers: HTML_HEADERS });
  }
}
