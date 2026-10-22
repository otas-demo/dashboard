import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { UserRole } from '@/models/User';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Collapses legacy roles onto the two the dashboard understands:
 * old 'admin' accounts are super admins, anything else is staff.
 */
export function normalizeRole(role: string | undefined): 'super_admin' | 'staff' {
  return role === 'super_admin' || role === 'admin' ? 'super_admin' : 'staff';
}

export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  // read outside the try so a missing secret surfaces as an error, not as "logged out"
  const secret = getJwtSecret();
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  // 1. Check HTTP-only cookie
  const cookieToken = req.cookies.get('autoshop_token')?.value;
  if (cookieToken) {
    const verified = verifyToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.split(' ')[1];
    return verifyToken(headerToken);
  }

  return null;
}
