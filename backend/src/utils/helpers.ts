import { Category } from '@prisma/client';

export type StockStatus = 'STOCKED' | 'RUNNING_LOW' | 'GONE';

export function getStockStatus(quantity: number, lowStockThreshold: number): StockStatus {
  if (quantity === 0) return 'GONE';
  if (quantity <= lowStockThreshold) return 'RUNNING_LOW';
  return 'STOCKED';
}

export function parsePaginationParams(
  page: unknown,
  limit: unknown
): { page: number; limit: number; skip: number } {
  const parsedPage = Math.max(1, parseInt(String(page || '1'), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || '12'), 10) || 12));
  const skip = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, skip };
}

export function isValidCategory(value: string): value is Category {
  return ['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH'].includes(value);
}

export function isValidStockStatus(value: string): value is StockStatus {
  return ['STOCKED', 'RUNNING_LOW', 'GONE'].includes(value);
}
