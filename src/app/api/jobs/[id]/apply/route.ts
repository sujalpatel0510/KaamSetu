import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, JobStatus, ApplicationStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: jobId } = await params;

    if (user.role !== Role.WORKER) {
      return NextResponse.json(
        { error: 'Only registered workers can apply for jobs' },
        { status: 403 }
      );
    }

    const workerProfile = user.workerProfile;
    if (!workerProfile) {
      return NextResponse.json(
        { error: 'Please complete your worker profile before applying' },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { business: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== JobStatus.OPEN) {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Check duplicate application
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: workerProfile.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 400 }
      );
    }

    let message = '';
    try {
      const body = await req.json();
      message = body.message || '';
    } catch {
      // Empty body is acceptable
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.jobApplication.create({
        data: {
          jobId,
          workerId: workerProfile.id,
          message,
          status: ApplicationStatus.PENDING,
        },
      });

      // Send in-app notification to the business owner
      await tx.notification.create({
        data: {
          userId: job.business.ownerId,
          title: 'New Job Application 📋',
          message: `${user.name} applied for "${job.title}".`,
          type: 'JOB_APPLICATION',
          relatedEntityId: app.id,
        },
      });

      return app;
    });

    return NextResponse.json(
      { message: 'Application submitted successfully', application },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Job application error:', err);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
