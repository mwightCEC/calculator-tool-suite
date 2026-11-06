import { describe, expect, it } from 'vitest';
import { voltageDropShareCodec } from '../../tools/voltage-drop/_state/share-link';
import type { Cart, CameraItem, CartItem, PowerSupplyItem } from './cart-payload';
import { describeCartSummary, voltageDropCheckDetails, voltageDropCheckHref } from './check-labels';
import { planChecks } from './plan-checks';

function cart(items: CartItem[]): Cart {
  return { items, unreadable: [] };
}

const dome: CameraItem = {
  kind: 'camera',
  sku: 'EX-DOME-1',
  qty: 8,
  power: [
    { type: 'dc', volts: 12, amps: 0.14 },
    { type: 'ac', volts: 24, amps: 0.07 },
  ],
};
const bullet: CameraItem = {
  kind: 'camera',
  sku: 'EX-BULLET-2',
  qty: 2,
  power: [{ type: 'dc', volts: 12, amps: 0.5 }],
};
const ipCamera: CameraItem = {
  kind: 'camera',
  sku: 'EX-IP-3',
  qty: 2,
  power: [{ type: 'poe', watts: 6.6 }],
};
const supply12: PowerSupplyItem = {
  kind: 'power-supply',
  sku: 'EX-PSU-18',
  qty: 1,
  output: { type: 'dc', volts: 12, amps: 20, outputs: 18 },
};
const supply24ac: PowerSupplyItem = {
  kind: 'power-supply',
  sku: 'EX-PSU-AC',
  qty: 1,
  output: { type: 'ac', volts: 24, watts: 50 },
};

describe('planChecks', () => {
  it('turns the spec’s worked example into a voltage drop and a PoE check', () => {
    const plan = planChecks(
      cart([
        dome,
        bullet,
        ipCamera,
        supply12,
        {
          kind: 'poe-injector',
          sku: 'CE-PS400POE',
          qty: 1,
          poe: { ports: 4, standard: 'bt-type4', watts: 360 },
        },
        { kind: 'recorder', sku: 'CE-HVR16', qty: 1 },
        { kind: 'accessory', sku: 'EX-MOUNT', qty: 4 },
      ])
    );

    expect(plan.summary).toEqual({ cameras: 12, powerSupplies: 1, poeInjectors: 1, otherItems: 5 });
    expect(plan.voltageDrop).toHaveLength(1);
    const [check] = plan.voltageDrop;
    expect(check?.state.powerSupply).toEqual({
      kind: 'dc',
      volts: 12,
      ratedAmps: 20,
      reservePercent: 20,
    });
    expect(
      check?.state.deviceGroups.map(({ name, deviceCount, load }) => ({ name, deviceCount, load }))
    ).toEqual([
      { name: 'EX-DOME-1', deviceCount: 8, load: { input: 'amps', amps: 0.14 } },
      { name: 'EX-BULLET-2', deviceCount: 2, load: { input: 'amps', amps: 0.5 } },
    ]);
    expect(plan.poe?.state.powerSource).toEqual({
      budgetWatts: 360,
      ports: 4,
      portStandard: 'bt-type4',
      reservePercent: 20,
    });
    expect(
      plan.poe?.state.deviceGroups.map(({ name, deviceCount, power, cableLength }) => ({
        name,
        deviceCount,
        power,
        cableLength,
      }))
    ).toEqual([
      { name: 'EX-IP-3', deviceCount: 2, power: { input: 'watts', watts: 6.6 }, cableLength: null },
    ]);
    expect(plan.skipped.map(({ sku, reason }) => [sku, reason])).toEqual([
      ['CE-HVR16', 'recorder'],
      ['EX-MOUNT', 'not-powered'],
    ]);
  });

  it('uses the calculator defaults for what the cart can’t know', () => {
    const [check] = planChecks(cart([bullet, supply12])).voltageDrop;
    expect(check?.state).toMatchObject({
      dropLimitPercent: 10,
      wireSystem: 'awg',
      cableLengthUnit: 'ft',
    });
    expect(check?.state.deviceGroups[0]).toMatchObject({ gauge: 'awg-18', cableLength: 100 });
  });

  it('makes one check per supply voltage and assigns cameras by their input order', () => {
    const acDome: CameraItem = { ...dome, sku: 'EX-AC-FIRST', power: [...dome.power].reverse() };
    const plan = planChecks(cart([dome, acDome, supply12, supply24ac]));
    expect(
      plan.voltageDrop.map((check) => [
        check.kind,
        check.volts,
        check.ratedAmps,
        check.groups.map((group) => group.sku),
      ])
    ).toEqual([
      ['dc', 12, 20, ['EX-DOME-1']],
      // 50 VA at 24 V, unrounded so the rating shows as 50 VA
      ['ac', 24, 50 / 24, ['EX-AC-FIRST']],
    ]);
    expect(voltageDropCheckDetails(plan.voltageDrop[1]!)[0]).toMatch(/^50 VA from /);
  });

  it('combines supplies of the same voltage and merges lines of the same model', () => {
    const plan = planChecks(
      cart([bullet, { ...bullet, qty: 3 }, supply12, { ...supply12, sku: 'EX-PSU-B', qty: 2 }])
    );
    const [check] = plan.voltageDrop;
    expect(check?.ratedAmps).toBe(60);
    expect(check?.groups).toEqual([{ sku: 'EX-BULLET-2', deviceCount: 5 }]);
    expect(voltageDropCheckDetails(check!)[0]).toContain('3 power supplies combined');
  });

  it('uses watts as a constant-power load when no current is given', () => {
    const wattsOnly: CameraItem = { ...bullet, power: [{ type: 'dc', volts: 12, watts: 4.5 }] };
    const [check] = planChecks(cart([wattsOnly, supply12])).voltageDrop;
    expect(check?.state.deviceGroups[0]?.load).toEqual({ input: 'watts', watts: 4.5 });
  });

  it('uses an example supply when the cart has none', () => {
    const [check] = planChecks(cart([dome])).voltageDrop;
    expect(check?.state.powerSupply).toMatchObject({ kind: 'dc', volts: 12, ratedAmps: 5 });
    expect(voltageDropCheckDetails(check!)[0]).toContain('example 5 A supply');
  });

  it('skips cameras that match no supply, and supplies that power no camera', () => {
    const acOnly: CameraItem = {
      ...dome,
      sku: 'EX-AC',
      power: [{ type: 'ac', volts: 24, amps: 0.1 }],
    };
    const plan = planChecks(cart([acOnly, supply12]));
    expect(plan.voltageDrop).toEqual([]);
    expect(plan.skipped.map(({ sku, reason }) => [sku, reason])).toEqual([
      ['EX-AC', 'no-matching-supply'],
      ['EX-PSU-18', 'no-matching-camera'],
    ]);
  });

  it('keeps within the calculator’s limits', () => {
    const huge: PowerSupplyItem = { ...supply12, qty: 11 }; // 220 A
    expect(planChecks(cart([bullet, huge])).skipped.map((line) => line.reason)).toEqual([
      'supply-over-limit',
      'supply-over-limit',
    ]);

    const tooMany = planChecks(cart([bullet, { ...bullet, qty: 999 }, supply12]));
    expect(tooMany.voltageDrop).toEqual([]);
    expect(tooMany.skipped.map((line) => line.reason)).toEqual([
      'too-many-devices',
      'no-matching-camera',
    ]);

    const models = Array.from({ length: 21 }, (_, index) => ({ ...bullet, sku: `EX-${index}` }));
    const plan = planChecks(cart([...models, supply12]));
    expect(plan.voltageDrop[0]?.groups).toHaveLength(20);
    expect(plan.skipped).toEqual([{ sku: 'EX-20', qty: 2, reason: 'too-many-groups' }]);
  });

  it('opens the calculator with a share link that decodes to the same state', () => {
    const [check] = planChecks(cart([dome, bullet, supply12])).voltageDrop;
    const href = voltageDropCheckHref(check!);
    expect(href.startsWith('/tools/voltage-drop?v=1&s=')).toBe(true);
    const params = new URL(href, 'https://example.test').searchParams;
    expect(voltageDropShareCodec.decodeShareParams(params)).toEqual({
      status: 'loaded',
      state: check?.state,
    });
  });
});

describe('describeCartSummary', () => {
  it('lists what came in', () => {
    expect(
      describeCartSummary({ cameras: 12, powerSupplies: 1, poeInjectors: 2, otherItems: 3 })
    ).toBe('12 cameras, 1 power supply, 2 PoE injectors and 3 other items from your cart');
    expect(
      describeCartSummary({ cameras: 1, powerSupplies: 0, poeInjectors: 0, otherItems: 0 })
    ).toBe('1 camera from your cart');
  });
});
