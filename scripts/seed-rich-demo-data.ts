import {
  PrismaClient,
  Role,
  WageType,
  JobType,
  JobStatus,
  ApplicationStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionType,
  AssignmentStatus,
  WagePaymentStatus,
  AttendanceStatus,
  VerificationStatus,
  ExpenseCategory,
  DisputeCategory,
  DisputeStatus,
  Prisma,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populating Rich Demo Data for KaamSetu Video Presentation...\n');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Ensure Primary Business Owner (Rajesh Patel) exists
  let rajeshUser = await prisma.user.findUnique({
    where: { phone: '9876543210' },
  });

  if (!rajeshUser) {
    rajeshUser = await prisma.user.create({
      data: {
        name: 'Rajesh Patel',
        email: 'rajesh@patelkirana.com',
        phone: '9876543210',
        passwordHash: defaultPassword,
        role: Role.BUSINESS_OWNER,
        preferredLanguage: 'hi',
      },
    });
  }

  let patelStore = await prisma.business.findFirst({
    where: { ownerId: rajeshUser.id },
  });

  if (!patelStore) {
    patelStore = await prisma.business.create({
      data: {
        ownerId: rajeshUser.id,
        name: 'Patel General & Kirana Store',
        category: 'GROCERY',
        phone: '9876543210',
        city: 'Ahmedabad',
        locality: 'Maninagar',
        address: 'Shop 14, Shreeji Market, Near Station Road, Maninagar',
        description: 'Daily household grocery items, grains, spices, milk, and cooking oil at wholesale rates.',
      },
    });
  }
  console.log(`  ✅ Business confirmed: "${patelStore.name}"`);

  // 2. Ensure Secondary Business Owner (Vikram Singh - Apna Chai)
  let vikramUser = await prisma.user.findUnique({
    where: { phone: '9876543211' },
  });
  if (!vikramUser) {
    vikramUser = await prisma.user.create({
      data: {
        name: 'Vikram Singh',
        email: 'vikram@apnachai.com',
        phone: '9876543211',
        passwordHash: defaultPassword,
        role: Role.BUSINESS_OWNER,
        preferredLanguage: 'hi',
      },
    });
    await prisma.business.create({
      data: {
        ownerId: vikramUser.id,
        name: 'Apna Chai & Snacks Corner',
        category: 'TEA_STALL',
        phone: '9876543211',
        city: 'Ahmedabad',
        locality: 'Navrangpura',
        address: 'Near Gujarat University Gate, Navrangpura',
        description: 'Special Masala Cutting Chai, Bun Maska, Samosa, and evening snacks.',
      },
    });
  }

  // 3. Add Rich Inventory Products for Patel Store
  const demoProducts = [
    { name: 'Fortune Sunflower Oil (1L)', category: 'OILS', costPrice: 130, sellingPrice: 155, stockQuantity: 3, lowStockThreshold: 5, sku: 'SKU-OIL-01' },
    { name: 'Tata Salt (1kg)', category: 'SPICES', costPrice: 22, sellingPrice: 28, stockQuantity: 45, lowStockThreshold: 10, sku: 'SKU-SLT-02' },
    { name: 'Amul Taaza Milk (500ml)', category: 'DAIRY', costPrice: 25, sellingPrice: 27, stockQuantity: 2, lowStockThreshold: 6, sku: 'SKU-MLK-03' },
    { name: 'Taj Mahal Tea (250g)', category: 'BEVERAGES', costPrice: 120, sellingPrice: 145, stockQuantity: 18, lowStockThreshold: 4, sku: 'SKU-TEA-04' },
    { name: 'Daawat Basmati Rice (5kg Bag)', category: 'GRAINS', costPrice: 420, sellingPrice: 510, stockQuantity: 14, lowStockThreshold: 3, sku: 'SKU-RCE-05' },
    { name: 'Aashirvaad Shudh Chakki Atta (10kg)', category: 'GRAINS', costPrice: 380, sellingPrice: 440, stockQuantity: 12, lowStockThreshold: 4, sku: 'SKU-ATA-06' },
    { name: 'Maggi 2-Minute Noodles (4-Pack)', category: 'PACKAGED_FOOD', costPrice: 48, sellingPrice: 56, stockQuantity: 35, lowStockThreshold: 8, sku: 'SKU-NDL-07' },
    { name: 'Parle-G Gold Biscuits (1kg Family Pack)', category: 'SNACKS', costPrice: 90, sellingPrice: 110, stockQuantity: 28, lowStockThreshold: 5, sku: 'SKU-BSC-08' },
    { name: 'Everest Turmeric / Haldi Powder (200g)', category: 'SPICES', costPrice: 42, sellingPrice: 52, stockQuantity: 22, lowStockThreshold: 5, sku: 'SKU-HLD-09' },
    { name: 'Dettol Original Soap (Combo of 4)', category: 'PERSONAL_CARE', costPrice: 135, sellingPrice: 160, stockQuantity: 16, lowStockThreshold: 4, sku: 'SKU-DET-10' },
    { name: 'Surf Excel Quick Wash Detergent (1kg)', category: 'HOUSEHOLD', costPrice: 130, sellingPrice: 150, stockQuantity: 19, lowStockThreshold: 4, sku: 'SKU-SRF-11' },
  ];

  for (const prod of demoProducts) {
    const existing = await prisma.product.findFirst({
      where: { businessId: patelStore.id, name: prod.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          businessId: patelStore.id,
          name: prod.name,
          category: prod.category,
          costPrice: new Prisma.Decimal(prod.costPrice),
          sellingPrice: new Prisma.Decimal(prod.sellingPrice),
          stockQuantity: prod.stockQuantity,
          lowStockThreshold: prod.lowStockThreshold,
          sku: prod.sku,
        },
      });
    }
  }
  console.log('  ✅ Rich product catalog verified with live stock and SKUs');

  // 4. Ensure Customers & Udhaar Ledger Records
  const demoCustomers = [
    { name: 'Ramesh Bhai', phone: '9822233441', address: 'Block C-204, Radha Krishna Flats, Maninagar', credit: 850, repay: 350 },
    { name: 'Paresh Thakkar', phone: '9877712345', address: 'Plot 12, Swagat Society, Maninagar', credit: 1450, repay: 500 },
    { name: 'Suresh Prajapati', phone: '9898011223', address: 'Near Bus Stand, Maninagar East', credit: 620, repay: 200 },
    { name: 'Anita Sharma', phone: '9825044556', address: 'B-12, Shivalik Residency, Rambaug', credit: 1200, repay: 800 },
    { name: 'Kanti Bhai Vaghela', phone: '9714099887', address: 'Shop 8, Vegetable Market, Maninagar', credit: 2100, repay: 1500 },
  ];

  for (const c of demoCustomers) {
    let cust = await prisma.customer.findFirst({
      where: { businessId: patelStore.id, name: c.name },
    });
    if (!cust) {
      cust = await prisma.customer.create({
        data: {
          businessId: patelStore.id,
          name: c.name,
          phone: c.phone,
          address: c.address,
          notes: 'Regular local customer, good repayment record',
        },
      });
      // Add initial credit transaction
      await prisma.creditTransaction.create({
        data: {
          customerId: cust.id,
          amount: new Prisma.Decimal(c.credit),
          type: TransactionType.CREDIT,
          description: 'Grocery bill & monthly supplies',
        },
      });
      if (c.repay > 0) {
        await prisma.creditTransaction.create({
          data: {
            customerId: cust.id,
            amount: new Prisma.Decimal(c.repay),
            type: TransactionType.REPAYMENT,
            description: 'UPI Repayment received',
          },
        });
      }
    }
  }
  console.log('  ✅ Customer directory & Udhaar ledger enriched');

  // 5. Populate Realistic 7-Day Sales History for Analytics Chart
  const sampleProduct = await prisma.product.findFirst({
    where: { businessId: patelStore.id },
  });

  if (sampleProduct) {
    const now = new Date();
    const salesDays = [
      { daysAgo: 6, total: 4250, count: 5 },
      { daysAgo: 5, total: 5800, count: 7 },
      { daysAgo: 4, total: 6120, count: 8 },
      { daysAgo: 3, total: 7450, count: 10 },
      { daysAgo: 2, total: 8900, count: 12 },
      { daysAgo: 1, total: 9650, count: 14 },
      { daysAgo: 0, total: 6480, count: 9 },
    ];

    for (const s of salesDays) {
      const saleDate = new Date(now);
      saleDate.setDate(now.getDate() - s.daysAgo);
      saleDate.setHours(11, 30, 0, 0);

      const checkExistingSale = await prisma.sale.findFirst({
        where: {
          businessId: patelStore.id,
          createdAt: {
            gte: new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate(), 0, 0, 0),
            lte: new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate(), 23, 59, 59),
          },
        },
      });

      if (!checkExistingSale) {
        await prisma.sale.create({
          data: {
            businessId: patelStore.id,
            totalAmount: new Prisma.Decimal(s.total),
            paymentMethod: PaymentMethod.UPI,
            paymentStatus: PaymentStatus.PAID,
            createdAt: saleDate,
            items: {
              create: [
                {
                  productId: sampleProduct.id,
                  quantity: s.count,
                  unitPrice: new Prisma.Decimal(s.total / s.count),
                  subtotal: new Prisma.Decimal(s.total),
                },
              ],
            },
          },
        });
      }
    }
    console.log('  ✅ 7-Day sales velocity populated for dashboard trend charts');
  }

  // 6. Business Operating Expenses for P&L Reporting
  const demoExpenses = [
    { desc: 'Shop Electricity Bill (Maninagar Store)', amount: 2450, category: ExpenseCategory.ELECTRICITY },
    { desc: 'Monthly Store Lease & Rent', amount: 12000, category: ExpenseCategory.RENT },
    { desc: 'Delivery Vehicle Fuel & Maintenance', amount: 1850, category: ExpenseCategory.TRANSPORT },
    { desc: 'Staff Evening Tea & Snacks', amount: 650, category: ExpenseCategory.OTHER },
    { desc: 'Store Pest Control & Deep Sanitation', amount: 1500, category: ExpenseCategory.MAINTENANCE },
  ];

  for (const exp of demoExpenses) {
    const existing = await prisma.businessExpense.findFirst({
      where: { businessId: patelStore.id, description: exp.desc },
    });
    if (!existing) {
      await prisma.businessExpense.create({
        data: {
          businessId: patelStore.id,
          description: exp.desc,
          amount: new Prisma.Decimal(exp.amount),
          category: exp.category,
          expenseDate: new Date(),
        },
      });
    }
  }
  console.log('  ✅ Business operating expenses populated for P&L calculations');

  // 7. Suppliers & Wholesale Invoices
  let supplier = await prisma.supplier.findFirst({
    where: { businessId: patelStore.id, name: 'Mahavir Grains & FMCG Wholesale' },
  });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        businessId: patelStore.id,
        name: 'Mahavir Grains & FMCG Wholesale',
        contactPerson: 'Kishore Bhai Shah',
        phone: '9898123450',
        address: 'APMC Market Yard, Jamalpur, Ahmedabad',
        notes: 'Wholesale grains and cooking oil vendor',
      },
    });
    await prisma.purchase.create({
      data: {
        businessId: patelStore.id,
        supplierId: supplier.id,
        totalAmount: new Prisma.Decimal(18500),
        paymentStatus: PaymentStatus.PAID,
        notes: 'Monthly wholesale restock of cooking oil and pulses',
        purchaseDate: new Date(),
      },
    });
  }
  console.log('  ✅ Wholesale suppliers and purchase orders confirmed');

  // 8. Multiple Diverse Worker Profiles
  const demoWorkers = [
    {
      name: 'Ramesh Kumar',
      phone: '9812345678',
      city: 'Ahmedabad',
      locality: 'Maninagar',
      skills: ['Electrician', 'Wiring & Switchboards', 'Appliance Repair'],
      experienceYears: 5,
      verifiedSkillBadge: true,
      description: 'Certified wireman with 5 years experience in residential and shop electrical fittings.',
    },
    {
      name: 'Dinesh Varma',
      phone: '9812345679',
      city: 'Ahmedabad',
      locality: 'Naroda',
      skills: ['Store Helper', 'Heavy Loading', 'Stock Inventory'],
      experienceYears: 3,
      verifiedSkillBadge: true,
      description: 'Punctual, energetic warehouse loader and Kirana helper.',
    },
    {
      name: 'Suresh Prajapati',
      phone: '9812345680',
      city: 'Ahmedabad',
      locality: 'Navrangpura',
      skills: ['Plumbing', 'Pipe Fitting', 'Sanitary Repair'],
      experienceYears: 4,
      verifiedSkillBadge: true,
      description: 'Expert plumber for water pipelines, leakage fixing, and commercial fittings.',
    },
    {
      name: 'Meena Ben Rathod',
      phone: '9812345681',
      city: 'Ahmedabad',
      locality: 'Maninagar',
      skills: ['Deep Cleaning', 'Housekeeping', 'Sanitation'],
      experienceYears: 6,
      verifiedSkillBadge: true,
      description: 'Reliable and trustworthy specialist for daily store dusting, mop cleaning, and sanitation.',
    },
    {
      name: 'Rahul Solanki',
      phone: '9812345682',
      city: 'Ahmedabad',
      locality: 'Paldi',
      skills: ['Delivery Executive', 'Two-Wheeler Courier', 'Packing'],
      experienceYears: 2,
      verifiedSkillBadge: false,
      description: 'Active two-wheeler rider with clean driving record for fast home grocery deliveries.',
    },
  ];

  for (const w of demoWorkers) {
    let u = await prisma.user.findUnique({ where: { phone: w.phone } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          name: w.name,
          phone: w.phone,
          passwordHash: defaultPassword,
          role: Role.WORKER,
          preferredLanguage: 'hi',
        },
      });
    }

    let profile = await prisma.workerProfile.findUnique({ where: { userId: u.id } });
    if (!profile) {
      profile = await prisma.workerProfile.create({
        data: {
          userId: u.id,
          city: w.city,
          locality: w.locality,
          skills: w.skills,
          experienceYears: w.experienceYears,
          verifiedSkillBadge: w.verifiedSkillBadge,
          description: w.description,
          availability: true,
        },
      });
    }
  }
  console.log('  ✅ 5 Registered, skilled worker profiles confirmed');

  // 9. Open Job Postings across categories
  const demoJobs = [
    {
      title: 'Commercial Electrician for Shop Fitting',
      skills: ['Electrician', 'Wiring'],
      wageAmount: 750,
      wageType: WageType.DAILY,
      city: 'Ahmedabad',
      locality: 'Maninagar',
      description: 'Need certified electrician to wire four ceiling fans, LED display signs, and repair warehouse switchboard.',
    },
    {
      title: 'Store Assistant & Inventory Arranger',
      skills: ['Store Helper', 'Loading'],
      wageAmount: 500,
      wageType: WageType.DAILY,
      city: 'Ahmedabad',
      locality: 'Maninagar',
      description: 'Help unload wholesale grocery sacks, arrange customer shelves, and pack home delivery orders.',
    },
    {
      title: 'Plumber for Cold Storage Drainage Repair',
      skills: ['Plumbing', 'Pipe Fitting'],
      wageAmount: 650,
      wageType: WageType.FIXED,
      city: 'Ahmedabad',
      locality: 'Maninagar',
      description: 'Fix drain pipe blockage and install water tap near store washing bay.',
    },
    {
      title: 'Express Grocery Delivery Executive',
      skills: ['Delivery Executive', 'Driving'],
      wageAmount: 600,
      wageType: WageType.DAILY,
      city: 'Ahmedabad',
      locality: 'Maninagar',
      description: 'Deliver phone and WhatsApp grocery orders to nearby residential societies in Maninagar.',
    },
  ];

  for (const j of demoJobs) {
    const existing = await prisma.job.findFirst({
      where: { businessId: patelStore.id, title: j.title },
    });
    if (!existing) {
      await prisma.job.create({
        data: {
          businessId: patelStore.id,
          title: j.title,
          requiredSkills: j.skills,
          wageAmount: new Prisma.Decimal(j.wageAmount),
          wageType: j.wageType,
          city: j.city,
          locality: j.locality,
          description: j.description,
          status: JobStatus.OPEN,
        },
      });
    }
  }
  console.log('  ✅ Open job listings confirmed');

  // 10. Active Work Assignment with Digital Attendance
  const rameshWorker = await prisma.workerProfile.findFirst({
    where: { user: { phone: '9812345678' } },
  });
  const electricJob = await prisma.job.findFirst({
    where: { businessId: patelStore.id, title: { contains: 'Electrician' } },
  });

  if (rameshWorker && electricJob) {
    let app = await prisma.jobApplication.findFirst({
      where: { jobId: electricJob.id, workerId: rameshWorker.id },
    });
    if (!app) {
      app = await prisma.jobApplication.create({
        data: {
          jobId: electricJob.id,
          workerId: rameshWorker.id,
          status: ApplicationStatus.ACCEPTED,
          message: 'Available immediately. Have all professional tools.',
        },
      });
    }

    let assignment = await prisma.workAssignment.findFirst({
      where: { applicationId: app.id },
    });
    if (!assignment) {
      assignment = await prisma.workAssignment.create({
        data: {
          applicationId: app.id,
          jobId: electricJob.id,
          businessId: patelStore.id,
          workerId: rameshWorker.id,
          startDate: new Date(),
          agreedWage: new Prisma.Decimal(750),
          wageType: WageType.DAILY,
          status: AssignmentStatus.IN_PROGRESS,
          paymentStatus: WagePaymentStatus.PENDING,
          description: 'Install 4 ceiling fans, inspect main switchboard wiring, and test refrigerator stabilizer.',
        },
      });

      // Digital Attendance records
      const today = new Date();
      await prisma.attendance.create({
        data: {
          assignmentId: assignment.id,
          workerId: rameshWorker.id,
          businessId: patelStore.id,
          date: today,
          checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15, 0),
          checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0),
          hoursWorked: 8.5,
          status: AttendanceStatus.APPROVED,
          verifiedByUserId: rajeshUser.id,
          correctionReason: 'Full day store wiring work completed and verified',
        },
      });
    }
  }
  console.log('  ✅ Active work assignment with digital attendance punch log confirmed');

  console.log('\n🎉 Rich Demo Data successfully populated for KaamSetu video recording!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
