import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const createReviewSchema = z.object({
  assignmentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(5, 'Feedback must be at least 5 characters'),
});

const reportReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reportReason: z.string().min(5, 'Report reason required'),
});

// GET /api/reviews - List reviews for a user or assignment
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const assignmentId = searchParams.get('assignmentId');

    const whereClause: any = {};
    if (userId) whereClause.revieweeId = userId;
    if (assignmentId) whereClause.assignmentId = assignmentId;

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        reviewer: { select: { id: true, name: true, role: true } },
        assignment: { select: { id: true, job: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const averageRating =
      reviews.length > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
        : 0;

    return successResponse({
      reviews,
      summary: {
        totalReviews: reviews.length,
        averageRating,
      },
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/reviews - Submit a review after assignment completion
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    // 1. Fetch assignment and verify it is COMPLETED
    const assignment = await prisma.workAssignment.findUnique({
      where: { id: parsed.data.assignmentId },
      include: {
        business: true,
        worker: { include: { user: true } },
        job: true,
      },
    });

    if (!assignment) return notFoundResponse('Assignment not found');
    if (assignment.status !== 'COMPLETED') {
      return errorResponse('Reviews are only permitted after a work assignment is marked COMPLETED', 400);
    }

    // 2. Identify reviewee
    let revieweeId = '';
    if (authUser.role === 'WORKER') {
      if (assignment.worker.userId !== authUser.id) return forbiddenResponse('Unauthorized assignment');
      revieweeId = assignment.business.ownerId;
    } else if (authUser.role === 'BUSINESS_OWNER') {
      if (assignment.business.ownerId !== authUser.id) return forbiddenResponse('Unauthorized assignment');
      revieweeId = assignment.worker.userId;
    } else {
      return forbiddenResponse('Only workers and employers can submit reviews');
    }

    if (revieweeId === authUser.id) {
      return errorResponse('You cannot review yourself', 400);
    }

    // 3. Prevent duplicate reviews
    const existing = await prisma.review.findUnique({
      where: {
        assignmentId_reviewerId: {
          assignmentId: assignment.id,
          reviewerId: authUser.id,
        },
      },
    });

    if (existing) {
      return errorResponse('You have already submitted a review for this assignment', 409);
    }

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          assignmentId: assignment.id,
          reviewerId: authUser.id,
          revieweeId,
          rating: parsed.data.rating,
          feedback: parsed.data.feedback,
        },
      });

      // Notify reviewee
      await tx.notification.create({
        data: {
          userId: revieweeId,
          title: 'New Rating & Feedback Received! ⭐',
          message: `${authUser.name} rated you ${parsed.data.rating}/5 stars for work on "${assignment.job.title}".`,
          type: 'REVIEW_RECEIVED',
          relatedEntityId: newReview.id,
        },
      });

      return newReview;
    });

    return successResponse({ review }, 201);
  } catch (error: any) {
    console.error('Error creating review:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// PATCH /api/reviews - Report an inappropriate review
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const body = await req.json();
    const parsed = reportReviewSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const review = await prisma.review.findUnique({
      where: { id: parsed.data.reviewId },
    });
    if (!review) return notFoundResponse('Review not found');

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        isReported: true,
        reportReason: parsed.data.reportReason,
      },
    });

    return successResponse({ review: updated, message: 'Review reported for administrative moderation' });
  } catch (error: any) {
    console.error('Error reporting review:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
