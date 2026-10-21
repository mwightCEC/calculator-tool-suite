import { isPointRange, type ValueRange } from '@cctv/calc-core';

/** Fewer decimals for larger numbers: 0.43, 6.2, 38.4, 583. */
function significantDigits(value: number): number {
  const magnitude = Math.abs(value);
  if (magnitude >= 100) {
    return 0;
  }
  return magnitude >= 1 ? 1 : 2;
}

export function formatNumber(value: number, fractionDigits = significantDigits(value)): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

/** Like formatNumber, but always shows exactly `fractionDigits` decimals (for ranges). */
export function formatFixed(value: number, fractionDigits: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export const formatMbps = (mbps: number) => `${formatNumber(mbps)} Mbps`;
export const formatGb = (gb: number) => `${formatNumber(gb)} GB`;
export const formatTb = (tb: number) => `${formatNumber(tb)} TB`;
export const formatTbPerDay = (tb: number) => `${formatNumber(tb, 2)} TB/day`;
export const formatDays = (days: number) =>
  `${formatNumber(days, 0)} ${days === 1 ? 'day' : 'days'}`;

/** Decimal places used for every value in a range, based on its largest bound. */
export function rangeDigits(range: ValueRange): number {
  return significantDigits(range.high);
}

/** "4.3–8.1" using the same precision for both ends. */
export function formatRangeBounds(range: ValueRange, digits?: number): string {
  const fractionDigits = digits ?? rangeDigits(range);
  return `${formatFixed(range.low, fractionDigits)}–${formatFixed(range.high, fractionDigits)}`;
}

/** "likely 30–48 TB", or null when the range has collapsed to one value. */
export function formatLikelyRange(range: ValueRange, unit: string, digits?: number): string | null {
  return isPointRange(range) ? null : `likely ${formatRangeBounds(range, digits)} ${unit}`;
}
