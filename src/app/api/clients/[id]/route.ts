import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
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
    const { shopName, ownerName, phone, email, address, notes } = body;

    await connectToDatabase();
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (shopName) client.shopName = shopName.trim();
    if (ownerName) client.ownerName = ownerName.trim();
    if (phone) client.phone = phone.trim();
    if (email !== undefined) client.email = email.trim();
    if (address !== undefined) client.address = address.trim();
    if (notes !== undefined) client.notes = notes.trim();

    await client.save();
    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
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
      return NextResponse.json({ error: 'Only Super Admin can delete clients' }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();
    const deleted = await Client.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete client' }, { status: 500 });
  }
}
