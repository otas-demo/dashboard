import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MenuSettings from '@/models/MenuSettings';
import { getAuthUser } from '@/lib/auth';
import { getMenu, setLastGoodMenu } from '@/lib/menu/data';
import { MenuValidationError, validateMenuUpdate } from '@/lib/menu/validate';
import { isR2Configured } from '@/lib/r2';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const menu = await getMenu({ allowMigrationFallback: true });
    return NextResponse.json({ success: true, ...menu, uploadsEnabled: isR2Configured() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load menu' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access forbidden: Super Admin required' }, { status: 403 });
    }

    const body = await req.json();
    const current = await getMenu({ allowMigrationFallback: true });
    const data = validateMenuUpdate(body.data, current.data);

    await connectToDatabase();
    const saved = await MenuSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: { data, updatedByName: auth.name } },
      { upsert: true, returnDocument: 'after' }
    ).lean();

    setLastGoodMenu(saved!.data);

    return NextResponse.json({
      success: true,
      data: saved!.data,
      updatedAt: saved!.updatedAt,
      updatedByName: saved!.updatedByName,
      migrated: false,
    });
  } catch (error: any) {
    if (error instanceof MenuValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to save menu' }, { status: 500 });
  }
}
