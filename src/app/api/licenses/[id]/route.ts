import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import License from '@/models/License';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes, clientName, clientPhone } = body;

    await connectToDatabase();
    const license = await License.findById(id);
    if (!license) {
      return NextResponse.json({ error: 'License record not found' }, { status: 404 });
    }

    if (status && (status === 'ACTIVE' || status === 'REVOKED')) {
      license.status = status;
    }
    if (notes !== undefined) license.notes = notes;
    if (clientName) license.clientName = clientName;
    if (clientPhone !== undefined) license.clientPhone = clientPhone;

    await license.save();

    return NextResponse.json({ success: true, license });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update license' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admin can delete license records' }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();
    const deleted = await License.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'License deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete license' }, { status: 500 });
  }
}
