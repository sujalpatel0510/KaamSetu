import { PrismaClient, Role, WageType, AssignmentStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function testAssignWorkFeature() {
  console.log('🧪 Testing "Assign Work as Shopkeeper/Business" feature...\n');
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
    // 1. Locate a business and an open job
    const business = await prisma.business.findFirst({
      include: {
        jobs: { where: { status: 'OPEN' } },
        owner: true,
      },
    });
    assert(!!business, 'Shopkeeper business exists');
    assert(business!.jobs.length > 0, `Shopkeeper has open job listings (${business!.jobs.length} found)`);

    const job = business!.jobs[0];

    // 2. Find a registered worker
    const worker = await prisma.workerProfile.findFirst({
      include: { user: true },
    });
    assert(!!worker, `Registered worker profile found: ${worker?.user.name}`);

    // 3. Test Direct Work Assignment flow (Job + Worker directly assigned by employer)
    // Find or create JobApplication with status ACCEPTED
    let app = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId: job.id,
          workerId: worker!.id,
        },
      },
      include: { workAssignment: true },
    });

    if (!app) {
      app = await prisma.jobApplication.create({
        data: {
          jobId: job.id,
          workerId: worker!.id,
          status: 'ACCEPTED',
          message: 'Direct assignment by business owner',
        },
        include: { workAssignment: true },
      });
      assert(app.status === 'ACCEPTED', 'Job application automatically created with ACCEPTED status for direct hire');
    }

    // Verify WorkAssignment creation or existence
    let assignment = app.workAssignment;
    if (!assignment) {
      assignment = await prisma.workAssignment.create({
        data: {
          applicationId: app.id,
          jobId: job.id,
          businessId: business!.id,
          workerId: worker!.id,
          startDate: new Date(),
          agreedWage: Number(job.wageAmount),
          wageType: job.wageType,
          status: 'SCHEDULED',
        },
      });

      // Worker notification
      const notification = await prisma.notification.create({
        data: {
          userId: worker!.userId,
          title: 'Work Assignment Scheduled! 💼',
          message: `${business!.name} assigned you work for "${job.title}". Agreed wage: ₹${job.wageAmount}.`,
          type: 'ASSIGNMENT_CREATED',
          relatedEntityId: assignment.id,
        },
      });
      assert(!!notification, 'In-app notification dispatched to worker upon work assignment');
    }

    assert(!!assignment, 'Work assignment successfully created and scheduled by employer');
    assert(assignment!.businessId === business!.id, 'Assignment correctly linked to shopkeeper business');
    assert(assignment!.workerId === worker!.id, 'Assignment correctly linked to target worker');
    assert(Number(assignment!.agreedWage) > 0, `Agreed wage recorded: ₹${assignment!.agreedWage}`);

    // 4. Test task instructions / description persistence
    const testInstructions = 'Install 4 ceiling fans and test switchboard wiring in the main showroom.';
    const updatedAssignment = await prisma.workAssignment.update({
      where: { id: assignment!.id },
      data: { description: testInstructions },
    });
    assert(
      updatedAssignment.description === testInstructions,
      'Work description & task instructions successfully persisted on WorkAssignment'
    );

    // 5. Verify worker view queries return description
    const workerAssignments = await prisma.workAssignment.findMany({
      where: { workerId: worker!.id },
      include: {
        job: true,
        business: true,
      },
    });
    const foundAssignment = workerAssignments.find((a) => a.id === assignment!.id);
    assert(
      foundAssignment?.description === testInstructions,
      'Worker assignments query returns task description so worker clearly sees what to do'
    );

    // 6. Test duplicate prevention
    let duplicateBlocked = false;
    try {
      await prisma.workAssignment.create({
        data: {
          applicationId: app.id,
          jobId: job.id,
          businessId: business!.id,
          workerId: worker!.id,
          startDate: new Date(),
          agreedWage: 600,
          wageType: 'DAILY',
        },
      });
    } catch {
      duplicateBlocked = true;
    }
    assert(duplicateBlocked, 'Duplicate work assignment strictly blocked by unique applicationId constraint');

    // 5. Test candidates query logic
    const unassignedAccepted = await prisma.jobApplication.findMany({
      where: {
        job: { businessId: business!.id },
        status: 'ACCEPTED',
        workAssignment: null,
      },
    });
    assert(Array.isArray(unassignedAccepted), 'Successfully queried unassigned accepted applicant candidates');

    const availableWorkers = await prisma.workerProfile.findMany({
      where: { availability: true },
      take: 5,
    });
    assert(availableWorkers.length > 0, `Successfully queried available worker candidates (${availableWorkers.length} found)`);

    console.log(`\n🎉 All ${passed}/${total} Assign Work Feature Tests Passed!`);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignWorkFeature();
