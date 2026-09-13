import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import License from '@/models/License';
import { getAuthUser } from '@/lib/auth';
import { generateLicenseKey } from '@/lib/licenseCrypto';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();

    const query: any = {};
    if (status && (status === 'ACTIVE' || status === 'REVOKED')) {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { deviceId: regex },
        { licenseKey: regex },
        { clientName: regex },
        { clientPhone: regex },
        { generatedByName: regex },
      ];
    }

    const licenses = await License.find(query).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ success: true, licenses });
  } catch (error: any) {
    console.error('Fetch licenses error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch licenses' }, { status: 500 });
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
    const { deviceId, clientName, clientPhone, clientId, notes } = body;

    if (!deviceId || !deviceId.trim()) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ error: 'Client / Shop Name is required' }, { status: 400 });
    }

    const cleanDeviceId = deviceId.trim().toUpperCase();
    const generatedKey = generateLicenseKey(cleanDeviceId);

    // Check if license already exists for this device ID
    let license = await License.findOne({ deviceId: cleanDeviceId });
    if (license) {
      license.clientName = clientName.trim();
      license.clientPhone = clientPhone?.trim() || license.clientPhone;
      if (clientId) license.clientId = clientId;
      license.status = 'ACTIVE';
      license.licenseKey = generatedKey;
      license.generatedById = auth.userId as any;
      license.generatedByName = auth.name;
      if (notes !== undefined) license.notes = notes;
      await license.save();

      return NextResponse.json({
        success: true,
        message: 'Existing device license updated and activated',
        license,
      });
    }

    license = await License.create({
      deviceId: cleanDeviceId,
      licenseKey: generatedKey,
      clientName: clientName.trim(),
      clientPhone: clientPhone?.trim() || '',
      clientId: clientId || undefined,
      status: 'ACTIVE',
      generatedById: auth.userId,
      generatedByName: auth.name,
      notes: notes?.trim() || '',
    });

    return NextResponse.json({
      success: true,
      message: 'License successfully generated and registered',
      license,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create license error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate license' }, { status: 500 });
  }
}
