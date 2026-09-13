import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const source = searchParams.get('source')?.trim();

    const query: any = {};
    if (source && (source === 'manual' || source === 'migrated')) {
      query.source = source;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { shopName: regex },
        { ownerName: regex },
        { phone: regex },
        { address: regex },
        { email: regex },
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 }).limit(300).lean();
    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { shopName, ownerName, phone, email, address, notes, source } = body;

    if (!shopName || !ownerName || !phone) {
      return NextResponse.json({ error: 'Shop Name, Owner Name, and Phone are required' }, { status: 400 });
    }

    const client = await Client.create({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      address: address?.trim() || '',
      notes: notes?.trim() || '',
      source: source || 'manual',
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}
