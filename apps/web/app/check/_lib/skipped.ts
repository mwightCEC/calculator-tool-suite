import type { UnreadableReason } from './cart-payload';

/** Why a cart line isn't part of any check. */
export type SkipReason =
  | UnreadableReason
  | 'not-powered'
  | 'recorder'
  | 'no-matching-supply'
  | 'no-matching-camera'
  | 'poe-not-yet'
  | 'supply-over-limit'
  | 'too-many-devices'
  | 'too-many-groups';

export interface SkippedLine {
  sku: string;
  name?: string;
  qty?: number;
  reason: SkipReason;
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
  'poe-not-yet': 'PoE checks from a cart are coming soon. Use the PoE budget calculator for now.',
  'supply-over-limit': 'The combined supplies are over the calculator’s 200 A limit.',
  'too-many-devices': 'More than 1,000 of one model, the calculator’s limit for a group.',
  'too-many-groups': 'More than 20 camera models on one supply, the calculator’s limit.',
};
