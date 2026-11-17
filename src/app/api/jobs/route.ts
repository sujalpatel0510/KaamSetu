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
    const locality = searchParams.get('locality');
    const skill = searchParams.get('skill');
    const jobType = searchParams.get('jobType');
    const minWage = searchParams.get('minWage');
    const maxWage = searchParams.get('maxWage');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const statusParam = searchParams.get('status') || 'OPEN';

    // Bound the payload: hard cap of 100 jobs per request (ordered by recency)
    const takeLimit = Math.min(
      Math.max(parseInt(searchParams.get('take') || searchParams.get('limit') || '100', 10) || 100, 1),
      100
    );
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const skip = searchParams.has('skip')
      ? Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)
      : (page - 1) * takeLimit;

    // Validate enum-ish params: reject junk instead of throwing Prisma errors
    if (!['OPEN', 'FILLED', 'CLOSED'].includes(statusParam)) {
      return NextResponse.json({ error: 'Invalid job status filter' }, { status: 400 });
    }
    const status = statusParam as JobStatus;

    if (jobType && jobType !== 'All' && !['FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACT'].includes(jobType)) {
      return NextResponse.json({ error: 'Invalid job type filter' }, { status: 400 });
    }

    let parsedMinWage: Prisma.Decimal | undefined;
    let parsedMaxWage: Prisma.Decimal | undefined;
    try {
      if (minWage) parsedMinWage = new Prisma.Decimal(minWage);
      if (maxWage) parsedMaxWage = new Prisma.Decimal(maxWage);
    } catch {
      return NextResponse.json({ error: 'Invalid wage filter' }, { status: 400 });
    }

    const where: Prisma.JobWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (city && city !== 'All') {
      where.city = { contains: city.slice(0, 60), mode: 'insensitive' };
    }

    if (locality && locality !== 'All') {
      where.locality = { contains: locality.slice(0, 60), mode: 'insensitive' };
    }

    if (skill && skill !== 'All') {
      where.requiredSkills = { has: skill.slice(0, 40) };
    }

    if (jobType && jobType !== 'All') {
      where.jobType = jobType as JobType;
    }

    if (parsedMinWage || parsedMaxWage) {
      where.wageAmount = {};
      if (parsedMinWage) where.wageAmount.gte = parsedMinWage;
      if (parsedMaxWage) where.wageAmount.lte = parsedMaxWage;
    }

    if (search) {
      const term = search.slice(0, 60);
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { locality: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { business: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'wage_desc') orderBy = { wageAmount: 'desc' };
    else if (sortBy === 'wage_asc') orderBy = { wageAmount: 'asc' };
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

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
      orderBy,
      take: takeLimit,
      skip,
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
