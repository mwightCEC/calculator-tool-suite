import { describe, expect, it } from 'vitest';
import { poeShareCodec } from '../../tools/poe-budget/_state/share-link';
import type { Cart, CameraItem, CartItem, PoeInjectorItem, PowerSupplyItem } from './cart-payload';
import { poeCheckDetails, poeCheckHref, poeCheckTitle } from './check-labels';
import { planChecks } from './plan-checks';

function cart(items: CartItem[]): Cart {
  return { items, unreadable: [] };
}

const ipCamera: CameraItem = {
  kind: 'camera',
  sku: 'EX-IP-3',
  qty: 2,
  power: [{ type: 'poe', watts: 6.6 }],
};
const ptz: CameraItem = {
  kind: 'camera',
  sku: 'EX-PTZ',
  qty: 1,
  power: [{ type: 'poe', watts: 40 }],
};
const fourPort: PoeInjectorItem = {
  kind: 'poe-injector',
  sku: 'CE-PS400POE',
  qty: 1,
  poe: { ports: 4, standard: 'bt-type4', watts: 360 },
};
const singlePort: PoeInjectorItem = {
  kind: 'poe-injector',
  sku: 'CE-PS102',
  qty: 2,
  poe: { ports: 1, standard: 'at', watts: 30 },
};
const supply12: PowerSupplyItem = {
  kind: 'power-supply',
  sku: 'EX-PSU-18',
  qty: 1,
  output: { type: 'dc', volts: 12, amps: 20 },
};

describe('PoE checks from a cart', () => {
  it('uses one injector as the power source', () => {
    const { poe } = planChecks(cart([ipCamera, fourPort]));
    expect(poe).toMatchObject({ budgetWatts: 360, ports: 4, portStandard: 'bt-type4' });
    expect(poeCheckTitle(poe!)).toBe('PoE budget · 360 W, 4 ports');
    expect(poeCheckDetails(poe!)[0]).toBe('CE-PS400POE, PoE++ Type 4.');
  });

  it('combines injectors and uses the lowest port standard', () => {
    const { poe } = planChecks(cart([ipCamera, ptz, fourPort, singlePort]));
    expect(poe).toMatchObject({
      budgetWatts: 420,
      ports: 6,
      portStandard: 'at',
      mixedStandards: true,
    });
    const details = poeCheckDetails(poe!);
    expect(details[0]).toContain('3 PoE injectors combined (CE-PS400POE, CE-PS102)');
    expect(details[1]).toBe('They support different PoE standards, so this uses the lowest: PoE+.');
  });

  it('uses the example switch when the cart has no injector', () => {
    const { poe } = planChecks(cart([ipCamera]));
    expect(poe?.state.powerSource).toEqual({
      budgetWatts: 120,
      ports: 8,
      portStandard: 'at',
      reservePercent: 20,
    });
    expect(poeCheckDetails(poe!)[0]).toContain('example PoE+ switch');
  });

  it('prefers a supply in the cart for a camera that lists DC first', () => {
    const dual: CameraItem = {
      ...ipCamera,
      sku: 'EX-DUAL',
      power: [
        { type: 'dc', volts: 12, amps: 0.5 },
        { type: 'poe', watts: 6.6 },
      ],
    };
    const plan = planChecks(cart([dual, supply12, fourPort]));
    expect(plan.voltageDrop[0]?.groups).toEqual([{ sku: 'EX-DUAL', deviceCount: 2 }]);
    expect(plan.poe).toBeUndefined();
    expect(plan.skipped).toEqual([{ sku: 'CE-PS400POE', qty: 1, reason: 'no-poe-camera' }]);
  });

  it('skips everything when the injectors are over the calculator’s limits', () => {
    const plan = planChecks(cart([ipCamera, { ...fourPort, qty: 6 }]));
    expect(plan.poe).toBeUndefined();
    expect(plan.skipped.map((line) => line.reason)).toEqual([
      'injectors-over-limit',
      'injectors-over-limit',
    ]);
  });

  it('skips an injector when every PoE camera is over the group limit', () => {
    const plan = planChecks(cart([{ ...ipCamera, qty: 999 }, { ...ipCamera, qty: 2 }, fourPort]));
    expect(plan.poe).toBeUndefined();
    expect(plan.skipped.map((line) => line.reason)).toEqual(['too-many-devices', 'no-poe-camera']);
  });

  it('opens the calculator with a share link that decodes to the same state', () => {
    const { poe } = planChecks(cart([ipCamera, ptz, fourPort]));
    const href = poeCheckHref(poe!);
    expect(href.startsWith('/tools/poe-budget?v=1&s=')).toBe(true);
    const params = new URL(href, 'https://example.test').searchParams;
    expect(poeShareCodec.decodeShareParams(params)).toEqual({
      status: 'loaded',
      state: poe?.state,
    });
  });
});
