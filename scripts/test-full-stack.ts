import { PrismaClient, Role, WageType, JobType, JobStatus, ApplicationStatus, PaymentMethod, PaymentStatus, TransactionType } from '@prisma/client';
import { roundToPaisa, toDecimal, calculateSubtotal, calculateOutstanding } from '../src/lib/financial';
import { formatDate, formatDateTime } from '../src/lib/date';
import { rateLimit } from '../src/lib/rate-limit';

const prisma = new PrismaClient();

async function runSuite() {
  console.log('🚀 Running KaamSetu Full-Stack Architecture & Security Verification Suite\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      throw new Error(`Test assertion failed: ${title}`);
    }
  }

  try {
    // ----------------------------------------------------
    // Section 1: Financial Precision & Currency Safety
    // ----------------------------------------------------
    console.log('--- 1. Testing Financial Math & Paisa Rounding ---');
    assert(roundToPaisa(10.004) === 10, 'roundToPaisa rounds down 10.004 -> 10.00');
    assert(roundToPaisa(10.006) === 10.01, 'roundToPaisa rounds up 10.006 -> 10.01');
    assert(roundToPaisa(0.1 + 0.2) === 0.3, 'Floating point 0.1 + 0.2 equals exactly 0.30');
    
    const subtotal = calculateSubtotal(125.50, 3);
    assert(subtotal.toNumber() === 376.50, 'calculateSubtotal(125.50, 3) === 376.50');

    const outstanding = calculateOutstanding(1500, 450);
    assert(outstanding === 1050, 'calculateOutstanding(1500, 450) === 1050.00');

    // ----------------------------------------------------
    // Section 2: Deterministic SSR-Safe Date Formatting
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Deterministic Date Formatting (Zero Hydration Mismatch) ---');
    const testDate = new Date('2026-11-15T10:30:00Z');
    const formatted = formatDate(testDate);
    assert(/^\d{2}\/\d{2}\/\d{4}$/.test(formatted), `formatDate yields deterministic DD/MM/YYYY: "${formatted}"`);
    assert(formatDate(null) === '', 'formatDate(null) safely returns empty string');
    assert(formatDate(undefined) === '', 'formatDate(undefined) safely returns empty string');

    // ----------------------------------------------------
    // Section 3: Token Bucket Rate Limiting
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Rate Limiting (Brute Force Defense) ---');
    const testIp = '127.0.0.99';
    let blocked = false;
    for (let i = 0; i < 20; i++) {
      const res = rateLimit(`login:${testIp}`, { limit: 5, windowMs: 10000 });
      if (!res.success) {
        blocked = true;
        assert(res.remaining === 0, `Rate limiter signals 0 remaining attempts`);
        break;
      }
    }
    assert(blocked, 'Rate limiter correctly blocked excessive requests (> 5 within window)');

    // ----------------------------------------------------
    // Section 4: Database Model Relationships & Integrity
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Database Entities & Relation Integrity ---');
    const businessOwner = await prisma.user.findFirst({
      where: { role: Role.BUSINESS_OWNER, phone: '9876543210' },
      include: { businesses: true },
    });
    assert(!!businessOwner, 'Business owner Rajesh Patel found');
    assert(businessOwner!.businesses.length > 0, 'Business owner has linked business');

    const business = businessOwner!.businesses[0];
    const customer = await prisma.customer.findFirst({
      where: { businessId: business.id },
      include: { creditTransactions: true },
    });
    assert(!!customer, 'Customer Ramesh Bhai found under business');

    const [credits, repayments] = await Promise.all([
      prisma.creditTransaction.aggregate({
        where: { customerId: customer!.id, type: TransactionType.CREDIT },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { customerId: customer!.id, type: TransactionType.REPAYMENT },
        _sum: { amount: true },
      }),
    ]);
    const totalCredit = Number(credits._sum.amount || 0);
    const totalPayment = Number(repayments._sum.amount || 0);
    const customerOutstanding = calculateOutstanding(totalCredit, totalPayment);
    assert(customerOutstanding >= 0, `Customer Udhaar balance calculated via calculateOutstanding is non-negative (₹${customerOutstanding})`);

    // ----------------------------------------------------
    // Section 5: Batch Inventory & Atomic Consistency
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Product Inventory & Stock Queries ---');
    const products = await prisma.product.findMany({
      where: { businessId: business.id },
      take: 5,
    });
    assert(products.length > 0, `Business has active inventory items (${products.length} sampled)`);
    for (const p of products) {
      assert(p.stockQuantity >= 0, `Product "${p.name}" has valid non-negative stock (${p.stockQuantity})`);
      assert(Number(p.sellingPrice) > 0, `Product "${p.name}" has positive price (₹${p.sellingPrice})`);
    }

    console.log(`\n🎉 Verification Complete: ${passed}/${total} assertions PASSED with 0 errors!`);
  } finally {
    await prisma.$disconnect();
  }
}

runSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
