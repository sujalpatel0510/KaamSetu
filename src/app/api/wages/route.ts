import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { calculateSubtotal } from '@/lib/financial';
import { z } from 'zod';

const recordPaymentSchema = z.object({
  assignmentId: z.string().uuid(),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CREDIT']).default('CASH'),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/wages - Get wage & earnings telemetry
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    if (authUser.role === 'WORKER') {
      const worker = await prisma.workerProfile.findUnique({
        where: { userId: authUser.id },
      });
      if (!worker) return notFoundResponse('Worker profile not found');

      // Fetch all assignments with attendances and payments
      const assignments = await prisma.workAssignment.findMany({
        where: { workerId: worker.id },
        include: {
          attendances: { where: { status: { in: ['APPROVED', 'PRESENT', 'HALF_DAY'] } } },
          wagePayments: true,
          job: { select: { title: true } },
          business: { select: { name: true } },
        },
      });

      let totalEarned = 0;
      let totalPaid = 0;

      const assignmentBreakdowns = assignments.map((a) => {
        let earnedForAssignment = 0;
        const agreedWage = Number(a.agreedWage);

        if (a.wageType === 'DAILY') {
          // Count approved days (HALF_DAY counts as 0.5)
          const daysWorked = a.attendances.reduce((acc, att) => {
            return acc + (att.status === 'HALF_DAY' ? 0.5 : 1);
          }, 0);
          earnedForAssignment = Number(calculateSubtotal(agreedWage, daysWorked));
        } else {
          // FIXED wage
          earnedForAssignment = agreedWage;
        }

        const paidForAssignment = a.wagePayments.reduce((acc, p) => acc + Number(p.amount), 0);
        const remainingForAssignment = Math.max(0, earnedForAssignment - paidForAssignment);

        totalEarned += earnedForAssignment;
        totalPaid += paidForAssignment;

        return {
          id: a.id,
          jobTitle: a.job.title,
          businessName: a.business.name,
          agreedWage,
          wageType: a.wageType,
          earned: earnedForAssignment,
          paid: paidForAssignment,
          remaining: remainingForAssignment,
          status: a.status,
          paymentStatus: a.paymentStatus,
        };
      });

      const pendingWages = Math.max(0, totalEarned - totalPaid);

      // Recent payment transactions
      const recentPayments = await prisma.wagePayment.findMany({
        where: { workerId: worker.id },
        include: {
          business: { select: { name: true } },
          assignment: { select: { job: { select: { title: true } } } },
        },
        orderBy: { paidAt: 'desc' },
        take: 20,
      });

      return successResponse({
        stats: {
          totalEarned: Number(totalEarned.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          pendingWages: Number(pendingWages.toFixed(2)),
          totalAssignments: assignments.length,
        },
        assignments: assignmentBreakdowns,
        recentPayments,
      });
    } else if (authUser.role === 'BUSINESS_OWNER') {
      const business = await prisma.business.findFirst({
        where: { ownerId: authUser.id },
      });
      if (!business) return notFoundResponse('Business not found');

      const assignments = await prisma.workAssignment.findMany({
        where: { businessId: business.id },
        include: {
          attendances: { where: { status: { in: ['APPROVED', 'PRESENT', 'HALF_DAY'] } } },
          wagePayments: true,
          job: { select: { title: true } },
          worker: { include: { user: { select: { name: true, phone: true } } } },
        },
      });

      let totalPayable = 0;
      let totalPaid = 0;

      const assignmentBreakdowns = assignments.map((a) => {
        let payableForAssignment = 0;
        const agreedWage = Number(a.agreedWage);

        if (a.wageType === 'DAILY') {
          const daysWorked = a.attendances.reduce((acc, att) => {
            return acc + (att.status === 'HALF_DAY' ? 0.5 : 1);
          }, 0);
          payableForAssignment = Number(calculateSubtotal(agreedWage, daysWorked));
        } else {
          payableForAssignment = agreedWage;
        }

        const paidForAssignment = a.wagePayments.reduce((acc, p) => acc + Number(p.amount), 0);
        const remainingForAssignment = Math.max(0, payableForAssignment - paidForAssignment);

        totalPayable += payableForAssignment;
        totalPaid += paidForAssignment;

        return {
          id: a.id,
          workerName: a.worker.user.name,
          workerPhone: a.worker.user.phone,
          jobTitle: a.job.title,
          agreedWage,
          wageType: a.wageType,
          payable: payableForAssignment,
          paid: paidForAssignment,
          remaining: remainingForAssignment,
          status: a.status,
          paymentStatus: a.paymentStatus,
        };
      });

      const pendingPayable = Math.max(0, totalPayable - totalPaid);

      const recentPayments = await prisma.wagePayment.findMany({
        where: { businessId: business.id },
        include: {
          worker: { include: { user: { select: { name: true } } } },
          assignment: { select: { job: { select: { title: true } } } },
        },
        orderBy: { paidAt: 'desc' },
        take: 20,
      });

      return successResponse({
        stats: {
          totalPayable: Number(totalPayable.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          pendingPayable: Number(pendingPayable.toFixed(2)),
          activeAssignmentsCount: assignments.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'SCHEDULED').length,
        },
        assignments: assignmentBreakdowns,
        recentPayments,
      });
    }

    return forbiddenResponse();
  } catch (error: any) {
    console.error('Error fetching wages telemetry:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/wages - Record a wage payment
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') {
      return forbiddenResponse('Only employers can record wage payments');
    }

    const body = await req.json();
    const parsed = recordPaymentSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    const assignment = await prisma.workAssignment.findUnique({
      where: { id: parsed.data.assignmentId },
      include: {
        business: true,
        worker: { include: { user: true } },
        attendances: { where: { status: { in: ['APPROVED', 'PRESENT', 'HALF_DAY'] } } },
        wagePayments: true,
        job: true,
      },
    });

    if (!assignment) return notFoundResponse('Assignment not found');
    if (assignment.businessId !== business.id) return forbiddenResponse('Unauthorized assignment');

    // Calculate total earned vs total paid
    let totalEarned = 0;
    const agreedWage = Number(assignment.agreedWage);

    if (assignment.wageType === 'DAILY') {
      const daysWorked = assignment.attendances.reduce((acc, att) => {
        return acc + (att.status === 'HALF_DAY' ? 0.5 : 1);
      }, 0);
      totalEarned = Number(calculateSubtotal(agreedWage, daysWorked));
    } else {
      totalEarned = agreedWage;
    }

    const previousPaid = assignment.wagePayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const newTotalPaid = previousPaid + parsed.data.amount;

    // Determine new WagePaymentStatus
    const newPaymentStatus = newTotalPaid >= totalEarned && totalEarned > 0 ? 'PAID' : 'PARTIALLY_PAID';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create wage payment record
      const payment = await tx.wagePayment.create({
        data: {
          assignmentId: assignment.id,
          businessId: business.id,
          workerId: assignment.workerId,
          amount: parsed.data.amount,
          paymentMethod: parsed.data.paymentMethod as any,
          transactionReference: parsed.data.transactionReference,
          notes: parsed.data.notes,
        },
      });

      // 2. Update assignment payment status
      await tx.workAssignment.update({
        where: { id: assignment.id },
        data: { paymentStatus: newPaymentStatus },
      });

      // 3. Notify worker
      await tx.notification.create({
        data: {
          userId: assignment.worker.userId,
          title: 'Wage Payment Received! 💰',
          message: `${business.name} recorded a payment of ₹${parsed.data.amount} for "${assignment.job.title}" via ${parsed.data.paymentMethod}.`,
          type: 'WAGE_PAID',
          relatedEntityId: payment.id,
        },
      });

      return payment;
    });

    return successResponse({ payment: result, paymentStatus: newPaymentStatus }, 201);
  } catch (error: any) {
    console.error('Error recording wage payment:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
