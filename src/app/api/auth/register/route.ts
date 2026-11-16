import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  phone: z.string().regex(/^\+?\d{10,15}$/, 'Valid 10-digit mobile number required'),
  email: z.string().email().max(120).optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['WORKER', 'BUSINESS_OWNER']),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
  city: z.string().min(2, 'City is required').max(60),
  locality: z.string().min(2, 'Area / Locality is required').max(60),
  // Worker-specific optional fields during registration
  skills: z.array(z.string().max(40)).max(15).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  // Business-specific optional fields during registration
  businessName: z.string().max(80).optional(),
  businessCategory: z.string().max(40).optional(),
  businessAddress: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'localhost';
    const limitCheck = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 1000 });
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid registration data' },
        { status: 400 }
      );
    }

    const {
      name,
      phone,
      email,
      password,
      role,
      preferredLanguage,
      city,
      locality,
      skills,
      experienceYears,
      businessName,
      businessCategory,
      businessAddress,
    } = parsed.data;

    // Check duplicate phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'A user with this mobile number already exists' },
        { status: 409 }
      );
    }

    // Check duplicate email if provided
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'A user with this email address already exists' },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and associated profile/business in a single atomic transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          phone,
          email: email || null,
          passwordHash,
          role: role as Role,
          preferredLanguage,
        },
      });

      if (role === 'WORKER') {
        await tx.workerProfile.create({
          data: {
            userId: user.id,
            city,
            locality,
            skills: skills && skills.length > 0 ? skills : ['General Worker'],
            experienceYears: experienceYears || 0,
            availability: true,
          },
        });
      } else if (role === 'BUSINESS_OWNER') {
        await tx.business.create({
          data: {
            ownerId: user.id,
            name: businessName || `${name}'s Business`,
            category: businessCategory || 'GROCERY',
            phone,
            city,
            locality,
            address: businessAddress || `${locality}, ${city}`,
          },
        });
      }

      // Welcome Notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to KaamSetu! 🚀',
          message:
            role === 'WORKER'
              ? 'Your worker profile is ready. Browse nearby jobs and apply.'
              : 'Your business account is ready. Manage inventory, customer Udhaar, and post jobs.',
          type: 'SYSTEM_WELCOME',
        },
      });

      return user;
    });

    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      name: newUser.name,
      phone: newUser.phone,
    });

    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          preferredLanguage: newUser.preferredLanguage,
        },
      },
      { status: 201 }
    );

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
    // Unique-constraint race (phone/email registered concurrently)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A user with this mobile number or email already exists' },
        { status: 409 }
      );
    }
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
