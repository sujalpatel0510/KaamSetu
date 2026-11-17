import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { Role } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || 'kaamsetu_super_secret_jwt_key_2026_vibex';

if (isProd && !process.env.JWT_SECRET) {
  console.warn('⚠️ SECURITY WARNING: JWT_SECRET environment variable is not configured in production.');
}

const COOKIE_NAME = 'kaamsetu_session';

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
  phone: string;
}

export function signToken(payload: SessionPayload): string {
  if (isProd && !process.env.JWT_SECRET) {
    // Fail closed in production: never sign with the dev fallback secret.
    throw new Error('JWT_SECRET environment variable must be configured in production');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  if (isProd && !process.env.JWT_SECRET) {
    // Fail closed in production: reject all tokens rather than trusting the dev secret.
    console.error('⚠️ JWT_SECRET is not configured — rejecting session token.');
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      preferredLanguage: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      workerProfile: true,
      businesses: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export const getAuthUser = async (_req?: any) => getCurrentUser();

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return user;
}

export { COOKIE_NAME };
