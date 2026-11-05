import type { UnreadableReason } from './cart-payload';

/** Why a cart line isn't part of any check. */
export type SkipReason =
  | UnreadableReason
  | 'not-powered'
  | 'recorder'
  | 'no-matching-supply'
  | 'no-matching-camera'
  | 'no-poe-camera'
  | 'supply-over-limit'
  | 'injectors-over-limit'
  | 'too-many-devices'
  | 'too-many-groups';

export interface SkippedLine {
  sku: string;
  name?: string;
  qty?: number;
  reason: SkipReason;
}

/** A cart line (or merged model) that isn't checked, keeping what identifies it. */
export function skippedLine(
  line: { sku: string; name?: string; qty?: number },
  reason: SkipReason
): SkippedLine {
  return {
    sku: line.sku,
    ...(line.name ? { name: line.name } : {}),
    ...(line.qty !== undefined ? { qty: line.qty } : {}),
    reason,
  };
}

/** What the Check my system page says about a skipped line. */
export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  'no-power-data': 'No power data for this product.',
  'invalid-data': 'Its product data is incomplete or outside what the calculators accept.',
  'unknown-kind': 'Not a product type these checks know about.',
  'not-powered': 'Not a powered device.',
  recorder: 'Recorders aren’t part of these checks yet.',
  'no-matching-supply': 'No power supply in your cart matches its input voltage.',
  'no-matching-camera': 'No camera in your cart runs from this supply.',
  'no-poe-camera': 'No camera in your cart is powered by PoE.',
  'supply-over-limit': 'The combined supplies are over the calculator’s 200 A limit.',
  'injectors-over-limit':
    'The combined PoE injectors are over the calculator’s limits (2,000 W, 96 ports).',
  'too-many-devices': 'More than 1,000 of one model, the calculator’s limit for a group.',
  'too-many-groups': 'More than 20 camera models on one power source, the calculator’s limit.',
};
