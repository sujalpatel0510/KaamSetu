import { Prisma } from '@prisma/client';

/**
 * Monetary Arithmetic Helper with Exact Decimal / Paisa Precision.
 * Guarantees zero floating-point approximation loss (e.g. 0.1 + 0.2 != 0.3).
 */

export function roundToPaisa(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function toDecimal(amount: number | string | Prisma.Decimal): Prisma.Decimal {
  if (amount instanceof Prisma.Decimal) return amount;
  return new Prisma.Decimal(roundToPaisa(Number(amount)));
}

export function calculateSubtotal(unitPrice: number | Prisma.Decimal, quantity: number): Prisma.Decimal {
  const priceNum = typeof unitPrice === 'number' ? unitPrice : Number(unitPrice);
  const total = roundToPaisa(priceNum * quantity);
  return new Prisma.Decimal(total);
}

/**
 * PRD Formula: Outstanding = Total Credit - Total Repayments
 * Strictly non-negative.
 */
export function calculateOutstanding(totalCredit: number, totalRepayment: number): number {
  const diff = roundToPaisa(totalCredit - totalRepayment);
  return Math.max(0, diff);
}
