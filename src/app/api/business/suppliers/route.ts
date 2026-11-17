import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const createSupplierSchema = z.object({
  name: z.string().min(2, 'Supplier name required'),
  phone: z.string().min(10, 'Valid 10-digit phone required'),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/business/suppliers - List suppliers for business
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') return forbiddenResponse();

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    const suppliers = await prisma.supplier.findMany({
      where: { businessId: business.id },
      include: {
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ suppliers });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/business/suppliers - Add supplier
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') return forbiddenResponse();

    const body = await req.json();
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    const supplier = await prisma.supplier.create({
      data: {
        businessId: business.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        contactPerson: parsed.data.contactPerson,
        address: parsed.data.address,
        notes: parsed.data.notes,
      },
    });

    return successResponse({ supplier }, 201);
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
