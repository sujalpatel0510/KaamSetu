import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().min(2),
  locality: z.string().min(2),
  skills: z.array(z.string()).min(1, 'Please specify at least one skill'),
  experienceYears: z.number().int().min(0),
  description: z.string().optional(),
  workVideoUrl: z.string().optional().or(z.literal('')),
  availability: z.boolean().default(true),
});

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.WORKER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Worker profile only accessible to workers' }, { status: 403 });
    }

    const profile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            preferredLanguage: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch reviews received by this worker and rating statistics
    const [reviews, completedJobsCount] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: user.id },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              businesses: { select: { name: true, city: true }, take: 1 },
            },
          },
          assignment: {
            select: {
              id: true,
              job: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.workAssignment.count({
        where: {
          workerId: profile.id,
          status: 'COMPLETED',
        },
      }),
    ]);

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    return NextResponse.json({
      profile,
      ratingSummary: {
        averageRating,
        totalReviews,
        completedJobsCount,
      },
      reviews,
    });
  } catch (err: unknown) {
    console.error('Error fetching worker profile:', err);
    return NextResponse.json({ error: 'Failed to fetch worker profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.WORKER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid profile data' },
        { status: 400 }
      );
    }

    const { name, city, locality, skills, experienceYears, description, workVideoUrl, availability } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      if (name && name !== user.name) {
        await tx.user.update({
          where: { id: user.id },
          data: { name },
        });
      }

      const updated = await tx.workerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          city,
          locality,
          skills,
          experienceYears,
          description,
          workVideoUrl: workVideoUrl || null,
          availability,
        },
        update: {
          city,
          locality,
          skills,
          experienceYears,
          description,
          workVideoUrl: workVideoUrl || null,
          availability,
        },
      });

      return updated;
    });

    return NextResponse.json({ message: 'Profile updated successfully', profile: result });
  } catch (err: unknown) {
    console.error('Error updating worker profile:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
