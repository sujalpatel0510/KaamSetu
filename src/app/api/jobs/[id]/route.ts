import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { JobStatus, Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            phone: true,
            city: true,
            locality: true,
            address: true,
            description: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (err: unknown) {
    console.error('Error fetching job details:', err);
    return NextResponse.json({ error: 'Failed to fetch job details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Authorization check: Must be owner or admin
    if (job.business.ownerId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this job posting' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, title, description, wageAmount, requiredSkills } = body;

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...(status && { status: status as JobStatus }),
        ...(title && { title }),
        ...(description && { description }),
        ...(wageAmount && { wageAmount }),
        ...(requiredSkills && { requiredSkills }),
      },
    });

    return NextResponse.json({ message: 'Job updated successfully', job: updatedJob });
  } catch (err: unknown) {
    console.error('Error updating job:', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.business.ownerId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this job posting' },
        { status: 403 }
      );
    }

    await prisma.job.delete({ where: { id } });

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (err: unknown) {
    console.error('Error deleting job:', err);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
