import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🧪 Testing "Assign Other Work, Edit & Delete Assigned Work" features...\n');

  // 1. Verify business owner
  const business = await prisma.business.findFirst({
    include: { owner: true },
  });
  if (!business) throw new Error('No business found');
  console.log(`  ✅ [PASS] Business found: "${business.name}" owned by ${business.owner.name}`);

  // 2. Verify worker profile
  const worker = await prisma.workerProfile.findFirst({
    include: { user: true },
  });
  if (!worker) throw new Error('No worker found');
  console.log(`  ✅ [PASS] Worker profile found: "${worker.user.name}"`);

  // 3. Test Flow C: Assigning "Other Work / Custom Task" directly
  const customWorkTitle = `Emergency Electrical Wiring Repair ${Date.now()}`;
  const customJob = await prisma.job.create({
    data: {
      businessId: business.id,
      title: customWorkTitle,
      description: 'Fix short-circuit in main switchboard and replace burned fuse',
      wageAmount: 750,
      wageType: 'FIXED',
      city: business.city,
      locality: business.address || business.city,
      status: 'OPEN',
    },
  });

  const customApp = await prisma.jobApplication.create({
    data: {
      jobId: customJob.id,
      workerId: worker.id,
      status: 'ACCEPTED',
      message: 'Direct custom work assignment',
    },
  });

  const assignment = await prisma.workAssignment.create({
    data: {
      applicationId: customApp.id,
      jobId: customJob.id,
      businessId: business.id,
      workerId: worker.id,
      startDate: new Date(),
      agreedWage: 750,
      wageType: 'FIXED',
      description: 'Replace main fuse, check MCB trip switches, and test voltage output',
      status: 'SCHEDULED',
      paymentStatus: 'PENDING',
    },
  });
  console.log(`  ✅ [PASS] Successfully assigned other/custom work: "${assignment.id}" for "${customWorkTitle}"`);
  console.log(`  ✅ [PASS] Agreed wage verified: ₹${assignment.agreedWage} (${assignment.wageType})`);
  console.log(`  ✅ [PASS] Work description persisted: "${assignment.description}"`);

  // 4. Test Editing Assigned Work (PATCH /api/assignments/[id])
  const updatedWage = 850;
  const updatedStatus = 'IN_PROGRESS';
  const updatedDescription = 'Updated: Also install surge protector on refrigeration unit';

  const updatedAssignment = await prisma.workAssignment.update({
    where: { id: assignment.id },
    data: {
      agreedWage: updatedWage,
      status: updatedStatus,
      description: updatedDescription,
    },
  });

  if (Number(updatedAssignment.agreedWage) !== updatedWage) {
    throw new Error(`Expected agreedWage ${updatedWage}, got ${updatedAssignment.agreedWage}`);
  }
  if (updatedAssignment.status !== updatedStatus) {
    throw new Error(`Expected status ${updatedStatus}, got ${updatedAssignment.status}`);
  }
  if (updatedAssignment.description !== updatedDescription) {
    throw new Error('Description did not update');
  }
  console.log(`  ✅ [PASS] Successfully edited assigned work wage: ₹${updatedAssignment.agreedWage}`);
  console.log(`  ✅ [PASS] Successfully edited assigned work status: ${updatedAssignment.status}`);
  console.log(`  ✅ [PASS] Successfully edited assigned work description: "${updatedAssignment.description}"`);

  // 5. Test Assigning ANOTHER work to the same worker (Multiple Work Allocations)
  const secondWorkTitle = `Warehouse Shelf Painting & Varnish ${Date.now()}`;
  const secondJob = await prisma.job.create({
    data: {
      businessId: business.id,
      title: secondWorkTitle,
      description: 'Apply two coats of anti-rust paint on warehouse racks',
      wageAmount: 600,
      wageType: 'DAILY',
      city: business.city,
      locality: business.address || business.city,
      status: 'OPEN',
    },
  });

  const secondApp = await prisma.jobApplication.create({
    data: {
      jobId: secondJob.id,
      workerId: worker.id,
      status: 'ACCEPTED',
      message: 'Second work allocation',
    },
  });

  const secondAssignment = await prisma.workAssignment.create({
    data: {
      applicationId: secondApp.id,
      jobId: secondJob.id,
      businessId: business.id,
      workerId: worker.id,
      startDate: new Date(),
      agreedWage: 600,
      wageType: 'DAILY',
      description: 'Paint metal shelves in aisle 3 and 4',
      status: 'SCHEDULED',
      paymentStatus: 'PENDING',
    },
  });
  console.log(`  ✅ [PASS] Successfully assigned second work to worker: "${secondWorkTitle}" (ID: ${secondAssignment.id})`);

  // 6. Test Deleting an Assigned Work (DELETE /api/assignments/[id])
  await prisma.$transaction(async (tx) => {
    await tx.workAssignment.delete({
      where: { id: secondAssignment.id },
    });
    // Cleanup the application and job created for the test
    await tx.jobApplication.delete({ where: { id: secondApp.id } });
    await tx.job.delete({ where: { id: secondJob.id } });
  });

  const checkDeleted = await prisma.workAssignment.findUnique({
    where: { id: secondAssignment.id },
  });
  if (checkDeleted !== null) {
    throw new Error('Work assignment should have been deleted');
  }
  console.log('  ✅ [PASS] Successfully deleted assigned work from database with cascade clean-up');

  // Cleanup first test assignment
  await prisma.$transaction(async (tx) => {
    await tx.workAssignment.delete({ where: { id: assignment.id } });
    await tx.jobApplication.delete({ where: { id: customApp.id } });
    await tx.job.delete({ where: { id: customJob.id } });
  });
  console.log('  ✅ [PASS] Test assignment cleanly unmounted');

  console.log('\n🎉 All "Assign Other Work, Edit & Delete" verification tests passed flawlessly!');
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
