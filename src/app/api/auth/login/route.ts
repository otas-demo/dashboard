import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, signToken, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Auto-seed initial admin if database has 0 users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultHashedPassword = await hashPassword('Admin@12345');
      await User.create({
        name: 'Super Admin',
        email: 'admin@autoshop.com',
        password: defaultHashedPassword,
        role: 'super_admin',
        status: 'active',
      });
      console.log('Seeded default super admin: admin@autoshop.com / Admin@12345');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account has been deactivated' }, { status: 403 });
    }

    const isValid = await comparePassword(password, user.password || '');
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email || user.username || 'admin@autoshop.com',
      name: user.name || user.username || 'Admin',
      role: ((user.role === 'admin' ? 'super_admin' : user.role) || 'staff') as any,
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
      token,
    });

    // Set HTTP-only cookie for secure browser persistence
    response.cookies.set('autoshop_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
