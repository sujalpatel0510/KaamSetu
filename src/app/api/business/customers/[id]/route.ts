import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, TransactionType } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        business: true,
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            items: {
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.business.ownerId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let totalCredit = 0;
    let totalRepayment = 0;

    customer.creditTransactions.forEach((tx) => {
      const val = Number(tx.amount);
      if (tx.type === TransactionType.CREDIT) totalCredit += val;
      if (tx.type === TransactionType.REPAYMENT) totalRepayment += val;
    });

    const outstandingBalance = Math.max(0, totalCredit - totalRepayment);

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        createdAt: customer.createdAt,
        totalCredit,
        totalRepayment,
        outstandingBalance,
        transactions: customer.creditTransactions,
        sales: customer.sales,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching customer profile:', err);
    return NextResponse.json({ error: 'Failed to fetch customer profile' }, { status: 500 });
  }
}
