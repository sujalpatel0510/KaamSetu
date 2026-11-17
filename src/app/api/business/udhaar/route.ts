import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, TransactionType, Prisma } from '@prisma/client';
import { z } from 'zod';
import { calculateOutstanding } from '@/lib/financial';

const udhaarSchema = z.object({
  customerId: z.string().uuid('Valid customer ID required'),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(99_999_999, 'Amount exceeds the maximum supported value'),
  type: z.enum(['CREDIT', 'REPAYMENT']),
  description: z.string().max(255).optional(),
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

    // Execute within atomic database transaction to prevent concurrent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify customer exists and belongs to this business
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, businessId: true },
      });

      if (!customer || customer.businessId !== business.id) {
        throw new Error('Customer not found in your business');
      }

      // 1b. Serialize concurrent ledger updates for this customer (row lock).
      // Without this, two simultaneous repayments could both read the same
      // outstanding balance and over-repay under READ COMMITTED isolation.
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${customerId}::uuid FOR UPDATE`;

      // 2. Direct PostgreSQL aggregation for credit & repayments
      const [creditAgg, repaymentAgg] = await Promise.all([
        tx.creditTransaction.aggregate({
          where: { customerId, type: TransactionType.CREDIT },
          _sum: { amount: true },
        }),
        tx.creditTransaction.aggregate({
          where: { customerId, type: TransactionType.REPAYMENT },
          _sum: { amount: true },
        }),
      ]);

      const totalCredit = Number(creditAgg._sum.amount || 0);
      const totalRepayments = Number(repaymentAgg._sum.amount || 0);
      const currentOutstanding = calculateOutstanding(totalCredit, totalRepayments);

      // 3. Strict business validation: Repayment cannot exceed outstanding balance
      if (type === 'REPAYMENT') {
        if (currentOutstanding <= 0) {
          throw new Error('Customer has zero outstanding balance. No repayment is due.');
        }
        if (amount > currentOutstanding) {
          throw new Error(
            `Repayment amount (₹${amount}) cannot exceed current outstanding balance (₹${currentOutstanding.toFixed(2)})`
          );
        }
      }

      // 4. Create the transaction record
      const createdTx = await tx.creditTransaction.create({
        data: {
          customerId,
          amount: new Prisma.Decimal(amount),
          type: type as TransactionType,
          description: description || (type === 'CREDIT' ? 'Credit given' : 'Repayment received'),
        },
      });

      const newOutstanding =
        type === 'CREDIT'
          ? calculateOutstanding(totalCredit + amount, totalRepayments)
          : calculateOutstanding(totalCredit, totalRepayments + amount);

      return {
        transaction: createdTx,
        newOutstanding,
        customerName: customer.name,
      };
    });

    return NextResponse.json(
      {
        message: `₹${amount} ${type.toLowerCase()} recorded for ${result.customerName}`,
        transaction: result.transaction,
        newOutstanding: result.newOutstanding,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record transaction';
    console.error('Error recording udhaar transaction:', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
