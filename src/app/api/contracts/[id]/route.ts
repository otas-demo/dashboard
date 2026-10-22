import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { getAuthUser } from '@/lib/auth';
import { expireOverdueContracts } from '@/lib/contracts';

const CONTRACT_STATUSES = ['pending', 'active', 'expired', 'cancelled'];

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { id } = await params;
    await connectToDatabase();
    await expireOverdueContracts();
    const contract = await Contract.findById(id).lean();
    if (!contract) {
      return corsResponse(NextResponse.json({ error: 'Contract not found' }, { status: 404 }));
    }
    return corsResponse(NextResponse.json({ success: true, contract }));
  } catch (error: any) {
    return corsResponse(
      NextResponse.json({ error: error.message || 'Failed to fetch contract' }, { status: 500 })
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes, plan, duration } = body;

    if (status && !CONTRACT_STATUSES.includes(String(status).toLowerCase())) {
      return corsResponse(NextResponse.json({ error: 'Invalid contract status' }, { status: 400 }));
    }

    await connectToDatabase();
    const contract = await Contract.findById(id);
    if (!contract) {
      return corsResponse(NextResponse.json({ error: 'Contract not found' }, { status: 404 }));
    }

    if (status) contract.status = status.toLowerCase();
    if (notes !== undefined) contract.notes = notes;
    if (plan) contract.plan = plan.toLowerCase();
    if (duration) contract.duration = Number(duration);

    await contract.save();

    return corsResponse(NextResponse.json({ success: true, contract }));
  } catch (error: any) {
    return corsResponse(
      NextResponse.json({ error: error.message || 'Failed to update contract' }, { status: 500 })
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (auth.role !== 'super_admin') {
      return corsResponse(
        NextResponse.json({ error: 'Access forbidden: Super Admin required' }, { status: 403 })
      );
    }

    const { id } = await params;
    await connectToDatabase();
    const deleted = await Contract.findByIdAndDelete(id);
    if (!deleted) {
      return corsResponse(NextResponse.json({ error: 'Contract not found' }, { status: 404 }));
    }
    return corsResponse(NextResponse.json({ success: true, message: 'Contract deleted' }));
  } catch (error: any) {
    return corsResponse(
      NextResponse.json({ error: error.message || 'Failed to delete contract' }, { status: 500 })
    );
  }
}
