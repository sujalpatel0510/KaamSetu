import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const createAssignmentSchema = z.object({
  applicationId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  workerId: z.string().uuid().optional(),
  customWorkTitle: z.string().min(2).max(100).optional(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  agreedWage: z.number().positive(),
  wageType: z.enum(['DAILY', 'FIXED']).default('DAILY'),
  description: z.string().optional().nullable(),
}).refine(
  (data) => Boolean(data.applicationId) || Boolean(data.workerId && (data.jobId || data.customWorkTitle)),
  { message: 'Provide either applicationId or workerId with a jobId/customWorkTitle' }
);

// GET /api/assignments - List work assignments based on role
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');

    if (authUser.role === 'BUSINESS_OWNER' && mode === 'candidates') {
      const business = await prisma.business.findFirst({
        where: { ownerId: authUser.id },
      });
      if (!business) return notFoundResponse('Business not found');

      const [jobs, unassignedApplicants, availableWorkers] = await Promise.all([
        prisma.job.findMany({
          where: { businessId: business.id },
          select: {
            id: true,
            title: true,
            city: true,
            locality: true,
            wageAmount: true,
            wageType: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.jobApplication.findMany({
          where: {
            job: { businessId: business.id },
            status: 'ACCEPTED',
            workAssignment: null,
          },
          include: {
            job: {
              select: { id: true, title: true, wageAmount: true, wageType: true },
            },
            worker: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
        }),
        prisma.workerProfile.findMany({
          where: { availability: true },
          select: {
            id: true,
            city: true,
            locality: true,
            skills: true,
            experienceYears: true,
            verifiedSkillBadge: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                reviewsReceived: {
                  select: { rating: true },
                },
              },
            },
          },
          take: 40,
          orderBy: { experienceYears: 'desc' },
        }),
      ]);

      const formattedAvailableWorkers = availableWorkers.map((w) => {
        const reviews = w.user.reviewsReceived || [];
        const totalReviews = reviews.length;
        const averageRating =
          totalReviews > 0
            ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
            : 0;

        return {
          id: w.id,
          city: w.city,
          locality: w.locality,
          skills: w.skills,
          experienceYears: w.experienceYears,
          verifiedSkillBadge: w.verifiedSkillBadge,
          user: { id: w.user.id, name: w.user.name, phone: w.user.phone },
          averageRating,
          totalReviews,
        };
      });

      return successResponse({ jobs, unassignedApplicants, availableWorkers: formattedAvailableWorkers });
    }

    if (authUser.role === 'WORKER') {
      const worker = await prisma.workerProfile.findUnique({
        where: { userId: authUser.id },
      });
      if (!worker) return notFoundResponse('Worker profile not found');

      const assignments = await prisma.workAssignment.findMany({
        where: {
          workerId: worker.id,
          ...(status ? { status: status as any } : {}),
        },
        include: {
          job: {
            select: { id: true, title: true, city: true, locality: true, wageType: true, wageAmount: true },
          },
          business: {
            select: { id: true, name: true, phone: true, city: true, address: true },
          },
          attendances: {
            orderBy: { date: 'desc' },
            take: 5,
          },
          wagePayments: {
            orderBy: { paidAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return successResponse({ assignments });
    } else if (authUser.role === 'BUSINESS_OWNER') {
      const business = await prisma.business.findFirst({
        where: { ownerId: authUser.id },
      });
      if (!business) return notFoundResponse('Business not found');

      const assignments = await prisma.workAssignment.findMany({
        where: {
          businessId: business.id,
          ...(status ? { status: status as any } : {}),
        },
        include: {
          job: {
            select: { id: true, title: true, city: true, locality: true, wageType: true, wageAmount: true },
          },
          worker: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
          attendances: {
            orderBy: { date: 'desc' },
            take: 5,
          },
          wagePayments: {
            orderBy: { paidAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return successResponse({ assignments });
    } else if (authUser.role === 'ADMIN') {
      const assignments = await prisma.workAssignment.findMany({
        include: {
          job: { select: { id: true, title: true } },
          business: { select: { id: true, name: true } },
          worker: { include: { user: { select: { name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return successResponse({ assignments });
    }

    return forbiddenResponse();
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/assignments - Create a work assignment (from application, direct hire, or other custom work)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') return forbiddenResponse();

    const body = await req.json();
    const parsed = createAssignmentSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    let targetApplicationId = parsed.data.applicationId;
    let targetJobId: string;
    let targetWorkerId: string;
    let workerUserId: string;
    let jobTitle: string;

    if (parsed.data.customWorkTitle) {
      // Flow C: Assign Custom / Other Work directly to worker
      const worker = await prisma.workerProfile.findUnique({
        where: { id: parsed.data.workerId! },
        include: { user: true },
      });
      if (!worker) return notFoundResponse('Worker not found');

      // Create a dedicated Job record for this custom assignment
      const customJob = await prisma.job.create({
        data: {
          businessId: business.id,
          title: parsed.data.customWorkTitle.trim(),
          description: parsed.data.description?.trim() || `Assigned task: ${parsed.data.customWorkTitle.trim()}`,
          wageAmount: parsed.data.agreedWage,
          wageType: parsed.data.wageType as any,
          city: business.city,
          locality: business.address || business.city,
          status: 'OPEN',
        },
      });

      // Create JobApplication
      const app = await prisma.jobApplication.create({
        data: {
          jobId: customJob.id,
          workerId: worker.id,
          status: 'ACCEPTED',
          message: 'Direct custom work assignment by business owner',
        },
      });

      targetApplicationId = app.id;
      targetJobId = customJob.id;
      targetWorkerId = worker.id;
      workerUserId = worker.userId;
      jobTitle = customJob.title;
    } else if (parsed.data.applicationId) {
      // Flow A: Assign from existing accepted application
      const application = await prisma.jobApplication.findUnique({
        where: { id: parsed.data.applicationId },
        include: {
          job: true,
          worker: { include: { user: true } },
        },
      });

      if (!application) return notFoundResponse('Job application not found');
      if (application.job.businessId !== business.id) return forbiddenResponse('Unauthorized for this job');
      if (application.status !== 'ACCEPTED') {
        return errorResponse('Only ACCEPTED job applications can be scheduled into work assignments', 400);
      }

      // Prevent duplicate assignments on this exact application
      const existing = await prisma.workAssignment.findUnique({
        where: { applicationId: application.id },
      });
      if (existing) return errorResponse('Work assignment already exists for this application', 409);

      targetJobId = application.jobId;
      targetWorkerId = application.workerId;
      workerUserId = application.worker.userId;
      jobTitle = application.job.title;
    } else {
      // Flow B: Direct Worker Assignment by business owner to an existing job
      const job = await prisma.job.findUnique({
        where: { id: parsed.data.jobId! },
      });
      if (!job) return notFoundResponse('Job not found');
      if (job.businessId !== business.id) return forbiddenResponse('Unauthorized for this job');

      const worker = await prisma.workerProfile.findUnique({
        where: { id: parsed.data.workerId! },
        include: { user: true },
      });
      if (!worker) return notFoundResponse('Worker not found');

      targetWorkerId = worker.id;
      workerUserId = worker.userId;

      // Find if an application already exists
      const existingApp = await prisma.jobApplication.findUnique({
        where: {
          jobId_workerId: {
            jobId: job.id,
            workerId: worker.id,
          },
        },
        include: {
          workAssignment: true,
        },
      });

      if (existingApp && existingApp.workAssignment) {
        // If worker already has an assignment for this job, create an additional assignment job
        // so the business owner can assign other/additional shifts/work to the worker
        const additionalJob = await prisma.job.create({
          data: {
            businessId: business.id,
            title: `${job.title} (Additional Work)`,
            description: parsed.data.description?.trim() || job.description,
            wageAmount: parsed.data.agreedWage,
            wageType: parsed.data.wageType as any,
            city: job.city,
            locality: job.locality,
            status: 'OPEN',
          },
        });

        const newApp = await prisma.jobApplication.create({
          data: {
            jobId: additionalJob.id,
            workerId: worker.id,
            status: 'ACCEPTED',
            message: 'Additional assignment by business owner',
          },
        });

        targetApplicationId = newApp.id;
        targetJobId = additionalJob.id;
        jobTitle = additionalJob.title;
      } else if (existingApp) {
        if (existingApp.status !== 'ACCEPTED') {
          await prisma.jobApplication.update({
            where: { id: existingApp.id },
            data: { status: 'ACCEPTED' },
          });
        }
        targetApplicationId = existingApp.id;
        targetJobId = job.id;
        jobTitle = job.title;
      } else {
        const newApp = await prisma.jobApplication.create({
          data: {
            jobId: job.id,
            workerId: worker.id,
            status: 'ACCEPTED',
            message: 'Direct assignment by business owner',
          },
        });
        targetApplicationId = newApp.id;
        targetJobId = job.id;
        jobTitle = job.title;
      }
    }

    // Create assignment and notify worker inside transaction
    const assignment = await prisma.$transaction(async (tx) => {
      const taskDescription = parsed.data.description?.trim() || null;

      const newAssignment = await tx.workAssignment.create({
        data: {
          applicationId: targetApplicationId!,
          jobId: targetJobId,
          businessId: business.id,
          workerId: targetWorkerId,
          startDate: new Date(parsed.data.startDate),
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          agreedWage: parsed.data.agreedWage,
          wageType: parsed.data.wageType as any,
          description: taskDescription,
          status: 'SCHEDULED',
          paymentStatus: 'PENDING',
        },
      });

      // Send in-app notification to worker
      const descSnippet = taskDescription ? ` Instructions: ${taskDescription}` : '';
      await tx.notification.create({
        data: {
          userId: workerUserId,
          title: 'Work Assignment Scheduled! 💼',
          message: `${business.name} assigned you work for "${jobTitle}". Agreed wage: ₹${parsed.data.agreedWage} (${parsed.data.wageType}).${descSnippet}`,
          type: 'ASSIGNMENT_CREATED',
          relatedEntityId: newAssignment.id,
        },
      });

      return newAssignment;
    });

    return successResponse({ assignment }, 201);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
