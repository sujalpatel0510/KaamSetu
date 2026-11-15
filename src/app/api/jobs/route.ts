import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { JobStatus, JobType, WageType, Role, Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const skill = searchParams.get('skill');
    const jobType = searchParams.get('jobType');
    const minWage = searchParams.get('minWage');
    const maxWage = searchParams.get('maxWage');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'OPEN';

    const where: Prisma.JobWhereInput = {};

    if (status) {
      where.status = status as JobStatus;
    }

    if (city && city !== 'All') {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (skill && skill !== 'All') {
      where.requiredSkills = { has: skill };
    }

    if (jobType && jobType !== 'All') {
      where.jobType = jobType as JobType;
    }

    if (minWage || maxWage) {
      where.wageAmount = {};
      if (minWage) where.wageAmount.gte = new Prisma.Decimal(minWage);
      if (maxWage) where.wageAmount.lte = new Prisma.Decimal(maxWage);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { locality: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            city: true,
            locality: true,
            phone: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ jobs });
  } catch (err: unknown) {
    console.error('Error fetching jobs:', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requiredSkills: z.array(z.string()).min(1, 'At least one skill required'),
  city: z.string().min(2, 'City is required'),
  locality: z.string().min(2, 'Locality is required'),
  wageAmount: z.number().positive('Wage amount must be greater than 0'),
  wageType: z.enum(['DAILY', 'FIXED']).default('DAILY'),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACT']).default('FULL_TIME'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Only business owners can create job postings' },
        { status: 403 }
      );
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json(
        { error: 'No business found for this account. Please register a business first.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid job data' },
        { status: 400 }
      );
    }

    const { title, description, requiredSkills, city, locality, wageAmount, wageType, jobType } =
      parsed.data;

    const job = await prisma.job.create({
      data: {
        businessId: business.id,
        title,
        description,
        requiredSkills,
        city,
        locality,
        wageAmount: new Prisma.Decimal(wageAmount),
        wageType: wageType as WageType,
        jobType: jobType as JobType,
        status: JobStatus.OPEN,
      },
    });

    return NextResponse.json({ message: 'Job created successfully', job }, { status: 201 });
  } catch (err: unknown) {
    console.error('Error creating job:', err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
