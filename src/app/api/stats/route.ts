import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import License from '@/models/License';
import Client from '@/models/Client';
import Contract from '@/models/Contract';
import { getAuthUser } from '@/lib/auth';
import { expireOverdueContracts } from '@/lib/contracts';

// Shops are matched across the client directory and contracts by phone number
// (digits only), falling back to the shop name when there is no usable phone.
function shopKey(phone: string | undefined, name: string | undefined): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 6) return `phone:${digits}`;
  const cleanName = (name || '').trim().toLowerCase();
  return cleanName ? `name:${cleanName}` : null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await expireOverdueContracts();

    const [totalLicenses, activeLicenses, totalContracts, activeContracts, clients, contracts] =
      await Promise.all([
        License.countDocuments(),
        License.countDocuments({ status: 'ACTIVE' }),
        Contract.countDocuments(),
        Contract.countDocuments({ status: 'active' }),
        Client.find().select('phone shopName').lean(),
        Contract.find().select('phoneNumber businessName').lean(),
      ]);

    const shops = new Set<string>();
    for (const c of clients) {
      const key = shopKey(c.phone, c.shopName);
      if (key) shops.add(key);
    }
    for (const c of contracts) {
      const key = shopKey(c.phoneNumber, c.businessName);
      if (key) shops.add(key);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalLicenses,
        activeLicenses,
        totalContracts,
        activeContracts,
        totalClients: shops.size,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load stats' }, { status: 500 });
  }
}
