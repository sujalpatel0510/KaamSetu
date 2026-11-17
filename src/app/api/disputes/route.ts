import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const createDisputeSchema = z.object({
  category: z.enum([
    'WAGE_DISPUTE',
    'UNSAFE_CONDITIONS',
    'MISCONDUCT',
    'FAKE_LISTING',
    'ATTENDANCE_DISPUTE',
    'OTHER',
  ]),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  evidenceUrl: z.string().optional(),
  againstUserId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  assignmentId: z.string().uuid().optional(),
});

// GET /api/disputes - Get user's filed disputes
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    let whereClause: any = {};
    if (authUser.role === 'ADMIN') {
      whereClause = {};
    } else if (authUser.role === 'WORKER') {
      whereClause = { raisedByUserId: authUser.id };
    } else if (authUser.role === 'BUSINESS_OWNER') {
      const business = await prisma.business.findFirst({
        where: { ownerId: authUser.id },
      });
      whereClause = {
        OR: [
          { raisedByUserId: authUser.id },
          ...(business ? [{ businessId: business.id }] : []),
        ],
      };
    }

    const disputes = await prisma.dispute.findMany({
      where: whereClause,
      include: {
        raisedByUser: { select: { id: true, name: true, role: true } },
        againstUser: { select: { id: true, name: true, role: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse({ disputes });
  } catch (error: any) {
    console.error('Error fetching disputes:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/disputes - Raise a dispute
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createDisputeSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const dispute = await prisma.$transaction(async (tx) => {
      const newDispute = await tx.dispute.create({
        data: {
          raisedByUserId: authUser.id,
          category: parsed.data.category,
          title: parsed.data.title,
          description: parsed.data.description,
          evidenceUrl: parsed.data.evidenceUrl,
          againstUserId: parsed.data.againstUserId,
          businessId: parsed.data.businessId,
          jobId: parsed.data.jobId,
          assignmentId: parsed.data.assignmentId,
          status: 'OPEN',
        },
      });

      // If tied to an assignment, update assignment status to DISPUTED
      if (parsed.data.assignmentId) {
        await tx.workAssignment.update({
          where: { id: parsed.data.assignmentId },
          data: { status: 'DISPUTED' },
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'RAISE_DISPUTE',
          entityType: 'Dispute',
          entityId: newDispute.id,
          details: JSON.stringify({ category: parsed.data.category, title: parsed.data.title }),
        },
      });

      return newDispute;
    });

    return successResponse({ dispute, message: 'Dispute filed successfully. Administrators have been notified.' }, 201);
  } catch (error: any) {
    console.error('Error filing dispute:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
