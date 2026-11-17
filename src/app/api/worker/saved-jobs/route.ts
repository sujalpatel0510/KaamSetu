import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const savedJobSchema = z.object({
  jobId: z.string().uuid(),
});

// GET /api/worker/saved-jobs - List saved jobs for worker
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'WORKER') return forbiddenResponse();

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: authUser.id },
    });
    if (!worker) return notFoundResponse('Worker profile not found');

    const savedJobs = await prisma.savedJob.findMany({
      where: { workerId: worker.id },
      include: {
        job: {
          include: {
            business: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ savedJobs });
  } catch (error: any) {
    console.error('Error fetching saved jobs:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/worker/saved-jobs - Bookmark a job
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'WORKER') return forbiddenResponse();

    const body = await req.json();
    const parsed = savedJobSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: authUser.id },
    });
    if (!worker) return notFoundResponse('Worker profile not found');

    const job = await prisma.job.findUnique({
      where: { id: parsed.data.jobId },
    });
    if (!job) return notFoundResponse('Job not found');

    const saved = await prisma.savedJob.upsert({
      where: {
        workerId_jobId: {
          workerId: worker.id,
          jobId: job.id,
        },
      },
      create: {
        workerId: worker.id,
        jobId: job.id,
      },
      update: {},
    });

    return successResponse({ savedJob: saved, message: 'Job saved to your bookmarks' }, 201);
  } catch (error: any) {
    console.error('Error bookmarking job:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// DELETE /api/worker/saved-jobs - Remove job bookmark
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'WORKER') return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return errorResponse('jobId parameter is required', 400);

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: authUser.id },
    });
    if (!worker) return notFoundResponse('Worker profile not found');

    await prisma.savedJob.deleteMany({
      where: {
        workerId: worker.id,
        jobId,
      },
    });

    return successResponse({ message: 'Job removed from bookmarks' });
  } catch (error: any) {
    console.error('Error removing saved job:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
