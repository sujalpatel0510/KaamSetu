import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, Prisma } from '@prisma/client';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(80).optional(),
  category: z.string().max(40).optional(),
  sku: z.string().max(40).nullable().optional(),
  sellingPrice: z.number().positive('Selling price must be greater than 0').max(99_999_999).optional(),
  costPrice: z.number().min(0).max(99_999_999).nullable().optional(),
  stockQuantity: z.number().int('Stock must be a whole number').min(0, 'Stock quantity cannot be negative').optional(),
  lowStockThreshold: z.number().int().min(0).max(9999).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.business.ownerId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: You do not own this inventory item' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid product data' },
        { status: 400 }
      );
    }

    const { name, category, sku, sellingPrice, costPrice, stockQuantity, lowStockThreshold } = parsed.data;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        sku: sku !== undefined ? sku : product.sku,
        ...(sellingPrice !== undefined && { sellingPrice: new Prisma.Decimal(sellingPrice) }),
        ...(costPrice !== undefined && { costPrice: costPrice ? new Prisma.Decimal(costPrice) : null }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
      },
    });

    return NextResponse.json({ message: 'Product updated successfully', product: updated });
  } catch (err: unknown) {
    console.error('Error updating product:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.business.ownerId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the product is linked to sales
    const salesCount = await prisma.saleItem.count({ where: { productId: id } });
    if (salesCount > 0) {
      // Archive instead of delete to preserve historical integrity
      await prisma.product.update({
        where: { id },
        data: { stockQuantity: 0 },
      });
      return NextResponse.json({ message: 'Product has historical sales. Stock set to 0.' });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (err: unknown) {
    console.error('Error deleting product:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
