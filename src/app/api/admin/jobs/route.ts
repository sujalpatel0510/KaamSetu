import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, JobStatus } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const moderateJobSchema = z.object({
  jobId: z.string().uuid('Valid jobId required'),
  status: z.enum(['OPEN', 'FILLED', 'CLOSED']),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAuth();
    if (admin.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = moderateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid moderation request' },
        { status: 400 }
      );
    }

    const { jobId, status } = parsed.data;

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status: status as JobStatus },
      include: {
        business: {
          select: { name: true, ownerId: true },
        },
      },
    });

    // Notify the business owner of the moderation action
    await prisma.notification.create({
      data: {
        userId: updatedJob.business.ownerId,
        title: 'Job Listing Moderation Notice',
        message: `Your job listing "${updatedJob.title}" status was changed to ${status} by system administration.`,
        type: 'SYSTEM',
        relatedEntityId: jobId,
      },
    }).catch(() => {});

    return NextResponse.json({
      message: 'Job status updated successfully',
      job: updatedJob,
    });
  } catch (err: unknown) {
    console.error('Error moderating job:', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAuth();
    if (admin.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('id');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    await prisma.jobApplication.deleteMany({ where: { jobId } });
    await prisma.job.delete({ where: { id: jobId } });

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (err: unknown) {
    console.error('Error deleting job:', err);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
