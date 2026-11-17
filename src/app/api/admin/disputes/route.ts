import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'REJECTED']),
  adminNotes: z.string().optional(),
  resolution: z.string().optional(),
});

// PATCH /api/admin/disputes - Admin resolves or updates dispute
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'ADMIN') return forbiddenResponse();

    const body = await req.json();
    const parsed = resolveDisputeSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const dispute = await prisma.dispute.findUnique({
      where: { id: parsed.data.disputeId },
    });
    if (!dispute) return notFoundResponse('Dispute not found');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes,
          resolution: parsed.data.resolution,
          ...(parsed.data.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
        },
      });

      // Notify complainant
      await tx.notification.create({
        data: {
          userId: dispute.raisedByUserId,
          title: `Dispute Status: ${parsed.data.status} ⚖️`,
          message: `Your dispute regarding "${dispute.title}" has been marked as ${parsed.data.status}. Resolution: ${parsed.data.resolution || parsed.data.adminNotes || 'Under administrative review'}.`,
          type: 'DISPUTE_UPDATE',
          relatedEntityId: dispute.id,
        },
      });

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'RESOLVE_DISPUTE',
          entityType: 'Dispute',
          entityId: dispute.id,
          details: JSON.stringify({
            status: parsed.data.status,
            resolution: parsed.data.resolution,
          }),
        },
      });

      return res;
    });

    return successResponse({ dispute: updated });
  } catch (error: any) {
    console.error('Error resolving dispute:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
