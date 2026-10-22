import { menuPageResponse } from '@/lib/menu/respond';

// Public price menu (no login) — the link sent to customers.
export async function GET() {
  return menuPageResponse('index');
}
