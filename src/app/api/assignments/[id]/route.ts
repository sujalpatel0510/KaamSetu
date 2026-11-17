import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']).optional(),
  agreedWage: z.number().positive().optional(),
  wageType: z.enum(['DAILY', 'FIXED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  completionNotes: z.string().optional().nullable(),
});

// GET /api/assignments/[id] - Get details of a single work assignment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { id } = await params;
    const assignment = await prisma.workAssignment.findUnique({
      where: { id },
      include: {
        job: true,
        business: true,
        worker: { include: { user: true } },
        attendances: { orderBy: { date: 'desc' } },
        wagePayments: { orderBy: { paidAt: 'desc' } },
        reviews: { include: { reviewer: { select: { id: true, name: true, role: true } } } },
      },
    });

    if (!assignment) return notFoundResponse('Assignment not found');

    // Access control: Worker assigned, Business owner of the job, or Admin
    if (
      authUser.role === 'WORKER' &&
      assignment.worker.userId !== authUser.id
    ) {
      return forbiddenResponse();
    }
    if (
      authUser.role === 'BUSINESS_OWNER' &&
      assignment.business.ownerId !== authUser.id
    ) {
      return forbiddenResponse();
    }

    return successResponse({ assignment });
  } catch (error: any) {
    console.error('Error fetching assignment details:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// PATCH /api/assignments/[id] - Update assignment status or details (wage, dates, instructions)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateAssignmentSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const assignment = await prisma.workAssignment.findUnique({
      where: { id },
      include: {
        business: true,
        worker: { include: { user: true } },
        job: true,
      },
    });

    if (!assignment) return notFoundResponse('Assignment not found');

    // Only business owner of the job or worker can update appropriate statuses
    const isOwner = authUser.role === 'BUSINESS_OWNER' && assignment.business.ownerId === authUser.id;
    const isWorker = authUser.role === 'WORKER' && assignment.worker.userId === authUser.id;
    const isAdmin = authUser.role === 'ADMIN';

    if (!isOwner && !isWorker && !isAdmin) return forbiddenResponse();

    // If updating core work terms (wage, dates, description), require business owner or admin
    const isEditingTerms =
      parsed.data.agreedWage !== undefined ||
      parsed.data.wageType !== undefined ||
      parsed.data.startDate !== undefined ||
      parsed.data.endDate !== undefined ||
      parsed.data.description !== undefined;

    if (isEditingTerms && !isOwner && !isAdmin) {
      return forbiddenResponse('Only the business owner or admin can edit assignment terms');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (parsed.data.status) {
        updateData.status = parsed.data.status;
        if (parsed.data.status === 'COMPLETED' && !assignment.endDate) {
          updateData.endDate = new Date();
        }
      }

      if (parsed.data.agreedWage !== undefined) {
        updateData.agreedWage = parsed.data.agreedWage;
      }

      if (parsed.data.wageType !== undefined) {
        updateData.wageType = parsed.data.wageType;
      }

      if (parsed.data.startDate !== undefined) {
        updateData.startDate = new Date(parsed.data.startDate);
      }

      if (parsed.data.endDate !== undefined) {
        updateData.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
      }

      if (parsed.data.description !== undefined) {
        updateData.description = parsed.data.description?.trim() || null;
      }

      if (parsed.data.completionNotes !== undefined) {
        updateData.completionNotes = parsed.data.completionNotes?.trim() || null;
      }

      const res = await tx.workAssignment.update({
        where: { id },
        data: updateData,
      });

      // Notify the counterparty on update
      if (parsed.data.status) {
        const notifyTargetUserId = isOwner ? assignment.worker.userId : assignment.business.ownerId;
        await tx.notification.create({
          data: {
            userId: notifyTargetUserId,
            title: `Work Assignment Status: ${parsed.data.status} 📋`,
            message: `Assignment for "${assignment.job.title}" has been updated to ${parsed.data.status}.`,
            type: 'ASSIGNMENT_UPDATED',
            relatedEntityId: assignment.id,
          },
        });
      } else if (isEditingTerms && isOwner) {
        await tx.notification.create({
          data: {
            userId: assignment.worker.userId,
            title: 'Work Assignment Terms Updated 📝',
            message: `Employer ${assignment.business.name} updated the terms for "${assignment.job.title}". Agreed Wage: ₹${parsed.data.agreedWage ?? assignment.agreedWage}.`,
            type: 'ASSIGNMENT_UPDATED',
            relatedEntityId: assignment.id,
          },
        });
      }

      return res;
    });

    return successResponse({ assignment: updated });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// DELETE /api/assignments/[id] - Delete / remove a work assignment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { id } = await params;
    const assignment = await prisma.workAssignment.findUnique({
      where: { id },
      include: {
        business: true,
        worker: { include: { user: true } },
        job: true,
      },
    });

    if (!assignment) return notFoundResponse('Assignment not found');

    const isOwner = authUser.role === 'BUSINESS_OWNER' && assignment.business.ownerId === authUser.id;
    const isAdmin = authUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return forbiddenResponse('Only the business owner or admin can delete this work assignment');
    }

    await prisma.$transaction(async (tx) => {
      // Delete the work assignment (Prisma cascade removes attendance, reviews, wage payments)
      await tx.workAssignment.delete({
        where: { id },
      });

      // Notify worker of assignment cancellation/removal
      await tx.notification.create({
        data: {
          userId: assignment.worker.userId,
          title: 'Work Assignment Cancelled / Removed 🗑️',
          message: `The work assignment for "${assignment.job.title}" was deleted by ${assignment.business.name}.`,
          type: 'ASSIGNMENT_UPDATED',
        },
      });
    });

    return successResponse({ message: 'Work assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
