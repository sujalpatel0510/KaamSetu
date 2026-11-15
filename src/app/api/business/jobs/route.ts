import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const jobs = await prisma.job.findMany({
      where: { businessId: business.id },
      include: {
        _count: {
          select: { applications: true },
        },
        applications: {
          take: 3,
          include: {
            worker: {
              include: { user: { select: { name: true, phone: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ jobs });
  } catch (err: unknown) {
    console.error('Error fetching business jobs:', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
