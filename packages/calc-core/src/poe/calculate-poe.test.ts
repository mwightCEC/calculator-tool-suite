import { describe, expect, it } from 'vitest';
import { budgetStatus, calculatePoe } from './calculate-poe';
import { createDefaultPoeInput, createPoeDeviceGroup, type PoeInput } from './schema';

function inputWith(changes: Partial<PoeInput>): PoeInput {
  return { ...createDefaultPoeInput(), ...changes };
}

describe('budgetStatus', () => {
  it.each([
    [96, 'ok'],
    [96.1, 'into-reserve'],
    [120, 'into-reserve'],
    [120.1, 'over-budget'],
  ] as const)('%d W of 96 W usable (120 W budget) is %s', (total, status) => {
    expect(budgetStatus(total, 96, 120)).toBe(status);
  });
});

describe('calculatePoe', () => {
  it('budgets the defaults: 4 × 6 W cameras with 100 m assumed', () => {
    const result = calculatePoe(createDefaultPoeInput());
    expect(result.groups).toEqual([
      {
        groupId: 'g1',
        deviceCount: 4,
        requiredClass: 2,
        cableLengthM: null,
        cableLossWatts: expect.closeTo(0.18),
        perDeviceWatts: expect.closeTo(6.18),
        totalWatts: expect.closeTo(24.72),
        fitsPortStandard: true,
        cableTooLong: false,
      },
    ]);
    expect(result).toEqual(
      expect.objectContaining({
        totalDevices: 4,
        totalWatts: expect.closeTo(24.72),
        budgetWatts: 120,
        reserveWatts: 24,
        usableWatts: 96,
        remainingWatts: expect.closeTo(71.28),
        utilisation: expect.closeTo(0.2575),
        budgetStatus: 'ok',
        ports: 8,
        enoughPorts: true,
        problems: [],
      })
    );
  });

  it('converts a cable length in feet before estimating the loss', () => {
    const group = { ...createPoeDeviceGroup('g1', 'Lobby'), cableLength: 164.042 };
    const [usage] = calculatePoe(inputWith({ deviceGroups: [group] })).groups;
    expect(usage?.cableLengthM).toBeCloseTo(50);
    expect(usage?.cableLossWatts).toBeCloseTo(0.09);
  });

  it('takes the class allocation, with no extra cable loss, when power is given by class', () => {
    const group = {
      ...createPoeDeviceGroup('g1', 'PTZ'),
      deviceCount: 2,
      power: { input: 'class' as const, poeClass: 4 as const },
      cableLength: 50,
    };
    const result = calculatePoe(inputWith({ deviceGroups: [group], cableLengthUnit: 'm' }));
    expect(result.groups[0]).toEqual(
      expect.objectContaining({
        requiredClass: 4,
        cableLengthM: 50,
        cableLossWatts: 0,
        perDeviceWatts: 30,
        totalWatts: 60,
        fitsPortStandard: true,
      })
    );
  });

  it.each([
    ['a class above the port standard', { input: 'class' as const, poeClass: 4 as const }, false],
    ['a class within it', { input: 'class' as const, poeClass: 0 as const }, true],
    ['a draw above the port standard', { input: 'watts' as const, watts: 13 }, false],
    ['a draw within it', { input: 'watts' as const, watts: 12.95 }, true],
  ])('checks %s against 802.3af ports', (_label, power, fits) => {
    const group = { ...createPoeDeviceGroup('g1', 'Lobby'), power };
    const input = inputWith({
      powerSource: { budgetWatts: 120, ports: 8, portStandard: 'af', reservePercent: 20 },
      deviceGroups: [group],
    });
    expect(calculatePoe(input).groups[0]?.fitsPortStandard).toBe(fits);
  });

  it('gives no required class for a draw no class covers', () => {
    const group = {
      ...createPoeDeviceGroup('g1', 'Heater'),
      power: { input: 'watts' as const, watts: 80 },
    };
    const result = calculatePoe(inputWith({ deviceGroups: [group] }));
    expect(result.groups[0]?.requiredClass).toBeNull();
    expect(result.groups[0]?.fitsPortStandard).toBe(false);
  });

  it('lists every failed check: budget, ports, then each group in order', () => {
    const tooLong = { ...createPoeDeviceGroup('g1', 'Fence'), deviceCount: 6, cableLength: 400 };
    const tooHungry = {
      ...createPoeDeviceGroup('g2', 'PTZ'),
      deviceCount: 4,
      power: { input: 'class' as const, poeClass: 6 as const },
    };
    const result = calculatePoe(inputWith({ deviceGroups: [tooLong, tooHungry] }));
    expect(result.budgetStatus).toBe('over-budget');
    expect(result.remainingWatts).toBeLessThan(0);
    expect(result.enoughPorts).toBe(false);
    expect(result.groups[0]?.cableTooLong).toBe(true);
    expect(result.problems).toEqual([
      { kind: 'over-budget' },
      { kind: 'not-enough-ports' },
      { kind: 'cable-too-long', groupId: 'g1' },
      { kind: 'port-standard', groupId: 'g2' },
    ]);
  });

  it('warns when the load runs into the reserve', () => {
    const group = {
      ...createPoeDeviceGroup('g1', 'PTZ'),
      power: { input: 'class' as const, poeClass: 4 as const },
    };
    const result = calculatePoe(inputWith({ deviceGroups: [group] }));
    expect(result.totalWatts).toBe(120);
    expect(result.problems).toEqual([{ kind: 'into-reserve' }]);
  });
});
