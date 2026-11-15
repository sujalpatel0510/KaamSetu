import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, TransactionType, Prisma } from '@prisma/client';
import { z } from 'zod';

const udhaarSchema = z.object({
  customerId: z.string().uuid('Valid customer ID required'),
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['CREDIT', 'REPAYMENT']),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = udhaarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid transaction data' },
        { status: 400 }
      );
    }

    const { customerId, amount, type, description } = parsed.data;

    // Verify customer belongs to this business
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        creditTransactions: true,
      },
    });

    if (!customer || customer.businessId !== business.id) {
      return NextResponse.json({ error: 'Customer not found in your business' }, { status: 404 });
    }

    // Calculate current outstanding balance
    let totalCredit = 0;
    let totalRepayment = 0;

    customer.creditTransactions.forEach((tx) => {
      const val = Number(tx.amount);
      if (tx.type === TransactionType.CREDIT) totalCredit += val;
      if (tx.type === TransactionType.REPAYMENT) totalRepayment += val;
    });

    const currentOutstanding = Math.max(0, totalCredit - totalRepayment);

    // Strict validation: A repayment cannot exceed current outstanding credit!
    if (type === 'REPAYMENT') {
      if (currentOutstanding <= 0) {
        return NextResponse.json(
          { error: 'Customer has zero outstanding balance. No repayment is due.' },
          { status: 400 }
        );
      }
      if (amount > currentOutstanding) {
        return NextResponse.json(
          {
            error: `Repayment amount (₹${amount}) cannot exceed current outstanding balance (₹${currentOutstanding.toFixed(2)})`,
          },
          { status: 400 }
        );
      }
    }

    // Atomic transaction creation
    const transaction = await prisma.$transaction(async (tx) => {
      const createdTx = await tx.creditTransaction.create({
        data: {
          customerId,
          amount: new Prisma.Decimal(amount),
          type: type as TransactionType,
          description: description || (type === 'CREDIT' ? 'Credit given' : 'Repayment received'),
        },
      });

      return createdTx;
    });

    const newOutstanding =
      type === 'CREDIT'
        ? currentOutstanding + amount
        : Math.max(0, currentOutstanding - amount);

    return NextResponse.json(
      {
        message:
          type === 'CREDIT'
            ? `Successfully recorded ₹${amount} credit for ${customer.name}`
            : `Successfully recorded ₹${amount} repayment from ${customer.name}`,
        transaction,
        updatedBalance: {
          previousOutstanding: currentOutstanding,
          newOutstanding,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Udhaar transaction error:', err);
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
  }
}
