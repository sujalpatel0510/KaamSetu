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

    const [
      usersCount,
      workersCount,
      businessOwnersCount,
      businessesCount,
      jobsCount,
      openJobsCount,
      applicationsCount,
      salesTotal,
      creditAgg,
      repaymentAgg,
      productsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.WORKER } }),
      prisma.user.count({ where: { role: Role.BUSINESS_OWNER } }),
      prisma.business.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'OPEN' } }),
      prisma.jobApplication.count(),
      prisma.sale.aggregate({ _sum: { totalAmount: true } }),
      prisma.creditTransaction.aggregate({
        where: { type: 'CREDIT' },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { type: 'REPAYMENT' },
        _sum: { amount: true },
      }),
      prisma.product.count(),
    ]);

    const totalSalesVolume = Number(salesTotal._sum.totalAmount || 0);
    const totalCreditGiven = Number(creditAgg._sum.amount || 0);
    const totalRepayments = Number(repaymentAgg._sum.amount || 0);
    const totalUdhaarInMarket = Math.max(0, totalCreditGiven - totalRepayments);

    // Full Users Directory
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        workerProfile: {
          select: {
            id: true,
            skills: true,
            city: true,
            locality: true,
            availability: true,
            experienceYears: true,
          },
        },
        businesses: {
          select: {
            id: true,
            name: true,
            category: true,
            city: true,
            locality: true,
          },
        },
      },
    });

    // Full Businesses Directory with metrics
    const allBusinesses = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
            sales: true,
            customers: true,
            jobs: true,
          },
        },
      },
    });

    // Full Jobs Directory
    const allJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        business: {
          select: {
            name: true,
            phone: true,
            category: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    // Recent System Activity
    const recentActivity = await Promise.all([
      prisma.jobApplication.findMany({
        orderBy: { appliedAt: 'desc' },
        take: 5,
        include: {
          worker: {
            include: {
              user: {
                select: { name: true, phone: true },
              },
            },
          },
          job: {
            select: { title: true, business: { select: { name: true } } },
          },
        },
      }),
      prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          business: { select: { name: true } },
          customer: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        usersCount,
        workersCount,
        businessOwnersCount,
        businessesCount,
        jobsCount,
        openJobsCount,
        applicationsCount,
        totalSalesVolume,
        totalUdhaarInMarket,
        productsCount,
      },
      users: allUsers,
      businesses: allBusinesses,
      jobs: allJobs,
      recentApplications: recentActivity[0],
      recentSales: recentActivity[1],
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin data error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}
