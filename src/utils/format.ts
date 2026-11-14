/**
 * Safe currency formatting utility for Kenyan Shilling (KES) values.
 * Prevents runtime errors like "Cannot read properties of undefined (reading 'toLocaleString')"
 */

export function formatCurrency(amount: number | string | null | undefined, fallback: number = 0): string {
  if (amount === undefined || amount === null || amount === '') {
    return Number(fallback).toLocaleString();
  }
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(parsed)) {
    return Number(fallback).toLocaleString();
  }
  return parsed.toLocaleString();
}

export function formatKes(amount: number | string | null | undefined, fallback: number = 0): string {
  return `KES ${formatCurrency(amount, fallback)}`;
}
