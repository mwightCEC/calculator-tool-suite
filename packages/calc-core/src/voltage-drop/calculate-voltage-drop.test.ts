import { describe, expect, it } from 'vitest';
import { calculateVoltageDrop } from './calculate-voltage-drop';
import {
  createDefaultVoltageDropInput,
  createVoltageDropGroup,
  type VoltageDropGroup,
  type VoltageDropInput,
} from './schema';

function inputWith(changes: Partial<VoltageDropInput>): VoltageDropInput {
  return { ...createDefaultVoltageDropInput(), ...changes };
}

function group(changes: Partial<VoltageDropGroup>): VoltageDropGroup {
  return { ...createVoltageDropGroup('g1', 'Gate'), ...changes };
}

describe('calculateVoltageDrop', () => {
  it('works out the defaults: 4 × 0.5 A on 100 ft of 18 AWG from 12 V', () => {
    const result = calculateVoltageDrop(createDefaultVoltageDropInput());
    // 18 AWG ≈ 6.385 Ω per 1000 ft, so 200 ft out and back ≈ 1.277 Ω.
    expect(result.groups).toEqual([
      {
        groupId: 'g1',
        deviceCount: 4,
        cableLengthM: expect.closeTo(30.48),
        loopOhms: expect.closeTo(1.277, 3),
        ampsPerDevice: 0.5,
        totalAmps: 2,
        dropVolts: expect.closeTo(0.6385, 3),
        dropFraction: expect.closeTo(0.0532, 3),
        deviceVolts: expect.closeTo(11.3615, 3),
        cableLossWatts: expect.closeTo(1.277, 3),
        status: 'ok',
        smallestGauge: 'awg-20',
        maxLengthM: expect.closeTo(57.29, 1),
      },
    ]);
    expect(result).toEqual(
      expect.objectContaining({
        totalDevices: 4,
        totalAmps: 2,
        totalWatts: 24,
        ratedAmps: 5,
        reserveAmps: 1,
        usableAmps: 4,
        remainingAmps: 2,
        utilisation: 0.5,
        supplyStatus: 'ok',
        problems: [],
      })
    );
  });

  it('flags a run over the drop limit and finds a wire that fixes it', () => {
    const [usage] = calculateVoltageDrop(
      inputWith({ deviceGroups: [group({ deviceCount: 1, cableLength: 250 })] })
    ).groups;
    expect(usage?.dropFraction).toBeCloseTo(0.133, 3);
    expect(usage?.status).toBe('over-limit');
    expect(usage?.smallestGauge).toBe('awg-16');
  });

  it('reports no wire when even the thickest is not enough', () => {
    const result = calculateVoltageDrop(
      inputWith({ deviceGroups: [group({ deviceCount: 1, cableLength: 5000 })] })
    );
    expect(result.groups[0]?.smallestGauge).toBeNull();
    expect(result.problems).toEqual([{ kind: 'over-limit', groupId: 'g1' }]);
  });

  it('raises the current of a constant-power load as the voltage falls', () => {
    const [usage] = calculateVoltageDrop(
      inputWith({ deviceGroups: [group({ load: { input: 'watts', watts: 6 } })] })
    ).groups;
    expect(usage?.ampsPerDevice).toBeGreaterThan(0.5);
    const deviceWatts = (usage?.deviceVolts ?? 0) * (usage?.ampsPerDevice ?? 0);
    expect(deviceWatts).toBeCloseTo(6);
  });

  it('marks a run that cannot deliver the power and budgets it at P / V', () => {
    const result = calculateVoltageDrop(
      inputWith({
        deviceGroups: [
          group({ deviceCount: 1, load: { input: 'watts', watts: 60 }, cableLength: 500 }),
        ],
      })
    );
    expect(result.groups[0]).toEqual(
      expect.objectContaining({
        status: 'cannot-power',
        ampsPerDevice: 5,
        dropVolts: null,
        dropFraction: null,
        deviceVolts: null,
        cableLossWatts: null,
      })
    );
    expect(result.problems).toEqual([
      { kind: 'into-reserve' },
      { kind: 'cannot-power', groupId: 'g1' },
    ]);
  });

  it('works in metres and square millimetres', () => {
    const [usage] = calculateVoltageDrop(
      inputWith({
        wireSystem: 'mm2',
        cableLengthUnit: 'm',
        deviceGroups: [group({ gauge: 'mm2-1.5', cableLength: 50 })],
      })
    ).groups;
    // 1.5 mm² copper ≈ 11.49 Ω/km: 100 m loop ≈ 1.149 Ω, × 0.5 A ≈ 0.575 V.
    expect(usage?.cableLengthM).toBe(50);
    expect(usage?.dropVolts).toBeCloseTo(0.575, 3);
    expect(usage?.smallestGauge).toBe('mm2-0.75');
  });

  it('uses the AC supply voltage the same way', () => {
    const [usage] = calculateVoltageDrop(
      inputWith({ powerSupply: { kind: 'ac', volts: 24, ratedAmps: 5, reservePercent: 20 } })
    ).groups;
    expect(usage?.dropFraction).toBeCloseTo(0.0266, 3);
  });

  it('checks the supply against its rating and reserve', () => {
    const many = (deviceCount: number) => inputWith({ deviceGroups: [group({ deviceCount })] });
    expect(calculateVoltageDrop(many(9)).supplyStatus).toBe('into-reserve');
    const over = calculateVoltageDrop(many(11));
    expect(over.supplyStatus).toBe('over-budget');
    expect(over.remainingAmps).toBeCloseTo(-1.5);
    expect(over.problems[0]).toEqual({ kind: 'over-budget' });
  });

  it('adds up every group', () => {
    const result = calculateVoltageDrop(
      inputWith({
        deviceGroups: [group({ id: 'a', deviceCount: 2 }), group({ id: 'b', deviceCount: 3 })],
      })
    );
    expect(result.totalDevices).toBe(5);
    expect(result.totalAmps).toBeCloseTo(2.5);
  });
});
