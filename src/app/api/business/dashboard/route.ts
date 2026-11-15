import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, JobStatus, TransactionType } from '@prisma/client';

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

    // Parallel queries for fast dashboard load
    const [
      allSales,
      todaySales,
      products,
      customers,
      activeJobsCount,
      recentApplications,
    ] = await Promise.all([
      // Total sales
      prisma.sale.aggregate({
        where: { businessId },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Today's sales
      prisma.sale.aggregate({
        where: {
          businessId,
          createdAt: { gte: startOfToday },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Products for low-stock check
      prisma.product.findMany({
        where: { businessId },
        select: {
          id: true,
          name: true,
          category: true,
          stockQuantity: true,
          lowStockThreshold: true,
          sellingPrice: true,
        },
      }),
      // Customers with credit transactions to calculate exact outstanding Udhaar
      prisma.customer.findMany({
        where: { businessId },
        include: {
          creditTransactions: {
            select: {
              amount: true,
              type: true,
              createdAt: true,
            },
          },
        },
      }),
      // Active jobs
      prisma.job.count({
        where: {
          businessId,
          status: JobStatus.OPEN,
        },
      }),
      // Recent job applications
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
    ]);

    // Calculate low-stock products
    const lowStockProducts = products.filter(
      (p) => p.stockQuantity <= p.lowStockThreshold
    );

    // Calculate total credit, total repayment, and total outstanding across all customers
    let totalCredit = 0;
    let totalRepayment = 0;

    customers.forEach((cust) => {
      cust.creditTransactions.forEach((tx) => {
        const val = Number(tx.amount);
        if (tx.type === TransactionType.CREDIT) {
          totalCredit += val;
        } else if (tx.type === TransactionType.REPAYMENT) {
          totalRepayment += val;
        }
      });
    });

    const totalOutstandingCredit = Math.max(0, totalCredit - totalRepayment);

    // Recent 5 sales with customer name
    const recentSales = await prisma.sale.findMany({
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
    });

    return NextResponse.json({
      business,
      stats: {
        todaysSalesAmount: Number(todaySales._sum.totalAmount || 0),
        todaysSalesCount: todaySales._count.id,
        totalSalesAmount: Number(allSales._sum.totalAmount || 0),
        totalSalesCount: allSales._count.id,
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        totalCustomers: customers.length,
        totalOutstandingCredit,
        activeJobsCount,
      },
      lowStockProducts,
      recentSales,
      recentApplications,
    });
  } catch (err: unknown) {
    console.error('Business dashboard error:', err);
    return NextResponse.json({ error: 'Failed to load business dashboard' }, { status: 500 });
  }
}
