import { PrismaClient, Role, WageType, JobType, JobStatus, ApplicationStatus, PaymentMethod, PaymentStatus, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting KaamSetu database seeding...');

  // Clean existing records in safe order
  await prisma.notification.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.business.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@kaamsetu.in',
      phone: '9999999999',
      passwordHash: defaultPassword,
      role: Role.ADMIN,
      preferredLanguage: 'en',
    },
  });

  // 2. Business Owners & Businesses
  // Owner 1: Rajesh Patel (Kirana Store in Ahmedabad)
  const rajeshUser = await prisma.user.create({
    data: {
      name: 'Rajesh Patel',
      email: 'rajesh@patelkirana.com',
      phone: '9876543210',
      passwordHash: defaultPassword,
      role: Role.BUSINESS_OWNER,
      preferredLanguage: 'gu',
    },
  });

  const patelStore = await prisma.business.create({
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

  // Owner 2: Vikram Singh (Tea Stall & Snacks in Ahmedabad)
  const vikramUser = await prisma.user.create({
    data: {
      name: 'Vikram Singh',
      email: 'vikram@apnachai.com',
      phone: '9876543211',
      passwordHash: defaultPassword,
      role: Role.BUSINESS_OWNER,
      preferredLanguage: 'hi',
    },
  });

  const apnaChai = await prisma.business.create({
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

  // Owner 3: Kiran Sharma (Electricals in Vadodara)
  const kiranUser = await prisma.user.create({
    data: {
      name: 'Kiran Sharma',
      email: 'kiran@sharmaelectric.com',
      phone: '9876543212',
      passwordHash: defaultPassword,
      role: Role.BUSINESS_OWNER,
      preferredLanguage: 'en',
    },
  });

  const sharmaElectric = await prisma.business.create({
    data: {
      ownerId: kiranUser.id,
      name: 'Sharma Electricals & Hardware',
      category: 'ELECTRICAL',
      phone: '9876543212',
      city: 'Vadodara',
      locality: 'Alkapuri',
      address: '22 GIDC Commercial Complex, Alkapuri',
      description: 'Industrial and domestic wiring, switches, motor starters, lights, and plumbing hardware.',
    },
  });

  // 3. Workers & Profiles
  // Worker 1: Ramesh Kumar (Electrician in Ahmedabad)
  const rameshUser = await prisma.user.create({
    data: {
      name: 'Ramesh Kumar',
      email: 'ramesh.worker@gmail.com',
      phone: '9812345678',
      passwordHash: defaultPassword,
      role: Role.WORKER,
      preferredLanguage: 'hi',
    },
  });

  const rameshProfile = await prisma.workerProfile.create({
    data: {
      userId: rameshUser.id,
      city: 'Ahmedabad',
      locality: 'Maninagar',
      skills: ['Electrician', 'Wiring', 'Appliance Repair', 'Inverter Fitting'],
      experienceYears: 6,
      description: 'Certified ITI electrician with 6 years experience in residential wiring, MCB setup, and ceiling fan repair.',
      workVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-electrician-fixing-wires-in-an-electrical-box-41718-large.mp4',
      verifiedSkillBadge: true,
      availability: true,
    },
  });

  // Worker 2: Suresh Vaghela (Plumber in Ahmedabad)
  const sureshUser = await prisma.user.create({
    data: {
      name: 'Suresh Vaghela',
      email: 'suresh.plumber@gmail.com',
      phone: '9812345679',
      passwordHash: defaultPassword,
      role: Role.WORKER,
      preferredLanguage: 'gu',
    },
  });

  const sureshProfile = await prisma.workerProfile.create({
    data: {
      userId: sureshUser.id,
      city: 'Ahmedabad',
      locality: 'Vastrapur',
      skills: ['Plumbing', 'Pipe Fitting', 'Bathroom Sanitary', 'Water Tank Cleaning'],
      experienceYears: 4,
      description: 'Experienced plumber for drainage, motor pumps, CPVC pipe fitting, and leak repair.',
      availability: true,
    },
  });

  // Worker 3: Mahesh Parmar (Mason & Construction in Vadodara)
  const maheshUser = await prisma.user.create({
    data: {
      name: 'Mahesh Parmar',
      email: 'mahesh.mason@gmail.com',
      phone: '9812345680',
      passwordHash: defaultPassword,
      role: Role.WORKER,
      preferredLanguage: 'gu',
    },
  });

  const maheshProfile = await prisma.workerProfile.create({
    data: {
      userId: maheshUser.id,
      city: 'Vadodara',
      locality: 'Alkapuri',
      skills: ['Masonry', 'Plastering', 'Tile Laying', 'Brickwork'],
      experienceYears: 8,
      description: 'Expert mason specialized in floor tiling, wall plaster, and renovation construction work.',
      availability: true,
    },
  });

  // 4. Products for Patel Store
  const p1 = await prisma.product.create({
    data: {
      businessId: patelStore.id,
      name: 'Basmati Rice (5kg Bag)',
      category: 'Grains & Rice',
      sku: 'RICE-BAS-5KG',
      sellingPrice: 420.0,
      costPrice: 360.0,
      stockQuantity: 28,
      lowStockThreshold: 10,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      businessId: patelStore.id,
      name: 'Fortune Sunflower Oil (1L)',
      category: 'Edible Oils',
      sku: 'OIL-SUN-1L',
      sellingPrice: 145.0,
      costPrice: 125.0,
      stockQuantity: 4, // Low stock trigger
      lowStockThreshold: 8,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      businessId: patelStore.id,
      name: 'Tata Salt (1kg)',
      category: 'Spices & Essentials',
      sku: 'SALT-TATA-1KG',
      sellingPrice: 28.0,
      costPrice: 22.0,
      stockQuantity: 50,
      lowStockThreshold: 15,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      businessId: patelStore.id,
      name: 'Amul Taaza Milk (500ml)',
      category: 'Dairy',
      sku: 'MILK-AMUL-500ML',
      sellingPrice: 27.0,
      costPrice: 24.0,
      stockQuantity: 2, // Low stock trigger
      lowStockThreshold: 10,
    },
  });

  const p5 = await prisma.product.create({
    data: {
      businessId: patelStore.id,
      name: 'Taj Mahal Tea (250g)',
      category: 'Beverages',
      sku: 'TEA-TAJ-250G',
      sellingPrice: 160.0,
      costPrice: 135.0,
      stockQuantity: 18,
      lowStockThreshold: 5,
    },
  });

  // Products for Apna Chai
  await prisma.product.createMany({
    data: [
      {
        businessId: apnaChai.id,
        name: 'Special Masala Chai (Cup)',
        category: 'Hot Drinks',
        sku: 'CHAI-MASALA',
        sellingPrice: 15.0,
        costPrice: 6.0,
        stockQuantity: 300,
        lowStockThreshold: 30,
      },
      {
        businessId: apnaChai.id,
        name: 'Bun Maska Plate',
        category: 'Snacks',
        sku: 'BUN-MASKA',
        sellingPrice: 35.0,
        costPrice: 18.0,
        stockQuantity: 6, // Low stock
        lowStockThreshold: 15,
      },
      {
        businessId: apnaChai.id,
        name: 'Aloo Samosa (2 pcs)',
        category: 'Snacks',
        sku: 'SAMOSA-PAIR',
        sellingPrice: 30.0,
        costPrice: 14.0,
        stockQuantity: 40,
        lowStockThreshold: 10,
      },
    ],
  });

  // 5. Customers & Udhaar for Patel Store
  // Customer 1: Ramesh (Demo Scenario 4: ₹500 credit, ₹200 repayment = ₹300 outstanding)
  const custRamesh = await prisma.customer.create({
    data: {
      businessId: patelStore.id,
      name: 'Ramesh Bhai',
      phone: '9822233441',
      address: 'Block C-204, Radha Krishna Flats, Maninagar',
      notes: 'Regular local customer, pays at the end of the month',
    },
  });

  // Credit entry of 500
  await prisma.creditTransaction.create({
    data: {
      customerId: custRamesh.id,
      amount: 500.0,
      type: TransactionType.CREDIT,
      description: 'Grocery items on credit (Rice, Oil, Spices)',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  // Repayment entry of 200
  await prisma.creditTransaction.create({
    data: {
      customerId: custRamesh.id,
      amount: 200.0,
      type: TransactionType.REPAYMENT,
      description: 'Cash repayment at counter',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
    },
  });

  // Customer 2: Paresh Thakkar
  const custParesh = await prisma.customer.create({
    data: {
      businessId: patelStore.id,
      name: 'Paresh Thakkar',
      phone: '9877712345',
      address: 'Plot 12, Swagat Society, Maninagar',
      notes: 'Society secretary, monthly bulk purchases',
    },
  });

  await prisma.creditTransaction.create({
    data: {
      customerId: custParesh.id,
      amount: 1250.0,
      type: TransactionType.CREDIT,
      description: 'Monthly ration kit purchase',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.creditTransaction.create({
    data: {
      customerId: custParesh.id,
      amount: 500.0,
      type: TransactionType.REPAYMENT,
      description: 'UPI partial payment',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 6. Sales for Patel Store
  // Sale 1: Cash sale
  const sale1 = await prisma.sale.create({
    data: {
      businessId: patelStore.id,
      totalAmount: 448.0,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  await prisma.saleItem.createMany({
    data: [
      {
        saleId: sale1.id,
        productId: p1.id,
        quantity: 1,
        unitPrice: 420.0,
        subtotal: 420.0,
      },
      {
        saleId: sale1.id,
        productId: p3.id,
        quantity: 1,
        unitPrice: 28.0,
        subtotal: 28.0,
      },
    ],
  });

  // Sale 2: UPI sale
  const sale2 = await prisma.sale.create({
    data: {
      businessId: patelStore.id,
      totalAmount: 160.0,
      paymentMethod: PaymentMethod.UPI,
      paymentStatus: PaymentStatus.PAID,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: sale2.id,
      productId: p5.id,
      quantity: 1,
      unitPrice: 160.0,
      subtotal: 160.0,
    },
  });

  // 7. Jobs
  // Job 1: Electrician needed for showroom fitout (Scenario 2)
  const job1 = await prisma.job.create({
    data: {
      businessId: sharmaElectric.id,
      title: 'Commercial Electrician for Shop Fitting',
      description: 'Need an experienced electrician for wiring, distribution box connection, and LED track lighting in new showroom branch.',
      requiredSkills: ['Electrician', 'Wiring', 'Commercial Lighting'],
      city: 'Ahmedabad',
      locality: 'Maninagar',
      distanceKm: 2.3, // Within 5km as specified in PS
      mapLocationUrl: 'https://maps.google.com/?q=23.0012,72.6026',
      wageAmount: 750.0,
      wageType: WageType.DAILY,
      wageGuaranteed: true,
      jobType: JobType.CONTRACT,
      status: JobStatus.OPEN,
    },
  });

  // Job 2: Delivery & Store Helper (Patel Store)
  const job2 = await prisma.job.create({
    data: {
      businessId: patelStore.id,
      title: 'Store Helper & Local Delivery Boy',
      description: 'Helper needed to pack grocery orders and deliver within 3 km in Maninagar area. Bicycle or two-wheeler preferred.',
      requiredSkills: ['Delivery worker', 'Grocery Packing', 'Hindi/Gujarati'],
      city: 'Ahmedabad',
      locality: 'Maninagar',
      distanceKm: 1.1,
      mapLocationUrl: 'https://maps.google.com/?q=22.9980,72.6010',
      wageAmount: 500.0,
      wageType: WageType.DAILY,
      wageGuaranteed: true,
      jobType: JobType.FULL_TIME,
      status: JobStatus.OPEN,
    },
  });

  // Job 3: Plumber for Building Maintenance
  const job3 = await prisma.job.create({
    data: {
      businessId: sharmaElectric.id,
      title: 'Sanitary & Pipe Fitter for Renovation',
      description: 'Urgent requirement for CPVC bathroom pipe replacement and drainage clearing for 3 commercial units.',
      requiredSkills: ['Plumbing', 'Pipe Fitting', 'Sanitary'],
      city: 'Vadodara',
      locality: 'Alkapuri',
      distanceKm: 3.8,
      mapLocationUrl: 'https://maps.google.com/?q=22.3100,73.1800',
      wageAmount: 800.0,
      wageType: WageType.DAILY,
      wageGuaranteed: true,
      jobType: JobType.TEMPORARY,
      status: JobStatus.OPEN,
    },
  });

  // 8. Job Application (Demo Scenario 1 & 2): Ramesh applied to Job 1
  const app1 = await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      workerId: rameshProfile.id,
      message: 'Sir, I have 6 years experience in showroom and house wiring. I live in Maninagar and can start tomorrow.',
      status: ApplicationStatus.PENDING,
      appliedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  // Suresh applied to Job 3
  await prisma.jobApplication.create({
    data: {
      jobId: job3.id,
      workerId: sureshProfile.id,
      message: 'Expert in commercial plumbing and CPVC lines.',
      status: ApplicationStatus.ACCEPTED,
      appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: kiranUser.id,
        title: 'New Job Applicant',
        message: 'Ramesh Kumar applied for "Commercial Electrician for Shop Fitting"',
        type: 'JOB_APPLICATION',
        relatedEntityId: app1.id,
      },
      {
        userId: rajeshUser.id,
        title: 'Low Stock Alert',
        message: 'Fortune Sunflower Oil (1L) is below low stock threshold (4 remaining).',
        type: 'INVENTORY_LOW',
        relatedEntityId: p2.id,
      },
      {
        userId: rajeshUser.id,
        title: 'Low Stock Alert',
        message: 'Amul Taaza Milk (500ml) is running critically low (2 remaining).',
        type: 'INVENTORY_LOW',
        relatedEntityId: p4.id,
      },
      {
        userId: sureshUser.id,
        title: 'Application Accepted! 🎉',
        message: 'Sharma Electricals & Hardware accepted your application for Sanitary & Pipe Fitter.',
        type: 'APPLICATION_ACCEPTED',
        relatedEntityId: job3.id,
      },
    ],
  });

  console.log('✅ KaamSetu database seeded successfully with real demonstration records!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
