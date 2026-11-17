import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const createVerificationSchema = z.object({
  documentType: z.string().min(2, 'Document type required'),
  documentNumber: z.string().optional(),
  documentUrl: z.string().optional(),
});

// GET /api/verification - Get verification status and request history for current user
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    let status = 'NOT_SUBMITTED';
    let phoneVerified = false;

    if (authUser.role === 'WORKER') {
      const worker = await prisma.workerProfile.findUnique({
        where: { userId: authUser.id },
      });
      if (worker) {
        status = worker.idVerificationStatus;
        phoneVerified = worker.phoneVerified;
      }
    } else if (authUser.role === 'BUSINESS_OWNER') {
      const business = await prisma.business.findFirst({
        where: { ownerId: authUser.id },
      });
      if (business) {
        status = business.businessVerificationStatus;
        phoneVerified = business.phoneVerified;
      }
    }

    const requests = await prisma.verificationRequest.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      verification: {
        status,
        phoneVerified,
        requests,
      },
    });
  } catch (error: any) {
    console.error('Error fetching verification status:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/verification - Submit a verification document for review
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createVerificationSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create verification request
      const request = await tx.verificationRequest.create({
        data: {
          userId: authUser.id,
          role: authUser.role as any,
          documentType: parsed.data.documentType,
          documentNumber: parsed.data.documentNumber,
          documentUrl: parsed.data.documentUrl,
          status: 'PENDING',
        },
      });

      // 2. Set status to PENDING on profile
      if (authUser.role === 'WORKER') {
        await tx.workerProfile.update({
          where: { userId: authUser.id },
          data: { idVerificationStatus: 'PENDING' },
        });
      } else if (authUser.role === 'BUSINESS_OWNER') {
        await tx.business.updateMany({
          where: { ownerId: authUser.id },
          data: { businessVerificationStatus: 'PENDING' },
        });
      }

      return request;
    });

    return successResponse({ request: result, message: 'Verification request submitted for admin review' }, 201);
  } catch (error: any) {
    console.error('Error submitting verification request:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
