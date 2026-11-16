import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, TransactionType, Prisma } from '@prisma/client';
import { calculateOutstanding } from '@/lib/financial';
import { rateLimit } from '@/lib/rate-limit';

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

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'localhost';
    const limitCheck = rateLimit(`voice:${user.id}:${ip}`, { limit: 30, windowMs: 60 * 1000 });
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'Too many voice commands. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await req.json();
    const transcript = (body.transcript || '').trim().slice(0, 500);

    if (!transcript) {
      return NextResponse.json({ error: 'Voice transcript is required' }, { status: 400 });
    }

    // Smart regex pattern matching across Hindi, Gujarati, Hinglish and English
    const lower = transcript.toLowerCase();

    // 1. Check for Credit/Udhaar patterns: e.g. "Ramesh ko 40 rupay udhaar likho" or "500 credit Ramesh" or "રમેશને 50 રૂપિયા ઉધાર લખો"
    const isCredit =
      lower.includes('udhaar') ||
      lower.includes('credit') ||
      lower.includes('udhar') ||
      lower.includes('उधार') ||
      lower.includes('ઉધાર') ||
      lower.includes('likho') ||
      lower.includes('લખો');

    // 2. Check for Repayment/Jama patterns: e.g. "Ramesh ne 200 jama karwaye" or "200 payment from Ramesh" or "જમા"
    const isRepayment =
      lower.includes('jama') ||
      lower.includes('repay') ||
      lower.includes('diye') ||
      lower.includes('chukavya') ||
      lower.includes('જમા') ||
      lower.includes('ચુકવ્યા') ||
      lower.includes('payment');

    // Extract amount from transcript (bounded to a sane ledger value)
    const amountMatch = transcript.match(/(\d+)/);
    const amount = amountMatch ? Math.min(parseFloat(amountMatch[1]), 99_999_999) : null;

    // Fetch existing customers in business to match name (minimal fields only)
    const customers = await prisma.customer.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, phone: true },
    });

    let matchedCustomer = null;
    for (const cust of customers) {
      const cleanName = cust.name.toLowerCase().trim();
      const firstWord = cleanName.split(' ')[0];
      if (lower.includes(cleanName) || (firstWord && lower.includes(firstWord))) {
        matchedCustomer = cust;
        break;
      }
    }

    if (matchedCustomer && amount) {
      if (isRepayment && !isCredit) {
        // Compute the balance from a fresh, locked read (same rules as the
        // Udhaar ledger endpoint — never from stale in-memory sums).
        const ledgerResult = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${matchedCustomer!.id} FOR UPDATE`;
          const [creditAgg, repaymentAgg] = await Promise.all([
            tx.creditTransaction.aggregate({
              where: { customerId: matchedCustomer!.id, type: TransactionType.CREDIT },
              _sum: { amount: true },
            }),
            tx.creditTransaction.aggregate({
              where: { customerId: matchedCustomer!.id, type: TransactionType.REPAYMENT },
              _sum: { amount: true },
            }),
          ]);

          const totalCredit = Number(creditAgg._sum.amount || 0);
          const totalRepay = Number(repaymentAgg._sum.amount || 0);
          const currentBal = calculateOutstanding(totalCredit, totalRepay);

          if (amount > currentBal) {
            return { rejected: true, currentBal };
          }

          const txRecord = await tx.creditTransaction.create({
            data: {
              customerId: matchedCustomer!.id,
              amount: new Prisma.Decimal(amount),
              type: TransactionType.REPAYMENT,
              description: `Voice entry: "${transcript}"`,
            },
          });

          return {
            rejected: false,
            currentBal,
            newBalance: calculateOutstanding(totalCredit, totalRepay + amount),
            txRecord,
          };
        });

        if (ledgerResult.rejected) {
          return NextResponse.json({
            action: 'REPAYMENT_EXCEEDS_BALANCE',
            message: `Voice command parsed: Repayment of ₹${amount} exceeds current balance of ₹${ledgerResult.currentBal.toFixed(2)}.`,
            customer: matchedCustomer.name,
            amount,
            currentBalance: ledgerResult.currentBal,
          });
        }

        return NextResponse.json({
          success: true,
          action: 'REPAYMENT_RECORDED',
          message: `Recorded ₹${amount} repayment from ${matchedCustomer.name} via Voice!`,
          customer: matchedCustomer.name,
          amount,
          newBalance: ledgerResult.newBalance,
          transaction: ledgerResult.txRecord,
        });
      } else {
        // Record Credit — locked transaction with a fresh balance calculation
        const creditResult = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${matchedCustomer!.id} FOR UPDATE`;
          const [creditAgg, repaymentAgg] = await Promise.all([
            tx.creditTransaction.aggregate({
              where: { customerId: matchedCustomer!.id, type: TransactionType.CREDIT },
              _sum: { amount: true },
            }),
            tx.creditTransaction.aggregate({
              where: { customerId: matchedCustomer!.id, type: TransactionType.REPAYMENT },
              _sum: { amount: true },
            }),
          ]);

          const totalCredit = Number(creditAgg._sum.amount || 0);
          const totalRepay = Number(repaymentAgg._sum.amount || 0);

          const txRecord = await tx.creditTransaction.create({
            data: {
              customerId: matchedCustomer!.id,
              amount: new Prisma.Decimal(amount),
              type: TransactionType.CREDIT,
              description: `Voice entry: "${transcript}"`,
            },
          });

          return {
            txRecord,
            newTotalDue: calculateOutstanding(totalCredit + amount, totalRepay),
          };
        });

        const { txRecord, newTotalDue } = creditResult;
        const upiPaymentLink = `upi://pay?pa=${business.phone}@okaxis&pn=${encodeURIComponent(business.name)}&am=${amount}&cu=INR`;
        const politeWhatsAppMsg = `Namaste ${matchedCustomer.name}, aapka ${business.name} par ₹${amount} ka Udhaar bill joda gaya hai. Kul baaki rashi: ₹${newTotalDue}. Kripya UPI dwara bhugtan karein: ${upiPaymentLink}`;
        const whatsappUrl = matchedCustomer.phone
          ? `https://wa.me/91${matchedCustomer.phone}?text=${encodeURIComponent(politeWhatsAppMsg)}`
          : null;

        return NextResponse.json({
          success: true,
          action: 'CREDIT_RECORDED',
          message: `Recorded ₹${amount} Udhaar (Credit) for ${matchedCustomer.name} via Voice!`,
          customer: matchedCustomer.name,
          amount,
          newBalance: newTotalDue,
          upiPaymentLink,
          whatsappUrl,
          politeReminderText: politeWhatsAppMsg,
          transaction: txRecord,
        });
      }
    }

    // 3. Check for Stock/Inventory voice command: e.g. "order 20 packets milk" or "milk 10 add karo"
    const products = await prisma.product.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true },
    });

    let matchedProduct = null;
    for (const prod of products) {
      const pName = prod.name.toLowerCase();
      const firstWord = pName.split(' ')[0];
      if (lower.includes(pName) || (firstWord && lower.includes(firstWord))) {
        matchedProduct = prod;
        break;
      }
    }

    if (matchedProduct && amount) {
      const updatedProduct = await prisma.product.update({
        where: { id: matchedProduct.id },
        data: {
          stockQuantity: { increment: Math.round(amount) },
        },
      });

      return NextResponse.json({
        success: true,
        action: 'STOCK_UPDATED',
        message: `Added ${Math.round(amount)} units to "${matchedProduct.name}". New stock: ${updatedProduct.stockQuantity}.`,
        product: updatedProduct.name,
        newStock: updatedProduct.stockQuantity,
      });
    }

    // If could not automatically match both entity and amount:
    return NextResponse.json({
      success: false,
      action: 'NEED_CLARIFICATION',
      message: `Heard: "${transcript}". Please specify customer/product name and amount clearly (e.g. "Ramesh 50 udhaar" or "Tata Salt 10 add karo").`,
      parsed: {
        detectedAmount: amount,
        detectedCustomer: matchedCustomer?.name || null,
        detectedProduct: matchedProduct?.name || null,
      },
    });
  } catch (err: unknown) {
    console.error('Voice assistant error:', err);
    return NextResponse.json({ error: 'Failed to process voice command' }, { status: 500 });
  }
}
