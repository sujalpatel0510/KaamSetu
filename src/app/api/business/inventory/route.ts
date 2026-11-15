import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const productSchema = z.object({
  name: z.string().min(2, 'Product name required'),
  category: z.string().min(2, 'Category required'),
  sku: z.string().optional(),
  sellingPrice: z.number().positive('Selling price must be greater than 0'),
  costPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(5),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const where: Prisma.ProductWhereInput = {
      businessId: business.id,
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const filtered = lowStockOnly
      ? products.filter((p) => p.stockQuantity <= p.lowStockThreshold)
      : products;

    return NextResponse.json({ products: filtered });
  } catch (err: unknown) {
    console.error('Error fetching inventory:', err);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== Role.BUSINESS_OWNER && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Business access required' }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: 'No business registered' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid product details' },
        { status: 400 }
      );
    }

    const { name, category, sku, sellingPrice, costPrice, stockQuantity, lowStockThreshold } =
      parsed.data;

    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name,
        category,
        sku: sku || null,
        sellingPrice: new Prisma.Decimal(sellingPrice),
        costPrice: costPrice ? new Prisma.Decimal(costPrice) : null,
        stockQuantity,
        lowStockThreshold,
      },
    });

    return NextResponse.json({ message: 'Product added successfully', product }, { status: 201 });
  } catch (err: unknown) {
    console.error('Error adding product:', err);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}
