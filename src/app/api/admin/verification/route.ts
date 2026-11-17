import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const reviewVerificationSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['VERIFIED', 'REJECTED']),
  adminNotes: z.string().optional(),
});

// GET /api/admin/verification - List all verification requests for admin review
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'ADMIN') return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const requests = await prisma.verificationRequest.findMany({
      where: status ? { status: status as any } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            workerProfile: { select: { city: true, skills: true } },
            businesses: { select: { name: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return successResponse({ requests });
  } catch (error: any) {
    console.error('Error fetching admin verification requests:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// PATCH /api/admin/verification - Admin approves or rejects verification
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'ADMIN') return forbiddenResponse();

    const body = await req.json();
    const parsed = reviewVerificationSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const request = await prisma.verificationRequest.findUnique({
      where: { id: parsed.data.requestId },
      include: { user: true },
    });
    if (!request) return notFoundResponse('Verification request not found');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update verification request record
      const updatedRequest = await tx.verificationRequest.update({
        where: { id: request.id },
        data: {
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes,
          reviewedByAdminId: authUser.id,
          reviewedAt: new Date(),
        },
      });

      // 2. Update status on worker or business profile
      if (request.role === 'WORKER') {
        await tx.workerProfile.update({
          where: { userId: request.userId },
          data: { idVerificationStatus: parsed.data.status },
        });
      } else if (request.role === 'BUSINESS_OWNER') {
        await tx.business.updateMany({
          where: { ownerId: request.userId },
          data: { businessVerificationStatus: parsed.data.status },
        });
      }

      // 3. Send notification to user
      const isApproved = parsed.data.status === 'VERIFIED';
      await tx.notification.create({
        data: {
          userId: request.userId,
          title: isApproved ? 'Profile Verified! 🛡️' : 'Verification Update ⚠️',
          message: isApproved
            ? 'Congratulations! Your profile has been officially verified by KaamSetu administrators.'
            : `Your verification request was rejected. Reason: ${parsed.data.adminNotes || 'Insufficient documentation'}.`,
          type: 'VERIFICATION_UPDATE',
          relatedEntityId: request.id,
        },
      });

      // 4. Record audit log
      await tx.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'REVIEW_VERIFICATION',
          entityType: 'VerificationRequest',
          entityId: request.id,
          details: JSON.stringify({
            status: parsed.data.status,
            notes: parsed.data.adminNotes,
            targetUserId: request.userId,
          }),
        },
      });

      return updatedRequest;
    });

    return successResponse({ request: result });
  } catch (error: any) {
    console.error('Error reviewing verification request:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
