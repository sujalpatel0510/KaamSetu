import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, ApplicationStatus } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '@/lib/api-response';

const updateApplicantStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'REJECTED', 'PENDING']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const { id: jobId } = await params;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { business: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.business.ownerId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        worker: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                preferredLanguage: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json({ job, applications });
  } catch (err: unknown) {
    console.error('Error fetching applicants:', err);
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const { id: jobId } = await params;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { business: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.business.ownerId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateApplicantStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid status data' },
        { status: 400 }
      );
    }

    const { applicationId, status } = parsed.data;

    const updatedApp = await prisma.$transaction(async (tx) => {
      // Security: the application MUST belong to the job in the URL path,
      // otherwise a business owner could modify other businesses' applications.
      const app = await tx.jobApplication.findFirst({
        where: { id: applicationId, jobId },
        include: {
          worker: {
            include: { user: true },
          },
        },
      });

      if (!app) {
        throw new ApiError('Application not found for this job', 404);
      }

      const updated = await tx.jobApplication.update({
        where: { id: app.id },
        data: { status: status as ApplicationStatus },
        include: {
          worker: {
            include: { user: true },
          },
        },
      });

      // Send notification to worker
      const notificationTitle =
        status === 'ACCEPTED'
          ? 'Application Accepted! 🎉'
          : status === 'REJECTED'
          ? 'Application Update'
          : 'Application Under Review';

      const notificationMessage =
        status === 'ACCEPTED'
          ? `${job.business.name} accepted your application for "${job.title}". You can contact them at ${job.business.phone}.`
          : `${job.business.name} updated your application status for "${job.title}" to ${status}.`;

      await tx.notification.create({
        data: {
          userId: app.worker.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: status === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_STATUS_UPDATE',
          relatedEntityId: job.id,
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: `Application marked as ${status}`,
      application: updatedApp,
    });
  } catch (err: unknown) {
    console.error('Error updating application status:', err);
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
