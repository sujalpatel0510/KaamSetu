import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role, PaymentMethod, PaymentStatus, TransactionType, Prisma } from '@prisma/client';
import { z } from 'zod';
import { roundToPaisa } from '@/lib/financial';

export const dynamic = 'force-dynamic';

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

const createSaleSchema = z.object({
  customerId: z.string().uuid().optional().or(z.literal('')),
  paymentMethod: z.enum(['CASH', 'UPI', 'CREDIT']),
  items: z.array(saleItemSchema).min(1, 'Sale must include at least one item'),
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

    // Bound the payload: default 200 latest sales, hard cap 1000, optional page
    const { searchParams } = new URL(req.url);
    const take = Math.min(
      Math.max(parseInt(searchParams.get('take') || searchParams.get('limit') || '200', 10) || 200, 1),
      1000
    );
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const skip = searchParams.has('skip')
      ? Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)
      : (page - 1) * take;

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where: { businessId: business.id },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, category: true, sku: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.sale.count({ where: { businessId: business.id } }),
    ]);

    return NextResponse.json({ sales, total: totalCount, page, take });
  } catch (err: unknown) {
    console.error('Error fetching sales:', err);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
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
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createSaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid sale details' },
        { status: 400 }
      );
    }

    const { customerId, paymentMethod, items } = parsed.data;

    // Rule: Credit sales MUST be associated with an existing customer
    if (paymentMethod === 'CREDIT' && !customerId) {
      return NextResponse.json(
        { error: 'Credit (Udhaar) sales must be linked to a customer.' },
        { status: 400 }
      );
    }

    // Verify customer if specified
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer || customer.businessId !== business.id) {
        return NextResponse.json(
          { error: 'Specified customer not found in your business' },
          { status: 404 }
        );
      }
    }

    // Atomic execution with Prisma transaction
    const saleResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch current product data from DB to verify prices and stock
      const productIds = items.map((i) => i.productId);
      const dbProducts = await tx.product.findMany({
        where: {
          id: { in: productIds },
          businessId: business.id,
        },
      });

      if (dbProducts.length !== items.length) {
        throw new Error('One or more selected products were not found in your inventory.');
      }

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // 2. Validate stock availability and calculate total server-side
      let calculatedTotal = 0;
      const verifiedItems: {
        productId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        subtotal: Prisma.Decimal;
      }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found.`);

        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`
          );
        }

        const subtotalNum = roundToPaisa(Number(product.sellingPrice) * item.quantity);
        calculatedTotal += subtotalNum;

        verifiedItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          subtotal: new Prisma.Decimal(subtotalNum),
        });
      }

      const paymentStatus =
        paymentMethod === 'CREDIT' ? PaymentStatus.UNPAID : PaymentStatus.PAID;

      // 3. Create the Sale record
      const createdSale = await tx.sale.create({
        data: {
          businessId: business.id,
          customerId: customerId || null,
          totalAmount: new Prisma.Decimal(roundToPaisa(calculatedTotal)),
          paymentMethod: paymentMethod as PaymentMethod,
          paymentStatus,
        },
      });

      // 4. Batch create SaleItems and atomically decrement inventory stock
      await tx.saleItem.createMany({
        data: verifiedItems.map((vItem) => ({
          saleId: createdSale.id,
          productId: vItem.productId,
          quantity: vItem.quantity,
          unitPrice: vItem.unitPrice,
          subtotal: vItem.subtotal,
        })),
      });

      for (const vItem of verifiedItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: vItem.productId,
            // Atomic guard: the decrement only applies if the stock is still
            // sufficient, preventing concurrent sales from overselling.
            stockQuantity: { gte: vItem.quantity },
          },
          data: {
            stockQuantity: { decrement: vItem.quantity },
          },
        });

        if (updated.count === 0) {
          throw new Error(
            `Stock for one of the selected items changed while recording the sale. Please retry with updated quantities.`
          );
        }

        const updatedProduct = await tx.product.findUniqueOrThrow({
          where: { id: vItem.productId },
        });

        // Trigger low-stock notification if reached threshold
        if (updatedProduct.stockQuantity <= updatedProduct.lowStockThreshold) {
          await tx.notification.create({
            data: {
              userId: user.id,
              title: 'Low Stock Alert ⚠️',
              message: `"${updatedProduct.name}" is low on stock (${updatedProduct.stockQuantity} left).`,
              type: 'INVENTORY_LOW',
              relatedEntityId: updatedProduct.id,
            },
          });
        }
      }

      // 5. If sale is on CREDIT, automatically create a CreditTransaction record
      if (paymentMethod === 'CREDIT' && customerId) {
        await tx.creditTransaction.create({
          data: {
            customerId,
            amount: new Prisma.Decimal(calculatedTotal),
            type: TransactionType.CREDIT,
            description: `Credit sale #${createdSale.id.slice(0, 8)}`,
            saleId: createdSale.id,
          },
        });
      }

      return createdSale;
    });

    return NextResponse.json(
      { message: 'Sale recorded successfully', sale: saleResult },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record sale';
    console.error('Error recording sale:', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
