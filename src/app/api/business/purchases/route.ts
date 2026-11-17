import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { calculateSubtotal } from '@/lib/financial';
import { z } from 'zod';

const createPurchaseSchema = z.object({
  supplierId: z.string().uuid().optional().nullable(),
  paymentStatus: z.enum(['PAID', 'PARTIALLY_PAID', 'UNPAID']).default('PAID'),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive('Quantity must be greater than 0'),
      unitCost: z.number().positive('Unit cost must be greater than 0'),
    })
  ).min(1, 'At least one item required'),
});

// GET /api/business/purchases - List purchase invoices
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') return forbiddenResponse();

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    const purchases = await prisma.purchase.findMany({
      where: { businessId: business.id },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
      take: 50,
    });

    return successResponse({ purchases });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/business/purchases - Create purchase and atomically increment inventory stock
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') return forbiddenResponse();

    const body = await req.json();
    const parsed = createPurchaseSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    // 1. Calculate total purchase amount with Decimal arithmetic
    let totalAmount = 0;
    for (const item of parsed.data.items) {
      const itemSubtotal = calculateSubtotal(item.unitCost, item.quantity);
      totalAmount += Number(itemSubtotal);
    }

    // 2. Execute atomic database transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create Purchase record
      const newPurchase = await tx.purchase.create({
        data: {
          businessId: business.id,
          supplierId: parsed.data.supplierId || null,
          totalAmount: Number(totalAmount.toFixed(2)),
          paymentStatus: parsed.data.paymentStatus as any,
          notes: parsed.data.notes,
          purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : new Date(),
        },
      });

      // Process items and atomically increment stock for each product
      for (const item of parsed.data.items) {
        const itemSubtotal = calculateSubtotal(item.unitCost, item.quantity);

        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: itemSubtotal,
          },
        });

        // Increment stock and update costPrice
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            costPrice: item.unitCost,
          },
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'RECORD_PURCHASE',
          entityType: 'Purchase',
          entityId: newPurchase.id,
          details: JSON.stringify({
            totalAmount: Number(totalAmount.toFixed(2)),
            itemCount: parsed.data.items.length,
          }),
        },
      });

      return newPurchase;
    });

    return successResponse({ purchase, message: 'Stock received and inventory updated atomically' }, 201);
  } catch (error: any) {
    console.error('Error creating purchase:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
