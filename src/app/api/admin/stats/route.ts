import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [usersCount, workersCount, businessOwnersCount, businessesCount, jobsCount, applicationsCount, salesTotal] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: Role.WORKER } }),
        prisma.user.count({ where: { role: Role.BUSINESS_OWNER } }),
        prisma.business.count(),
        prisma.job.count(),
        prisma.jobApplication.count(),
        prisma.sale.aggregate({ _sum: { totalAmount: true } }),
      ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      stats: {
        usersCount,
        workersCount,
        businessOwnersCount,
        businessesCount,
        jobsCount,
        applicationsCount,
        totalSalesVolume: Number(salesTotal._sum.totalAmount || 0),
      },
      recentUsers,
    });
  } catch (err: unknown) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
