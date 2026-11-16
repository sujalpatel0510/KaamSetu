import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const businessSettingsSchema = z.object({
  name: z.string().min(2, 'Business / Shop name is required'),
  category: z.string().min(2, 'Category is required'),
  phone: z.string().min(10, 'Valid 10-digit mobile/contact number is required'),
  city: z.string().min(2, 'City is required'),
  locality: z.string().min(2, 'Locality is required'),
  address: z.string().min(3, 'Complete address is required'),
  upiId: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  ownerName: z.string().min(2).optional(),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'hi']).optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business settings only accessible to business owners' }, { status: 403 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      include: {
        _count: {
          select: {
            products: true,
            sales: true,
            customers: true,
            jobs: true,
          },
        },
      },
    });

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        preferredLanguage: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      business,
      user: userProfile,
    });
  } catch (err: unknown) {
    console.error('Error fetching business settings:', err);
    return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = businessSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid data submitted' },
        { status: 400 }
      );
    }

    const {
      name,
      category,
      phone,
      city,
      locality,
      address,
      upiId,
      description,
      ownerName,
      ownerEmail,
      preferredLanguage,
    } = parsed.data;

    // Run in transaction to update both Business and User records
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User Owner Details
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          name: ownerName || user.name,
          email: ownerEmail || null,
          preferredLanguage: preferredLanguage || 'en',
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          preferredLanguage: true,
          role: true,
        },
      });

      // 2. Upsert Business Record
      const existingBusiness = await tx.business.findFirst({
        where: { ownerId: user.id },
      });

      let updatedBusiness;
      if (existingBusiness) {
        updatedBusiness = await tx.business.update({
          where: { id: existingBusiness.id },
          data: {
            name,
            category,
            phone,
            city,
            locality,
            address,
            upiId: upiId || null,
            description: description || null,
          },
        });
      } else {
        updatedBusiness = await tx.business.create({
          data: {
            ownerId: user.id,
            name,
            category,
            phone,
            city,
            locality,
            address,
            upiId: upiId || null,
            description: description || null,
          },
        });
      }

      return { user: updatedUser, business: updatedBusiness };
    });

    return NextResponse.json({
      message: 'Business profile and settings updated successfully',
      business: result.business,
      user: result.user,
    });
  } catch (err: unknown) {
    console.error('Error updating business settings:', err);
    return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 });
  }
}
