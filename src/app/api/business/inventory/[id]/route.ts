import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, Prisma } from '@prisma/client';

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
    const { name, category, sku, sellingPrice, costPrice, stockQuantity, lowStockThreshold } = body;

    if (stockQuantity !== undefined && stockQuantity < 0) {
      return NextResponse.json({ error: 'Stock quantity cannot be negative' }, { status: 400 });
    }

    if (sellingPrice !== undefined && sellingPrice <= 0) {
      return NextResponse.json({ error: 'Selling price must be greater than 0' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        sku: sku !== undefined ? sku : product.sku,
        ...(sellingPrice !== undefined && { sellingPrice: new Prisma.Decimal(sellingPrice) }),
        ...(costPrice !== undefined && { costPrice: costPrice ? new Prisma.Decimal(costPrice) : null }),
        ...(stockQuantity !== undefined && { stockQuantity: Number(stockQuantity) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Number(lowStockThreshold) }),
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
