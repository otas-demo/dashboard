import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { getAuthUser } from '@/lib/auth';
import { expireOverdueContracts } from '@/lib/contracts';
import { escapeRegExp } from '@/lib/utils';

// CORS response helper
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return corsResponse(response);
}

// Listing contracts requires a signed-in dashboard user.
// POST stays public so the online e-sign form can submit agreements.
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    await connectToDatabase();
    await expireOverdueContracts();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status')?.trim();
    const plan = searchParams.get('plan')?.trim();

    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status.toLowerCase();
    }

    if (plan && plan !== 'ALL') {
      query.plan = new RegExp(`^${escapeRegExp(plan)}$`, 'i');
    }

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      query.$or = [
        { businessName: regex },
        { fullName: regex },
        { phoneNumber: regex },
        { position: regex },
      ];
    }

    const [contracts, total, active, pending] = await Promise.all([
      Contract.find(query).sort({ createdAt: -1 }).limit(300).lean(),
      Contract.countDocuments(),
      Contract.countDocuments({ status: 'active' }),
      Contract.countDocuments({ status: 'pending' }),
    ]);

    // counts are unfiltered totals so stat cards don't change with the filters
    return corsResponse(
      NextResponse.json({ success: true, contracts, counts: { total, active, pending } })
    );
  } catch (error: any) {
    console.error('Fetch contracts error:', error);
    return corsResponse(
      NextResponse.json({ error: error.message || 'Failed to fetch contracts' }, { status: 500 })
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      fullName,
      phoneNumber,
      position,
      businessName,
      signature,
      agreed,
      plan,
      startDate,
      duration,
      notes,
    } = body;

    const missingFields: string[] = [];
    if (!fullName) missingFields.push('fullName');
    if (!phoneNumber) missingFields.push('phoneNumber');
    if (!position) missingFields.push('position');
    if (!businessName) missingFields.push('businessName');
    if (agreed === undefined) missingFields.push('agreed');
    if (!plan) missingFields.push('plan');
    if (!startDate) missingFields.push('startDate');
    if (!duration) missingFields.push('duration');

    if (missingFields.length > 0) {
      return corsResponse(
        NextResponse.json(
          { error: 'Missing required fields', missingFields },
          { status: 400 }
        )
      );
    }

    const contractData: any = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      position: position.trim(),
      businessName: businessName.trim(),
      agreed: Boolean(agreed),
      plan: plan.trim().toLowerCase(),
      duration: Number(duration) || 1,
      startDate: startDate.trim(),
      status: 'pending',
      notes: notes?.trim() || '',
    };

    if (signature) {
      contractData.signature = signature;
    }

    const newContract = await Contract.create(contractData);

    return corsResponse(
      NextResponse.json(
        {
          message: 'သဘောတူညီမှု တင်ပို့ပြီးပါပြီ။',
          id: newContract._id,
          contract: newContract,
        },
        { status: 201 }
      )
    );
  } catch (error: any) {
    console.error('Create contract error:', error);
    return corsResponse(
      NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    );
  }
}
