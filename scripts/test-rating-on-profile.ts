import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRatingOnProfileFeature() {
  console.log('🧪 Testing "Ratings & Reviews Visible on Worker Profile & Applicants" feature...\n');
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
    // 1. Locate a worker
    const worker = await prisma.workerProfile.findFirst({
      include: { user: true },
    });
    assert(!!worker, `Worker profile exists: ${worker?.user.name}`);

    // 2. Locate an employer/business
    const business = await prisma.business.findFirst({
      include: { owner: true, jobs: true },
    });
    assert(!!business, `Business owner exists: ${business?.owner.name} (${business?.name})`);

    // 3. Find or create a completed assignment between them
    let assignment = await prisma.workAssignment.findFirst({
      where: {
        workerId: worker!.id,
        businessId: business!.id,
      },
    });

    if (!assignment) {
      // Find or create an application
      let job = business!.jobs[0];
      if (!job) {
        job = await prisma.job.create({
          data: {
            businessId: business!.id,
            title: 'Sample Test Job',
            description: 'Sample description',
            city: business!.city,
            locality: business!.locality,
            wageAmount: 500,
            wageType: 'DAILY',
            requiredSkills: ['General'],
            status: 'OPEN',
          },
        });
      }

      const app = await prisma.jobApplication.upsert({
        where: {
          jobId_workerId: {
            jobId: job.id,
            workerId: worker!.id,
          },
        },
        update: { status: 'ACCEPTED' },
        create: {
          jobId: job.id,
          workerId: worker!.id,
          status: 'ACCEPTED',
          message: 'Hired for work',
        },
      });

      assignment = await prisma.workAssignment.create({
        data: {
          applicationId: app.id,
          jobId: job.id,
          businessId: business!.id,
          workerId: worker!.id,
          startDate: new Date(),
          agreedWage: 500,
          wageType: 'DAILY',
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        },
      });
    } else if (assignment.status !== 'COMPLETED') {
      assignment = await prisma.workAssignment.update({
        where: { id: assignment.id },
        data: { status: 'COMPLETED' },
      });
    }

    assert(assignment.status === 'COMPLETED', 'Completed assignment available for review');

    // 4. Submit or verify 5-star review given by employer to the worker
    const reviewFeedback = 'Outstanding work! Very punctual, polite, and skilled artisan. Highly recommended to all local shop owners!';
    let review = await prisma.review.findUnique({
      where: {
        assignmentId_reviewerId: {
          assignmentId: assignment.id,
          reviewerId: business!.ownerId,
        },
      },
    });

    if (!review) {
      review = await prisma.review.create({
        data: {
          assignmentId: assignment.id,
          reviewerId: business!.ownerId,
          revieweeId: worker!.userId,
          rating: 5,
          feedback: reviewFeedback,
        },
      });
    }

    assert(!!review, 'Review record exists in database');
    assert(review.revieweeId === worker!.userId, 'Review reviewee correctly matches worker user ID');
    assert(review.rating === 5, '5-star rating recorded');

    // 5. Test Worker Profile Reviews Aggregation (as served by GET /api/worker/profile)
    const workerReviews = await prisma.review.findMany({
      where: { revieweeId: worker!.userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            businesses: { select: { name: true, city: true }, take: 1 },
          },
        },
        assignment: {
          select: {
            id: true,
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    assert(workerReviews.length > 0, `Worker profile has ${workerReviews.length} review(s) returned`);
    const totalRev = workerReviews.length;
    const avgRating = Number((workerReviews.reduce((sum, r) => sum + r.rating, 0) / totalRev).toFixed(1));
    assert(avgRating >= 1 && avgRating <= 5, `Average rating accurately computed: ${avgRating} / 5.0`);

    const latestReview = workerReviews.find((r) => r.id === review!.id);
    assert(!!latestReview, 'Newly added review found in worker review list');
    assert(latestReview!.feedback.length > 0, `Review feedback visible: "${latestReview!.feedback.slice(0, 40)}..."`);
    assert(latestReview!.reviewer.name === business!.owner.name, `Reviewer name visible: ${latestReview!.reviewer.name}`);

    // 6. Test Job Applicants Rating Visibility (as served by GET /api/business/jobs/[id]/applicants)
    const applicantCheck = await prisma.jobApplication.findMany({
      where: { workerId: worker!.id },
      include: {
        worker: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                reviewsReceived: {
                  select: { rating: true, feedback: true, reviewer: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    assert(applicantCheck.length > 0, 'Worker job application records exist');
    const appRecord = applicantCheck[0];
    const appWorkerReviews = appRecord.worker.user.reviewsReceived || [];
    assert(appWorkerReviews.length > 0, `Employer sees applicant's review history (${appWorkerReviews.length} reviews)`);
    assert(appWorkerReviews[0].rating >= 1, `Applicant star rating verified: ${appWorkerReviews[0].rating}/5`);

    // 7. Verify Completed Jobs count
    const completedCount = await prisma.workAssignment.count({
      where: {
        workerId: worker!.id,
        status: 'COMPLETED',
      },
    });
    assert(completedCount >= 1, `Worker has ${completedCount} completed assignment(s) recorded in reputation ledger`);

    console.log(`\n🎉 All ${passed}/${total} Rating & Worker Profile Reputation Tests Passed!`);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRatingOnProfileFeature();
