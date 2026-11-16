import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const workerSettingsSchema = z.object({
  name: z.string().min(2, 'Full name is required (minimum 2 characters)'),
  email: z.string().email().optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'hi']).default('hi'),
  city: z.string().min(2, 'City is required'),
  locality: z.string().min(2, 'Locality is required'),
  availability: z.boolean().default(true),
  experienceYears: z.number().int().min(0).max(60).default(0),
  description: z.string().optional().or(z.literal('')),
  workVideoUrl: z.string().optional().or(z.literal('')),
  currentPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional().or(z.literal('')),
});

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.WORKER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Worker settings only accessible to workers' }, { status: 403 });
    }

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
    });

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        preferredLanguage: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: userProfile,
      workerProfile,
    });
  } catch (err: unknown) {
    console.error('Error fetching worker settings:', err);
    return NextResponse.json({ error: 'Failed to fetch worker settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.WORKER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = workerSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid data submitted' },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      preferredLanguage,
      city,
      locality,
      availability,
      experienceYears,
      description,
      workVideoUrl,
      currentPassword,
      newPassword,
    } = parsed.data;

    // Check password if updating
    let passwordHashToUpdate: string | undefined = undefined;
    if (newPassword && newPassword.trim().length >= 6) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change your password' },
          { status: 400 }
        );
      }
      const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const isMatch = await bcrypt.compare(currentPassword, existingUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Incorrect current password entered' },
          { status: 400 }
        );
      }
      passwordHashToUpdate = await bcrypt.hash(newPassword, 10);
    }

    // Atomic update of User and WorkerProfile
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User basic info
      const userUpdateData: Prisma.UserUpdateInput = {
        name,
        email: email || null,
        preferredLanguage,
      };
      if (passwordHashToUpdate) {
        userUpdateData.passwordHash = passwordHashToUpdate;
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: userUpdateData,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          preferredLanguage: true,
          role: true,
        },
      });

      // 2. Upsert WorkerProfile
      const updatedProfile = await tx.workerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          city,
          locality,
          skills: [],
          experienceYears,
          availability,
          description: description || null,
          workVideoUrl: workVideoUrl || null,
        },
        update: {
          city,
          locality,
          experienceYears,
          availability,
          description: description || null,
          workVideoUrl: workVideoUrl || null,
        },
      });

      return { user: updatedUser, profile: updatedProfile };
    });

    return NextResponse.json({
      success: true,
      message: 'Worker profile and settings updated successfully',
      data: result,
    });
  } catch (err: unknown) {
    console.error('Error updating worker settings:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update worker settings' },
      { status: 500 }
    );
  }
}
