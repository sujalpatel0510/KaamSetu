import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, TransactionType } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name required'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  initialCredit: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const customers = await prisma.customer.findMany({
      where: {
        businessId: business.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        // Only the latest transaction is needed for display; the full ledger
        // is never loaded here (balances come from the groupBy below).
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    // Single SQL aggregation for all customers' balances (avoids N+1 sums)
    const sums = await prisma.creditTransaction.groupBy({
      by: ['customerId', 'type'],
      where: { customer: { businessId: business.id } },
      _sum: { amount: true },
    });

    const balanceByCustomer = new Map<string, { credit: number; repayment: number }>();
    for (const row of sums) {
      const entry = balanceByCustomer.get(row.customerId) || { credit: 0, repayment: 0 };
      const val = Number(row._sum.amount || 0);
      if (row.type === TransactionType.CREDIT) entry.credit += val;
      else entry.repayment += val;
      balanceByCustomer.set(row.customerId, entry);
    }

    // Compute exact balances dynamically
    const formatted = customers.map((c) => {
      const balances = balanceByCustomer.get(c.id) || { credit: 0, repayment: 0 };
      const totalCredit = balances.credit;
      const totalRepayment = balances.repayment;

      const outstandingBalance = Math.max(0, totalCredit - totalRepayment);

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        notes: c.notes,
        createdAt: c.createdAt,
        totalCredit,
        totalRepayment,
        outstandingBalance,
        lastTransaction: c.creditTransactions[0] || null,
      };
    });

    return NextResponse.json({ customers: formatted });
  } catch (err: unknown) {
    console.error('Error fetching customers:', err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: 'No business registered' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid customer data' },
        { status: 400 }
      );
    }

    const { name, phone, address, notes, initialCredit } = parsed.data;

    const customer = await prisma.$transaction(async (tx) => {
      const newCust = await tx.customer.create({
        data: {
          businessId: business.id,
          name,
          phone: phone || null,
          address: address || null,
          notes: notes || null,
        },
      });

      if (initialCredit && initialCredit > 0) {
        await tx.creditTransaction.create({
          data: {
            customerId: newCust.id,
            amount: initialCredit,
            type: TransactionType.CREDIT,
            description: 'Opening balance / initial credit',
          },
        });
      }

      return newCust;
    });

    return NextResponse.json({ message: 'Customer added successfully', customer }, { status: 201 });
  } catch (err: unknown) {
    console.error('Error adding customer:', err);
    return NextResponse.json({ error: 'Failed to add customer' }, { status: 500 });
  }
}
