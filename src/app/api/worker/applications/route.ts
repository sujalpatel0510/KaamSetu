import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.WORKER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Worker applications only accessible to workers' }, { status: 403 });
    }

    const workerProfile = user.workerProfile;
    if (!workerProfile) {
      return NextResponse.json({ applications: [] });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { workerId: workerProfile.id },
      include: {
        job: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                category: true,
                city: true,
                locality: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch (err: unknown) {
    console.error('Error fetching worker applications:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
