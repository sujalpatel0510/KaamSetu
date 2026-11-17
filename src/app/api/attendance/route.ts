import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const checkInSchema = z.object({
  assignmentId: z.string().uuid(),
  action: z.enum(['CHECK_IN', 'CHECK_OUT']),
});

const correctAttendanceSchema = z.object({
  attendanceId: z.string().uuid(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'PENDING_CONFIRMATION', 'APPROVED']),
  hoursWorked: z.number().min(0).max(24).optional(),
  correctionReason: z.string().min(3, 'Correction reason required'),
});

// Helper to get normalized midnight Date for current server date
function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// GET /api/attendance - List attendance records
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');
    const dateParam = searchParams.get('date');

    let whereClause: any = {};
    if (assignmentId) whereClause.assignmentId = assignmentId;
    if (dateParam) whereClause.date = new Date(dateParam);

    if (authUser.role === 'WORKER') {
      const worker = await prisma.workerProfile.findUnique({
        where: { userId: authUser.id },
      });
      if (!worker) return notFoundResponse('Worker profile not found');
      whereClause.workerId = worker.id;
    } else if (authUser.role === 'BUSINESS_OWNER') {
      const business = await prisma.business.findFirst({
        where: { ownerId: authUser.id },
      });
      if (!business) return notFoundResponse('Business not found');
      whereClause.businessId = business.id;
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        worker: { include: { user: { select: { id: true, name: true, phone: true } } } },
        business: { select: { id: true, name: true } },
        assignment: { select: { id: true, agreedWage: true, wageType: true, job: { select: { title: true } } } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return successResponse({ attendances });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/attendance - Worker check-in / check-out
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'WORKER') return forbiddenResponse('Only workers can check in or out');

    const body = await req.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: authUser.id },
    });
    if (!worker) return notFoundResponse('Worker profile not found');

    const assignment = await prisma.workAssignment.findUnique({
      where: { id: parsed.data.assignmentId },
      include: { business: true, job: true },
    });
    if (!assignment) return notFoundResponse('Assignment not found');
    if (assignment.workerId !== worker.id) return forbiddenResponse('Unauthorized assignment');
    if (assignment.status !== 'IN_PROGRESS' && assignment.status !== 'SCHEDULED') {
      return errorResponse(`Cannot log attendance for assignment with status ${assignment.status}`, 400);
    }

    const today = getTodayDate();
    const now = new Date();

    if (parsed.data.action === 'CHECK_IN') {
      // 1. Prevent duplicate check-in on the same date
      const existing = await prisma.attendance.findUnique({
        where: {
          assignmentId_date: {
            assignmentId: assignment.id,
            date: today,
          },
        },
      });

      if (existing && existing.checkIn) {
        return errorResponse('You have already checked in today for this assignment', 400);
      }

      const attendance = await prisma.$transaction(async (tx) => {
        // If assignment was SCHEDULED, transition to IN_PROGRESS upon first check-in
        if (assignment.status === 'SCHEDULED') {
          await tx.workAssignment.update({
            where: { id: assignment.id },
            data: { status: 'IN_PROGRESS' },
          });
        }

        const record = await tx.attendance.upsert({
          where: {
            assignmentId_date: {
              assignmentId: assignment.id,
              date: today,
            },
          },
          create: {
            assignmentId: assignment.id,
            workerId: worker.id,
            businessId: assignment.businessId,
            date: today,
            checkIn: now,
            status: 'PENDING_CONFIRMATION',
          },
          update: {
            checkIn: now,
            status: 'PENDING_CONFIRMATION',
          },
        });

        // Notify employer
        await tx.notification.create({
          data: {
            userId: assignment.business.ownerId,
            title: 'Worker Checked In ⏰',
            message: `${authUser.name} checked in for "${assignment.job.title}".`,
            type: 'ATTENDANCE_CHECKIN',
            relatedEntityId: record.id,
          },
        });

        return record;
      });

      return successResponse({ attendance, message: 'Checked in successfully' }, 201);
    } else {
      // CHECK_OUT action
      const existing = await prisma.attendance.findUnique({
        where: {
          assignmentId_date: {
            assignmentId: assignment.id,
            date: today,
          },
        },
      });

      if (!existing || !existing.checkIn) {
        return errorResponse('Cannot check out without prior check-in today', 400);
      }
      if (existing.checkOut) {
        return errorResponse('You have already checked out today for this assignment', 400);
      }

      // Calculate working hours
      const diffMs = now.getTime() - new Date(existing.checkIn).getTime();
      const hoursWorked = Math.max(0.1, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: now,
          hoursWorked,
        },
      });

      return successResponse({ attendance, message: `Checked out successfully (${hoursWorked} hrs recorded)` });
    }
  } catch (error: any) {
    console.error('Error in attendance check-in/out:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// PATCH /api/attendance - Employer approves or corrects attendance with an audit trail
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || (authUser.role !== 'BUSINESS_OWNER' && authUser.role !== 'ADMIN')) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const parsed = correctAttendanceSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const attendance = await prisma.attendance.findUnique({
      where: { id: parsed.data.attendanceId },
      include: {
        business: true,
        worker: { include: { user: true } },
        assignment: { include: { job: true } },
      },
    });

    if (!attendance) return notFoundResponse('Attendance record not found');
    if (authUser.role === 'BUSINESS_OWNER' && attendance.business.ownerId !== authUser.id) {
      return forbiddenResponse('Unauthorized business');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.attendance.update({
        where: { id: attendance.id },
        data: {
          status: parsed.data.status,
          ...(parsed.data.hoursWorked !== undefined ? { hoursWorked: parsed.data.hoursWorked } : {}),
          correctionReason: parsed.data.correctionReason,
          verifiedByUserId: authUser.id,
        },
      });

      // Maintain audit log for corrections
      await tx.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'CORRECT_ATTENDANCE',
          entityType: 'Attendance',
          entityId: attendance.id,
          details: JSON.stringify({
            previousStatus: attendance.status,
            newStatus: parsed.data.status,
            previousHours: attendance.hoursWorked,
            newHours: parsed.data.hoursWorked,
            reason: parsed.data.correctionReason,
          }),
        },
      });

      // Notify worker
      await tx.notification.create({
        data: {
          userId: attendance.worker.userId,
          title: `Attendance Updated: ${parsed.data.status} ✅`,
          message: `${attendance.business.name} updated your attendance for ${new Date(attendance.date).toLocaleDateString()}: "${parsed.data.correctionReason}".`,
          type: 'ATTENDANCE_CONFIRMED',
          relatedEntityId: attendance.id,
        },
      });

      return res;
    });

    return successResponse({ attendance: updated });
  } catch (error: any) {
    console.error('Error correcting attendance:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
