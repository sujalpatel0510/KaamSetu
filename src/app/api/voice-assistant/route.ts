import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, TransactionType, Prisma } from '@prisma/client';

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
    const transcript = (body.transcript || '').trim();

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

    // Extract amount from transcript
    const amountMatch = transcript.match(/(\d+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    // Fetch existing customers in business to match name
    const customers = await prisma.customer.findMany({
      where: { businessId: business.id },
      include: { creditTransactions: true },
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
        // Calculate balance
        let totalCredit = 0;
        let totalRepay = 0;
        matchedCustomer.creditTransactions.forEach((tx) => {
          if (tx.type === TransactionType.CREDIT) totalCredit += Number(tx.amount);
          if (tx.type === TransactionType.REPAYMENT) totalRepay += Number(tx.amount);
        });
        const currentBal = Math.max(0, totalCredit - totalRepay);

        if (amount > currentBal && currentBal > 0) {
          return NextResponse.json({
            action: 'REPAYMENT_EXCEEDS_BALANCE',
            message: `Voice command parsed: Repayment of ₹${amount} exceeds current balance of ₹${currentBal}.`,
            customer: matchedCustomer.name,
            amount,
            currentBalance: currentBal,
          });
        }

        // Record repayment
        const txRecord = await prisma.creditTransaction.create({
          data: {
            customerId: matchedCustomer.id,
            amount: new Prisma.Decimal(amount),
            type: TransactionType.REPAYMENT,
            description: `Voice entry: "${transcript}"`,
          },
        });

        return NextResponse.json({
          success: true,
          action: 'REPAYMENT_RECORDED',
          message: `Recorded ₹${amount} repayment from ${matchedCustomer.name} via Voice!`,
          customer: matchedCustomer.name,
          amount,
          newBalance: Math.max(0, currentBal - amount),
          transaction: txRecord,
        });
      } else {
        // Record Credit
        const txRecord = await prisma.creditTransaction.create({
          data: {
            customerId: matchedCustomer.id,
            amount: new Prisma.Decimal(amount),
            type: TransactionType.CREDIT,
            description: `Voice entry: "${transcript}"`,
          },
        });

        let totalCredit = 0;
        let totalRepay = 0;
        matchedCustomer.creditTransactions.forEach((tx) => {
          if (tx.type === TransactionType.CREDIT) totalCredit += Number(tx.amount);
          if (tx.type === TransactionType.REPAYMENT) totalRepay += Number(tx.amount);
        });

        return NextResponse.json({
          success: true,
          action: 'CREDIT_RECORDED',
          message: `Recorded ₹${amount} Udhaar (Credit) for ${matchedCustomer.name} via Voice!`,
          customer: matchedCustomer.name,
          amount,
          newBalance: Math.max(0, totalCredit + amount - totalRepay),
          transaction: txRecord,
        });
      }
    }

    // 3. Check for Stock/Inventory voice command: e.g. "order 20 packets milk" or "milk 10 add karo"
    const products = await prisma.product.findMany({
      where: { businessId: business.id },
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
