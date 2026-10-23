import { NextRequest, NextResponse } from 'next/server';
import { loadPublicMenu } from '@/lib/menu/respond';
import { isMenuPageKey, menuPageValues } from '@/lib/menu/render';

// Public, read-only menu values for the standalone menu site (a static site on another
// domain). No login: it returns only what the public menu pages show anyway.
// The site serves pages at its root and Thant's images under /img/.
const STATIC_SITE_RENDER = { linkBase: '', assetBase: '/' };

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// GET /api/public/menu?page=index|commercial|enterprise|custom|hardware|ai-facebook|ai-telegram|ai-viber
export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') || '';
  if (!isMenuPageKey(page)) {
    return withCors(NextResponse.json({ error: 'Unknown page' }, { status: 400 }));
  }

  try {
    const data = await loadPublicMenu();
    return withCors(NextResponse.json({ page, values: menuPageValues(page, data, STATIC_SITE_RENDER) }));
  } catch (error) {
    console.error('Public menu API failed:', error);
    return withCors(NextResponse.json({ error: 'Menu temporarily unavailable' }, { status: 503 }));
  }
}
