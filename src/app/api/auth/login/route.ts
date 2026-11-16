import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required').max(100),
  password: z.string().min(1, 'Password is required').max(100),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'localhost';
    const limitCheck = rateLimit(`login:${ip}`, { limit: 15, windowMs: 60 * 1000 });

    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(limitCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid login details' },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    // Search by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
      include: {
        workerProfile: true,
        businesses: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
    });

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        workerProfileId: user.workerProfile?.id,
        businessId: user.businesses?.[0]?.id,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
