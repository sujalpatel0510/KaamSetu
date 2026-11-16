import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, JobStatus, TransactionType } from '@prisma/client';
import { calculateOutstanding } from '@/lib/financial';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: 'No business registered' }, { status: 404 });
    }

    const businessId = business.id;

    // Start of today in local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Optimized parallel database queries (Zero N+1, all aggregated in PostgreSQL engine)
    const [
      allSales,
      todaySales,
      totalProductsCount,
      lowStockProducts,
      totalCustomersCount,
      creditAgg,
      repaymentAgg,
      activeJobsCount,
      recentApplications,
      recentSales,
    ] = await Promise.all([
      // Total sales aggregate
      prisma.sale.aggregate({
        where: { businessId },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Today's sales aggregate
      prisma.sale.aggregate({
        where: {
          businessId,
          createdAt: { gte: startOfToday },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Total products count
      prisma.product.count({
        where: { businessId },
      }),
      // Targeted low-stock query (fetching only low-stock items, max 10)
      prisma.product.findMany({
        where: {
          businessId,
          stockQuantity: { lte: 5 },
        },
        select: {
          id: true,
          name: true,
          category: true,
          stockQuantity: true,
          lowStockThreshold: true,
          sellingPrice: true,
        },
        take: 10,
        orderBy: { stockQuantity: 'asc' },
      }),
      // Customer count (indexed count, avoids fetching records)
      prisma.customer.count({
        where: { businessId },
      }),
      // Total Credit aggregate (database sum)
      prisma.creditTransaction.aggregate({
        where: {
          customer: { businessId },
          type: TransactionType.CREDIT,
        },
        _sum: { amount: true },
      }),
      // Total Repayments aggregate (database sum)
      prisma.creditTransaction.aggregate({
        where: {
          customer: { businessId },
          type: TransactionType.REPAYMENT,
        },
        _sum: { amount: true },
      }),
      // Active jobs count
      prisma.job.count({
        where: {
          businessId,
          status: JobStatus.OPEN,
        },
      }),
      // Recent 5 job applications
      prisma.jobApplication.findMany({
        where: {
          job: { businessId },
        },
        include: {
          job: { select: { title: true } },
          worker: {
            include: {
              user: { select: { name: true, phone: true } },
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        take: 5,
      }),
      // Recent 5 sales with customer name & product breakdown
      prisma.sale.findMany({
        where: { businessId },
        include: {
          customer: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalCreditGiven = Number(creditAgg._sum.amount || 0);
    const totalRepayments = Number(repaymentAgg._sum.amount || 0);
    const totalOutstandingCredit = calculateOutstanding(totalCreditGiven, totalRepayments);

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        category: business.category,
        city: business.city,
        locality: business.locality,
      },
      stats: {
        totalSalesAmount: Number(allSales._sum.totalAmount || 0),
        totalSalesCount: allSales._count.id,
        todaysSalesAmount: Number(todaySales._sum.totalAmount || 0),
        todaysSalesCount: todaySales._count.id,
        totalProducts: totalProductsCount,
        totalCustomers: totalCustomersCount,
        lowStockCount: lowStockProducts.length,
        totalOutstandingCredit,
        totalOutstandingUdhaar: totalOutstandingCredit,
        activeJobsCount,
      },
      lowStockProducts,
      recentSales,
      recentApplications,
    });
  } catch (err: unknown) {
    console.error('Error loading business dashboard data:', err);
    return NextResponse.json({ error: 'Failed to load business dashboard' }, { status: 500 });
  }
}
