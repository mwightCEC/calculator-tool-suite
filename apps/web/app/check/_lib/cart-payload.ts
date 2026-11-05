import {
  MAX_DEVICE_WATTS,
  MAX_LOAD_AMPS,
  MAX_LOAD_WATTS,
  MAX_SUPPLY_VOLTS,
  MIN_DEVICE_WATTS,
  MIN_LOAD_AMPS,
  MIN_LOAD_WATTS,
  MIN_SUPPLY_VOLTS,
  PORT_STANDARDS,
} from '@cctv/calc-core';
import { z } from 'zod';
import { fromBase64Url } from '../../../lib/share/share-codec';

/*
 * Cart links from the company website: <tools>/check#cart=<base64url JSON>.
 * The format is described in the "Cart link spec: Check my system" document
 * shared with the website team. Once the website ships links, v1 is frozen:
 * add optional fields or new kinds freely, but any change to an existing
 * field's meaning or units needs v2 (and v1 must keep reading).
 *
 * The cart is read item by item: one bad line is reported and skipped, and
 * the rest of the cart is still checked.
 */

export const CART_HASH_PARAM = 'cart';
export const CART_FORMAT_VERSION = 1;
export const MAX_CART_LINES = 50;
export const MAX_LINE_QUANTITY = 999;

const sku = z.string().trim().min(1);
const quantity = z.int().min(1).max(MAX_LINE_QUANTITY);

/** DC or AC input with its worst-case current or power (at least one). */
const lowVoltageInputSchema = z
  .object({
    type: z.enum(['dc', 'ac']),
    volts: z.number().min(MIN_SUPPLY_VOLTS).max(MAX_SUPPLY_VOLTS),
    amps: z.number().min(MIN_LOAD_AMPS).max(MAX_LOAD_AMPS).optional(),
    watts: z.number().min(MIN_LOAD_WATTS).max(MAX_LOAD_WATTS).optional(),
  })
  .refine((input) => input.amps !== undefined || input.watts !== undefined);

const poeInputSchema = z.object({
  type: z.literal('poe'),
  watts: z.number().min(MIN_DEVICE_WATTS).max(MAX_DEVICE_WATTS),
});

const powerInputSchema = z.union([lowVoltageInputSchema, poeInputSchema]);

const cameraSchema = z.object({
  kind: z.literal('camera'),
  sku,
  name: z.string().optional(),
  qty: quantity,
  power: z.array(powerInputSchema).min(1),
});

const powerSupplySchema = z.object({
  kind: z.literal('power-supply'),
  sku,
  name: z.string().optional(),
  qty: quantity,
  output: z
    .object({
      type: z.enum(['dc', 'ac']),
      volts: z.number().min(MIN_SUPPLY_VOLTS).max(MAX_SUPPLY_VOLTS),
      amps: z.number().positive().optional(),
      watts: z.number().positive().optional(),
      outputs: z.int().positive().optional(),
    })
    .refine((output) => output.amps !== undefined || output.watts !== undefined),
});

const poeInjectorSchema = z.object({
  kind: z.literal('poe-injector'),
  sku,
  name: z.string().optional(),
  qty: quantity,
  poe: z.object({
    ports: z.int().positive(),
    standard: z.enum(PORT_STANDARDS),
    watts: z.number().positive(),
  }),
});

const unpoweredSchema = z.object({
  kind: z.enum(['recorder', 'cable', 'accessory']),
  sku,
  name: z.string().optional(),
  qty: quantity,
});

export type LowVoltageInput = z.infer<typeof lowVoltageInputSchema>;
export type PowerInput = z.infer<typeof powerInputSchema>;
export type CameraItem = z.infer<typeof cameraSchema>;
export type PowerSupplyItem = z.infer<typeof powerSupplySchema>;
export type PoeInjectorItem = z.infer<typeof poeInjectorSchema>;
export type UnpoweredItem = z.infer<typeof unpoweredSchema>;
export type CartItem = CameraItem | PowerSupplyItem | PoeInjectorItem | UnpoweredItem;

/** Why a cart line couldn't be read. */
export type UnreadableReason = 'no-power-data' | 'invalid-data' | 'unknown-kind';

/** A line that couldn't be read, with whatever identifies it to the visitor. */
export interface UnreadableLine {
  sku: string;
  name?: string;
  qty?: number;
  reason: UnreadableReason;
}

export interface Cart {
  items: CartItem[];
  unreadable: UnreadableLine[];
  returnUrl?: string;
}

export type CartLinkResult =
  | { status: 'none' }
  | { status: 'invalid' }
  | { status: 'loaded'; cart: Cart };

const ITEM_SCHEMAS: Record<string, z.ZodType<CartItem>> = {
  camera: cameraSchema,
  'power-supply': powerSupplySchema,
  'poe-injector': poeInjectorSchema,
  recorder: unpoweredSchema,
  cable: unpoweredSchema,
  accessory: unpoweredSchema,
};

const lineIdentitySchema = z.object({
  kind: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  qty: z.number().optional(),
  power: z.unknown().optional(),
});

/** The parts of a bad line worth showing, so the visitor can tell which product it was. */
function unreadableLine(raw: unknown, reason: UnreadableReason): UnreadableLine {
  const identity = lineIdentitySchema.safeParse(raw);
  const { sku: lineSku, name, qty } = identity.success ? identity.data : {};
  return {
    sku: lineSku?.trim() || 'Unnamed product',
    ...(name ? { name } : {}),
    ...(qty !== undefined && Number.isInteger(qty) && qty > 0 ? { qty } : {}),
    reason,
  };
}

function readLine(raw: unknown): CartItem | UnreadableLine {
  const identity = lineIdentitySchema.safeParse(raw);
  const kind = identity.success ? identity.data.kind : undefined;
  const schema = kind === undefined ? undefined : ITEM_SCHEMAS[kind];
  if (!schema) {
    return unreadableLine(raw, 'unknown-kind');
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }
  const power = identity.success ? identity.data.power : undefined;
  const noPower =
    kind === 'camera' && (power === undefined || (Array.isArray(power) && !power.length));
  return unreadableLine(raw, noPower ? 'no-power-data' : 'invalid-data');
}

const envelopeSchema = z.object({
  v: z.literal(CART_FORMAT_VERSION),
  items: z.array(z.unknown()).min(1).max(MAX_CART_LINES),
  returnUrl: z.string().optional(),
});

/** Reads a decoded cart payload. Null when the envelope itself is unusable. */
export function readCartPayload(raw: unknown): Cart | null {
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const items: CartItem[] = [];
  const unreadable: UnreadableLine[] = [];
  for (const line of parsed.data.items) {
    const read = readLine(line);
    if ('reason' in read) {
      unreadable.push(read);
    } else {
      items.push(read);
    }
  }
  const { returnUrl } = parsed.data;
  return { items, unreadable, ...(returnUrl ? { returnUrl } : {}) };
}

/** Reads the cart from a URL fragment such as "#cart=eyJ2Ijox…". */
export function decodeCartHash(hash: string): CartLinkResult {
  const encoded = new URLSearchParams(hash.replace(/^#/, '')).get(CART_HASH_PARAM);
  if (!encoded) {
    return { status: 'none' };
  }
  try {
    const cart = readCartPayload(JSON.parse(fromBase64Url(encoded)));
    return cart ? { status: 'loaded', cart } : { status: 'invalid' };
  } catch {
    // Not base64, not UTF-8 or not JSON.
    return { status: 'invalid' };
  }
}
