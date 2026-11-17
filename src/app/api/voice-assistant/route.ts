import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, TransactionType, Prisma, ExpenseCategory } from '@prisma/client';
import { calculateOutstanding } from '@/lib/financial';
import { rateLimit } from '@/lib/rate-limit';

// Helper to convert Hindi / English number words into integer values
function extractAmount(text: string): number | null {
  // First check standard digits
  const digitMatch = text.match(/\b\d+(\.\d{1,2})?\b/);
  if (digitMatch) {
    return Math.min(parseFloat(digitMatch[0]), 99_999_999);
  }

  const lower = text.toLowerCase();
  const wordMap: Record<string, number> = {
    'sau': 100, 'so': 100, 'sauu': 100, 'hundred': 100, 'सौ': 100,
    'hazar': 1000, 'hazaar': 1000, 'thousand': 1000, 'हज़ार': 1000, 'हजार': 1000,
    'lakh': 100000, 'lac': 100000, 'लाख': 100000,
    'dus': 10, 'ten': 10, 'दस': 10,
    'bees': 20, 'twenty': 20, 'बीस': 20,
    'tees': 30, 'thirty': 30, 'तीस': 30,
    'chaalis': 40, 'chalis': 40, 'forty': 40, 'चालीस': 40,
    'pachaas': 50, 'pachas': 50, 'fifty': 50, 'पचास': 50,
    'saath': 60, 'sath': 60, 'sixty': 60, 'साठ': 60,
    'sattar': 70, 'seventy': 70, 'सत्तर': 70,
    'assi': 80, 'eighty': 80, 'अस्सी': 80,
    'nabbe': 90, 'ninety': 90, 'नब्बे': 90,
    'ek sau': 100, 'one hundred': 100, 'एक सौ': 100,
    'do sau': 200, 'two hundred': 200, 'दो सौ': 200,
    'teen sau': 300, 'three hundred': 300, 'तीन सौ': 300,
    'chaar sau': 400, 'four hundred': 400, 'चार सौ': 400,
    'paanch sau': 500, 'panch sau': 500, 'five hundred': 500, 'पांच सौ': 500, 'पाँच सौ': 500,
    'che sau': 600, 'six hundred': 600, 'छह सौ': 600,
    'saat sau': 700, 'seven hundred': 700, 'सात सौ': 700,
    'aath sau': 800, 'eight hundred': 800, 'आठ सौ': 800,
    'nau sau': 900, 'nine hundred': 900, 'नौ सौ': 900,
    'ek hazar': 1000, 'one thousand': 1000, 'एक हजार': 1000,
    'do hazar': 2000, 'two thousand': 2000, 'दो हजार': 2000,
    'paanch hazar': 5000, 'five thousand': 5000, 'पांच हजार': 5000,
  };

  for (const [phrase, val] of Object.entries(wordMap)) {
    if (lower.includes(phrase)) {
      return val;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    // Resolve business (if admin without business, pick primary active business)
    let business = user.businesses?.[0];
    if (!business) {
      const fallbackBiz = await prisma.business.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (!fallbackBiz) {
        return NextResponse.json({ error: 'No business registered' }, { status: 404 });
      }
      business = fallbackBiz;
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'localhost';
    const limitCheck = rateLimit(`voice:${user.id}:${ip}`, { limit: 60, windowMs: 60 * 1000 });
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

    const lower = transcript.toLowerCase();
    const amount = extractAmount(transcript);

    // ==========================================
    // 1. BUSINESS EXPENSE / KHARCHA COMMAND
    // e.g. "Bijli bill 1200 kharcha", "Rent 15000 kharcha", "Chai pani 200 expense"
    // ==========================================
    const isExpense =
      lower.includes('kharcha') ||
      lower.includes('kharch') ||
      lower.includes('expense') ||
      lower.includes('खर्चा') ||
      lower.includes('खर्च') ||
      lower.includes('bill') ||
      lower.includes('बिल');

    if (isExpense && amount) {
      let category: ExpenseCategory = ExpenseCategory.OTHER;
      let title = 'General Operating Expense';

      if (lower.includes('bijli') || lower.includes('electricity') || lower.includes('power')) {
        category = ExpenseCategory.ELECTRICITY;
        title = 'Electricity Bill (बिजली बिल)';
      } else if (lower.includes('rent') || lower.includes('kiraya')) {
        category = ExpenseCategory.RENT;
        title = 'Shop Rent (दुकान किराया)';
      } else if (lower.includes('chai') || lower.includes('tea') || lower.includes('nasta') || lower.includes('snacks')) {
        category = ExpenseCategory.OTHER;
        title = 'Tea & Staff Refreshments (चाय-नाश्ता)';
      } else if (lower.includes('petrol') || lower.includes('diesel') || lower.includes('delivery') || lower.includes('transport')) {
        category = ExpenseCategory.TRANSPORT;
        title = 'Delivery & Transport (डिलीवरी खर्च)';
      } else if (lower.includes('repair') || lower.includes('maintenance')) {
        category = ExpenseCategory.MAINTENANCE;
        title = 'Maintenance & Repair';
      }

      const expense = await prisma.businessExpense.create({
        data: {
          businessId: business.id,
          category,
          amount: new Prisma.Decimal(amount),
          description: `${title} (Voice: "${transcript}")`,
          expenseDate: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'EXPENSE_RECORDED',
        message: `₹${amount} का खर्च दर्ज किया गया: ${title}`,
        category: expense.category,
        amount,
        expenseId: expense.id,
      });
    }

    // ==========================================
    // 2. CREDIT (UDHAAR) / REPAYMENT (JAMA)
    // ==========================================
    const isCredit =
      lower.includes('udhaar') ||
      lower.includes('credit') ||
      lower.includes('udhar') ||
      lower.includes('उधार') ||
      lower.includes('likho') ||
      lower.includes('likh');

    const isRepayment =
      lower.includes('jama') ||
      lower.includes('repay') ||
      lower.includes('diye') ||
      lower.includes('जमा') ||
      lower.includes('payment') ||
      lower.includes('mile');

    // Fetch existing customers in business
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

    // If customer not matched, but credit/udhaar is explicitly mentioned with an amount,
    // auto-extract the customer name from phrase (e.g. "Suresh ko 300 udhaar" -> "Suresh")
    if (!matchedCustomer && amount && (isCredit || isRepayment)) {
      // Extract potential name: remove common stop words and digits
      const cleanedWords = lower
        .replace(/(\d+)/g, '')
        .replace(/rupaye?|rupees?|rs|inr|udhaar|udhar|credit|jama|likho|likh|ko|ne|se|bhai|bhaiya|ji/g, '')
        .trim();

      const candidateName = cleanedWords
        .split(/\s+/)
        .filter((w: string) => w.length > 2)[0];

      if (candidateName) {
        const capitalized = candidateName.charAt(0).toUpperCase() + candidateName.slice(1);
        matchedCustomer = await prisma.customer.create({
          data: {
            businessId: business.id,
            name: capitalized,
            notes: 'Auto-created via Voice Quick Entry',
          },
        });
      }
    }

    if (matchedCustomer && amount) {
      if (isRepayment && !isCredit) {
        // Record Repayment
        const ledgerResult = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${matchedCustomer!.id}::uuid FOR UPDATE`;
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
            message: `${matchedCustomer.name} की जमा राशि (₹${amount}) वर्तमान शेष (₹${ledgerResult.currentBal.toFixed(2)}) से अधिक है।`,
            customer: matchedCustomer.name,
            amount,
            currentBalance: ledgerResult.currentBal,
          });
        }

        return NextResponse.json({
          success: true,
          action: 'REPAYMENT_RECORDED',
          message: `${matchedCustomer.name} से ₹${amount} की जमा (Repayment) दर्ज की गई! बाक़ी शेष: ₹${ledgerResult.newBalance}`,
          customer: matchedCustomer.name,
          amount,
          newBalance: ledgerResult.newBalance,
          transaction: ledgerResult.txRecord,
        });
      } else {
        // Record Credit (Udhaar)
        const creditResult = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${matchedCustomer!.id}::uuid FOR UPDATE`;
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
        const politeWhatsAppMsg = `नमस्ते ${matchedCustomer.name}, आपका ${business.name} पर ₹${amount} का उधार बिल जोड़ा गया है। कुल बाक़ी राशि: ₹${newTotalDue}। कृपया UPI द्वारा भुगतान करें: ${upiPaymentLink}`;
        const whatsappUrl = matchedCustomer.phone
          ? `https://wa.me/91${matchedCustomer.phone}?text=${encodeURIComponent(politeWhatsAppMsg)}`
          : null;

        return NextResponse.json({
          success: true,
          action: 'CREDIT_RECORDED',
          message: `${matchedCustomer.name} के खाते में ₹${amount} का उधार दर्ज किया गया! कुल बाक़ी: ₹${newTotalDue}`,
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

    // ==========================================
    // 3. PRODUCT INVENTORY STOCK ADDITION
    // e.g. "Tata Salt 10 add karo", "Milk 20 packet"
    // ==========================================
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
        message: `"${matchedProduct.name}" में ${Math.round(amount)} यूनिट स्टॉक जोड़ा गया। नया स्टॉक: ${updatedProduct.stockQuantity}`,
        product: updatedProduct.name,
        newStock: updatedProduct.stockQuantity,
      });
    }

    // ==========================================
    // 4. NAVIGATION / APP COMMANDS
    // ==========================================
    if (lower.includes('udhaar') || lower.includes('khata')) {
      return NextResponse.json({
        success: true,
        action: 'NAVIGATE',
        message: 'उधार खाता (Udhaar Ledger) खोला जा रहा है...',
        navigateTo: '/business/udhaar',
      });
    }
    if (lower.includes('sale') || lower.includes('billing') || lower.includes('pos')) {
      return NextResponse.json({
        success: true,
        action: 'NAVIGATE',
        message: 'POS बिलिंग व बिक्री पेज खोला जा रहा है...',
        navigateTo: '/business/sales',
      });
    }
    if (lower.includes('worker') || lower.includes('kaam') || lower.includes('assignment')) {
      return NextResponse.json({
        success: true,
        action: 'NAVIGATE',
        message: 'कार्य आवंटन (Work Assignments) पेज खोला जा रहा है...',
        navigateTo: '/business/work',
      });
    }

    // Fallback: Need Clarification
    return NextResponse.json({
      success: false,
      action: 'NEED_CLARIFICATION',
      message: `सुना गया: "${transcript}". कृपया नाम व राशि स्पष्ट बोलें (उदा. "रमेश भाई 500 उधार", "200 जमा", या "बिजली बिल 1200 खर्चा")।`,
      parsed: {
        detectedAmount: amount,
        detectedCustomer: matchedCustomer?.name || null,
        detectedProduct: matchedProduct?.name || null,
      },
    });
  } catch (err: any) {
    console.error('Voice assistant error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process voice command' }, { status: 500 });
  }
}
