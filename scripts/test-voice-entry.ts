import { prisma } from '../src/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kaamsetu-dev-jwt-secret-not-for-production-min32chars';

async function main() {
  console.log('🧪 Testing Enhanced Voice Quick Entry System...\n');

  const merchant = await prisma.user.findUnique({
    where: { phone: '9876543210' },
  });
  if (!merchant) throw new Error('Merchant not found');

  const token = jwt.sign(
    { userId: merchant.id, role: merchant.role, phone: merchant.phone },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const testCases = [
    {
      name: '1. Voice Udhaar Entry for existing customer',
      transcript: 'Ramesh Bhai ko 500 rupay udhaar likho',
      expectedAction: 'CREDIT_RECORDED',
    },
    {
      name: '2. Voice Repayment (Jama) Entry',
      transcript: 'Ramesh Bhai ne 200 jama karwaye',
      expectedAction: 'REPAYMENT_RECORDED',
    },
    {
      name: '3. Voice Business Operating Expense Entry',
      transcript: 'Dukan ka bijli bill 1200 kharcha',
      expectedAction: 'EXPENSE_RECORDED',
    },
    {
      name: '4. Voice Inventory Stock Increment',
      transcript: 'Tata Salt 10 packet add karo',
      expectedAction: 'STOCK_UPDATED',
    },
    {
      name: '5. Voice Navigation Command',
      transcript: 'Udhaar khata kholo',
      expectedAction: 'NAVIGATE',
    },
  ];

  for (const tc of testCases) {
    const res = await fetch('http://localhost:3000/api/voice-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kaamsetu_session=${token}`,
      },
      body: JSON.stringify({ transcript: tc.transcript }),
    });

    const data = await res.json();
    if (!res.ok || data.action !== tc.expectedAction) {
      console.error(`❌ [FAIL] ${tc.name}:`, data);
      throw new Error(`Failed test case: ${tc.name}`);
    }
    console.log(`  ✅ [PASS] ${tc.name}`);
    console.log(`     Spoken: "${tc.transcript}" -> Message: "${data.message}"\n`);
  }

  console.log('🎉 All Voice Entry test scenarios passed perfectly!');
}

main()
  .catch((e) => {
    console.error('Voice test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
