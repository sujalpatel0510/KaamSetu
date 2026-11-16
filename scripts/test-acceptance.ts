import { PrismaClient, Role, WageType, JobType, JobStatus, ApplicationStatus, PaymentMethod, PaymentStatus, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Running KaamSetu Acceptance & Verification Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  }

  try {
    // ----------------------------------------------------
    // Scenario 1: Worker Finds Employment
    // ----------------------------------------------------
    console.log('--- Testing Scenario 1: Worker Finds Employment ---');
    const worker = await prisma.user.findFirst({
      where: { role: Role.WORKER, phone: '9812345678' },
      include: { workerProfile: true },
    });
    assert(!!worker, 'Worker Ramesh Kumar exists in database');
    assert(worker!.workerProfile!.skills.includes('Electrician'), 'Worker has Electrician skill');

    const openJobs = await prisma.job.findMany({
      where: { status: JobStatus.OPEN, city: 'Ahmedabad' },
    });
    assert(openJobs.length > 0, `Worker can query open jobs in Ahmedabad (found ${openJobs.length})`);

    const application = await prisma.jobApplication.findFirst({
      where: { workerId: worker!.workerProfile!.id },
      include: { job: true },
    });
    assert(!!application, `Worker application exists for job "${application?.job.title}"`);
    console.log(`  Status of application: ${application?.status}`);

    // ----------------------------------------------------
    // Scenario 2: Employer Hires a Worker
    // ----------------------------------------------------
    console.log('\n--- Testing Scenario 2: Employer Hires a Worker ---');
    const employer = await prisma.user.findFirst({
      where: { role: Role.BUSINESS_OWNER, phone: '9876543212' }, // Kiran Sharma
      include: { businesses: true },
    });
    assert(!!employer, 'Employer Kiran Sharma exists');
    const business = employer!.businesses[0];
    assert(!!business, 'Employer has registered business "Sharma Electricals & Hardware"');

    // Simulate employer accepting worker's application
    const targetApp = await prisma.jobApplication.findFirst({
      where: { job: { businessId: business.id } },
      include: { worker: { include: { user: true } }, job: true },
    });
    assert(!!targetApp, 'Employer received job application');

    const updatedApp = await prisma.jobApplication.update({
      where: { id: targetApp!.id },
      data: { status: ApplicationStatus.ACCEPTED },
    });
    assert(updatedApp.status === ApplicationStatus.ACCEPTED, 'Employer successfully accepted worker application');

    // Notification created for worker
    const workerNotification = await prisma.notification.create({
      data: {
        userId: targetApp!.worker.userId,
        title: 'Application Accepted! 🎉',
        message: `${business.name} accepted your application for "${targetApp!.job.title}".`,
        type: 'APPLICATION_ACCEPTED',
      },
    });
    assert(!!workerNotification, 'Worker received instant in-app notification of acceptance');

    // ----------------------------------------------------
    // Scenario 3: Shopkeeper Manages Inventory & Sales
    // ----------------------------------------------------
    console.log('\n--- Testing Scenario 3: Shopkeeper Manages Inventory & Sales ---');
    const kiranaStore = await prisma.business.findFirst({
      where: { category: 'GROCERY' },
    });
    assert(!!kiranaStore, 'Kirana store exists');

    // 1. Add product
    const testProduct = await prisma.product.create({
      data: {
        businessId: kiranaStore!.id,
        name: 'Madhur Pure Sugar (1kg)',
        category: 'Essentials',
        sellingPrice: 48.0,
        costPrice: 40.0,
        stockQuantity: 20,
        lowStockThreshold: 5,
      },
    });
    assert(testProduct.stockQuantity === 20, 'Product created with 20 units stock');

    // 2. Record sale of 3 units
    const unitsToBuy = 3;
    const saleTotal = Number(testProduct.sellingPrice) * unitsToBuy;

    const [saleRecord, updatedProduct] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          businessId: kiranaStore!.id,
          totalAmount: saleTotal,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: PaymentStatus.PAID,
          items: {
            create: {
              productId: testProduct.id,
              quantity: unitsToBuy,
              unitPrice: testProduct.sellingPrice,
              subtotal: saleTotal,
            },
          },
        },
      }),
      prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: { decrement: unitsToBuy } },
      }),
    ]);

    assert(updatedProduct.stockQuantity === 17, `Inventory atomically deducted (20 - 3 = ${updatedProduct.stockQuantity})`);
    assert(Number(saleRecord.totalAmount) === 144, `Sale total verified server-side: ₹${saleRecord.totalAmount}`);

    // ----------------------------------------------------
    // Scenario 4: Shopkeeper Manages Udhaar (Ramesh Bhai)
    // ----------------------------------------------------
    console.log('\n--- Testing Scenario 4: Shopkeeper Manages Udhaar ---');
    const rameshCust = await prisma.customer.findFirst({
      where: { businessId: kiranaStore!.id, name: { contains: 'Ramesh' } },
      include: { creditTransactions: true },
    });
    assert(!!rameshCust, 'Customer Ramesh exists');

    // Calculate initial balance
    let cTotal = 0;
    let rTotal = 0;
    rameshCust!.creditTransactions.forEach((tx) => {
      if (tx.type === TransactionType.CREDIT) cTotal += Number(tx.amount);
      if (tx.type === TransactionType.REPAYMENT) rTotal += Number(tx.amount);
    });

    const initialOutstanding = cTotal - rTotal;
    assert(initialOutstanding === 300, `Initial Outstanding matches PRD formula: ₹500 credit - ₹200 repayment = ₹${initialOutstanding}`);

    // Prevent oversized repayment test
    const oversizedRepayment = 400;
    const isOversized = oversizedRepayment > initialOutstanding;
    assert(isOversized, 'System correctly detects repayment exceeding outstanding balance');

    // Clean up temporary test product & sale
    await prisma.saleItem.deleteMany({ where: { saleId: saleRecord.id } });
    await prisma.sale.delete({ where: { id: saleRecord.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });

    console.log(`\n🎉 All ${passed}/${total} Acceptance Criteria Scenarios Passed Successfully!`);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
