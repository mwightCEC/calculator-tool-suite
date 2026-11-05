import { describe, expect, it } from 'vitest';
import { toBase64Url } from '../../../lib/share/share-codec';
import { decodeCartHash, readCartPayload } from './cart-payload';

const camera = {
  kind: 'camera',
  sku: 'EX-DOME-1',
  qty: 8,
  power: [
    { type: 'dc', volts: 12, amps: 0.14 },
    { type: 'ac', volts: 24, amps: 0.07 },
  ],
};

function hashFor(payload: unknown): string {
  return `#cart=${toBase64Url(JSON.stringify(payload))}`;
}

describe('decodeCartHash', () => {
  it('reads a cart from the fragment', () => {
    const result = decodeCartHash(hashFor({ v: 1, items: [camera] }));
    expect(result).toEqual({ status: 'loaded', cart: { items: [camera], unreadable: [] } });
  });

  it('reports no cart when the fragment has none', () => {
    expect(decodeCartHash('')).toEqual({ status: 'none' });
    expect(decodeCartHash('#other=1')).toEqual({ status: 'none' });
  });

  it.each([
    ['not base64 JSON', '#cart=%%%'],
    ['not JSON', `#cart=${toBase64Url('not json')}`],
    ['an unknown version', hashFor({ v: 2, items: [camera] })],
    ['no items', hashFor({ v: 1, items: [] })],
    ['more than 50 lines', hashFor({ v: 1, items: Array.from({ length: 51 }, () => camera) })],
  ])('rejects %s', (_, hash) => {
    expect(decodeCartHash(hash)).toEqual({ status: 'invalid' });
  });

  it('keeps non-ASCII product names', () => {
    const named = { ...camera, name: 'Dôme caméra' };
    const result = decodeCartHash(hashFor({ v: 1, items: [named] }));
    expect(result.status === 'loaded' && result.cart.items[0]?.name).toBe('Dôme caméra');
  });
});

describe('readCartPayload', () => {
  it('keeps the return address and ignores unknown fields', () => {
    const cart = readCartPayload({
      v: 1,
      returnUrl: 'https://www.clintonelectronics.com/cart',
      extra: true,
      items: [{ ...camera, color: 'Black' }],
    });
    expect(cart?.returnUrl).toBe('https://www.clintonelectronics.com/cart');
    expect(cart?.items).toHaveLength(1);
  });

  it('reads every product kind', () => {
    const cart = readCartPayload({
      v: 1,
      items: [
        camera,
        { kind: 'camera', sku: 'EX-IP-3', qty: 2, power: [{ type: 'poe', watts: 6.6 }] },
        {
          kind: 'power-supply',
          sku: 'EX-PSU',
          qty: 1,
          output: { type: 'dc', volts: 12, watts: 240, outputs: 18 },
        },
        {
          kind: 'poe-injector',
          sku: 'CE-PS400POE',
          qty: 1,
          poe: { ports: 4, standard: 'bt-type4', watts: 360 },
        },
        { kind: 'recorder', sku: 'CE-HVR16', qty: 1 },
        { kind: 'cable', sku: 'EX-CABLE', qty: 1 },
        { kind: 'accessory', sku: 'EX-MOUNT', qty: 4 },
      ],
    });
    expect(cart?.items.map((item) => item.kind)).toEqual([
      'camera',
      'camera',
      'power-supply',
      'poe-injector',
      'recorder',
      'cable',
      'accessory',
    ]);
    expect(cart?.unreadable).toEqual([]);
  });

  it('lists bad lines with their reason and keeps the rest', () => {
    const cart = readCartPayload({
      v: 1,
      items: [
        camera,
        { kind: 'camera', sku: 'NO-POWER', qty: 2, power: [] },
        { kind: 'camera', sku: 'MISSING-POWER', qty: 1 },
        { kind: 'camera', sku: 'TOO-HUNGRY', qty: 1, power: [{ type: 'poe', watts: 120 }] },
        { kind: 'camera', sku: 'NO-LOAD', qty: 1, power: [{ type: 'dc', volts: 12 }] },
        { kind: 'power-supply', sku: 'NO-RATING', qty: 1, output: { type: 'dc', volts: 12 } },
        { kind: 'drone', sku: 'EX-DRONE', qty: 1 },
        { kind: 'accessory', sku: 'EX-MOUNT', qty: 1000 },
        'not an object',
      ],
    });
    expect(cart?.items).toEqual([camera]);
    expect(cart?.unreadable).toEqual([
      { sku: 'NO-POWER', qty: 2, reason: 'no-power-data' },
      { sku: 'MISSING-POWER', qty: 1, reason: 'no-power-data' },
      { sku: 'TOO-HUNGRY', qty: 1, reason: 'invalid-data' },
      { sku: 'NO-LOAD', qty: 1, reason: 'invalid-data' },
      { sku: 'NO-RATING', qty: 1, reason: 'invalid-data' },
      { sku: 'EX-DRONE', qty: 1, reason: 'unknown-kind' },
      { sku: 'EX-MOUNT', qty: 1000, reason: 'invalid-data' },
      { sku: 'Unnamed product', reason: 'unknown-kind' },
    ]);
  });
});
