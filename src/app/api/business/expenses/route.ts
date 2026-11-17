import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { z } from 'zod';

const createExpenseSchema = z.object({
  category: z.enum(['RENT', 'ELECTRICITY', 'TRANSPORT', 'STAFF_WAGES', 'PURCHASES', 'MAINTENANCE', 'OTHER']),
  amount: z.number().positive('Expense amount must be positive'),
  description: z.string().optional(),
  expenseDate: z.string().optional(),
});

// GET /api/business/expenses - List expenses and financial P&L summary
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') return forbiddenResponse();

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    // 1. Fetch expenses
    const expenses = await prisma.businessExpense.findMany({
      where: {
        businessId: business.id,
        ...(category ? { category: category as any } : {}),
      },
      orderBy: { expenseDate: 'desc' },
      take: 100,
    });

    const totalOperatingExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    // Group expenses by category
    const categoryBreakdown: Record<string, number> = {};
    for (const exp of expenses) {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + Number(exp.amount);
    }

    // 2. Fetch sales revenue
    const sales = await prisma.sale.findMany({
      where: { businessId: business.id },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true, sellingPrice: true } },
          },
        },
      },
    });

    const totalSalesRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);

    // 3. Compute Cost of Goods Sold (COGS) based on verified product cost data
    let totalCogs = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        // Use verified unit costPrice; if not set, fallback to baseline 70% of sellingPrice
        const unitCost = item.product.costPrice ? Number(item.product.costPrice) : Number(item.unitPrice) * 0.7;
        totalCogs += unitCost * item.quantity;
      }
    }

    // 4. Financial results calculation
    const grossProfit = Math.max(0, totalSalesRevenue - totalCogs);
    const netOperatingResult = grossProfit - totalOperatingExpenses;

    return successResponse({
      expenses,
      categoryBreakdown,
      analytics: {
        totalSalesRevenue: Number(totalSalesRevenue.toFixed(2)),
        costOfGoodsSold: Number(totalCogs.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        totalOperatingExpenses: Number(totalOperatingExpenses.toFixed(2)),
        netOperatingResult: Number(netOperatingResult.toFixed(2)),
        accountingNote:
          'Gross Profit = Total Sales Revenue - Cost of Goods Sold (COGS). Net Operating Result = Gross Profit - Operating Expenses (Rent, Utilities, Wages, etc.). Sales revenue is never treated as net profit.',
      },
    });
  } catch (error: any) {
    console.error('Error fetching expenses & profit report:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/business/expenses - Record an expense
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'BUSINESS_OWNER') return forbiddenResponse();

    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error as any).issues?.[0]?.message || 'Validation failed', 400);

    const business = await prisma.business.findFirst({
      where: { ownerId: authUser.id },
    });
    if (!business) return notFoundResponse('Business not found');

    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.businessExpense.create({
        data: {
          businessId: business.id,
          category: parsed.data.category,
          amount: parsed.data.amount,
          description: parsed.data.description,
          expenseDate: parsed.data.expenseDate ? new Date(parsed.data.expenseDate) : new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'RECORD_EXPENSE',
          entityType: 'BusinessExpense',
          entityId: newExpense.id,
          details: JSON.stringify({ category: parsed.data.category, amount: parsed.data.amount }),
        },
      });

      return newExpense;
    });

    return successResponse({ expense }, 201);
  } catch (error: any) {
    console.error('Error recording expense:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
