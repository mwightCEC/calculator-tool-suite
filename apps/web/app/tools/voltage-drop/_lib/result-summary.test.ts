import { calculateVoltageDrop } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialVoltageDropCalculatorState,
  voltageDropCalculatorReducer,
  type VoltageDropCalculatorAction,
  type VoltageDropCalculatorState,
} from '../_state/voltage-drop-calculator-state';
import {
  describeLimit,
  describeProblem,
  describeRating,
  describeRemaining,
  describeRunDrop,
  describeRunLimits,
  describeSupplyLoad,
  describeWorstDeviceVolts,
  describeWorstDrop,
  formatRunLength,
  supplySegments,
  worstRun,
} from './result-summary';

function advancedAfter(...actions: VoltageDropCalculatorAction[]): VoltageDropCalculatorState {
  const advanced = voltageDropCalculatorReducer(createInitialVoltageDropCalculatorState(), {
    type: 'set-input-mode',
    inputMode: 'advanced',
  });
  return actions.reduce(voltageDropCalculatorReducer, advanced);
}

const simple = createInitialVoltageDropCalculatorState();
const simpleResult = calculateVoltageDrop(simple);

/** One device on 250 ft of 18 AWG: 13.3% drop, over the 10% limit. */
const LONG_RUN: VoltageDropCalculatorAction = {
  type: 'update-group',
  id: 'g1',
  changes: { deviceCount: 1, cableLength: 250 },
};

/** 60 W at 12 V over 1000 ft of 18 AWG can't be delivered. */
const CANNOT_POWER: VoltageDropCalculatorAction[] = [
  { type: 'set-load-input', id: 'g2', input: 'watts' },
  {
    type: 'update-group',
    id: 'g2',
    changes: { deviceCount: 1, load: { input: 'watts', watts: 60 }, cableLength: 1000 },
  },
];

describe('headline text', () => {
  it('describes the defaults', () => {
    expect(describeWorstDrop(simple, simpleResult)).toEqual({
      value: '5.3%',
      detail: '0.64 V drop · 11.36 V at the device',
    });
    expect(describeWorstDeviceVolts(simpleResult)).toBe('11.36 V at the device');
    expect(describeLimit(simple)).toBe('12 V DC supply, 10% drop limit');
  });

  it('names the worst group when there are several', () => {
    const state = advancedAfter({ type: 'add-group' }, LONG_RUN);
    const result = calculateVoltageDrop(state);
    expect(worstRun(result).groupId).toBe('g1');
    expect(describeWorstDrop(state, result)).toEqual({
      value: '13.3%',
      detail: 'Camera group 1: 1.6 V drop · 10.4 V at the device',
    });
  });

  it('puts a run that cannot power its device first', () => {
    const state = advancedAfter(LONG_RUN, { type: 'add-group' }, ...CANNOT_POWER);
    const result = calculateVoltageDrop(state);
    expect(worstRun(result).groupId).toBe('g2');
    expect(describeWorstDrop(state, result)).toEqual({
      value: "Can't power",
      detail: "Camera group 2: the run can't deliver the device's power",
    });
    expect(describeWorstDeviceVolts(result)).toBeNull();
  });

  it('keeps the worse of two runs whichever comes first', () => {
    const state = advancedAfter(
      { type: 'add-group' },
      { type: 'update-group', id: 'g2', changes: { cableLength: 50 } }
    );
    expect(worstRun(calculateVoltageDrop(state)).groupId).toBe('g1');
  });
});

describe('run text', () => {
  const [usage] = simpleResult.groups;

  it('describes the drop and the limits', () => {
    expect(describeRunDrop(usage!)).toBe('5.3% · 11.36 V');
    expect(describeRunLimits(usage!, 'ft')).toBe('Smallest wire 20 AWG · longest run 187 ft');
    expect(describeRunLimits(usage!, 'm')).toBe('Smallest wire 20 AWG · longest run 57 m');
  });

  it('says when no wire fits or the run cannot power the device', () => {
    const state = advancedAfter({ type: 'add-group' }, ...CANNOT_POWER);
    const usage2 = calculateVoltageDrop(state).groups[1]!;
    expect(describeRunDrop(usage2)).toBe("Can't power");
    const far = advancedAfter({ type: 'update-group', id: 'g1', changes: { cableLength: 5000 } });
    const farUsage = calculateVoltageDrop(far).groups[0]!;
    expect(describeRunLimits(farUsage, 'ft')).toBe('No listed wire fits · longest run 187 ft');
  });

  it('rounds run lengths down', () => {
    expect(formatRunLength(57.29, 'm')).toBe('57 m');
    expect(formatRunLength(30.48, 'ft')).toBe('100 ft');
  });
});

describe('supply text', () => {
  it('describes the defaults', () => {
    expect(describeSupplyLoad(simpleResult)).toEqual({ value: '2 A', detail: 'of 4 A usable' });
    expect(describeRemaining(simpleResult)).toBe('2 A left');
    expect(describeRating(simple, simpleResult)).toBe(
      '5 A rated less a 20% reserve (1 A) · 24 W output'
    );
  });

  it('describes no reserve and an overload', () => {
    const state = advancedAfter(
      { type: 'update-supply', changes: { reservePercent: 0 } },
      { type: 'update-group', id: 'g1', changes: { deviceCount: 12 } }
    );
    const result = calculateVoltageDrop(state);
    expect(describeRemaining(result)).toBe('1 A over the usable rating');
    expect(describeRating(state, result)).toBe('5 A rated, no reserve · 72 W output');
  });
});

describe('describeProblem', () => {
  it('describes the supply checks', () => {
    const over = advancedAfter({ type: 'update-group', id: 'g1', changes: { deviceCount: 12 } });
    const overResult = calculateVoltageDrop(over);
    expect(describeProblem({ kind: 'over-budget' }, over, overResult)).toBe(
      'Draws 6 A, more than the 5 A rating. Use a larger supply or split the devices across more than one.'
    );
    expect(describeProblem({ kind: 'into-reserve' }, over, overResult)).toMatch(
      /^Uses part of the 20% reserve\./
    );
  });

  it('describes a run over the limit, with the fix', () => {
    const state = advancedAfter(LONG_RUN);
    const result = calculateVoltageDrop(state);
    expect(result.problems).toEqual([{ kind: 'over-limit', groupId: 'g1' }]);
    expect(describeProblem(result.problems[0]!, state, result)).toBe(
      'Camera group 1: 13.3% drop, over the 10% limit. Use 16 AWG or thicker, or keep runs under 187 ft.'
    );
  });

  it('names Simple mode’s setup "Devices" and suggests a higher voltage when no wire fits', () => {
    const state = voltageDropCalculatorReducer(simple, {
      type: 'update-group',
      id: 'g1',
      changes: { load: { input: 'amps', amps: 0.2 }, cableLength: 4000 },
    });
    const result = calculateVoltageDrop(state);
    expect(describeProblem({ kind: 'over-limit', groupId: 'g1' }, state, result)).toBe(
      'Devices: 85.1% drop, over the 10% limit. No listed wire size is enough at this length: keep runs under 469 ft or use a higher-voltage supply.'
    );
  });

  it('describes a run that cannot power its device', () => {
    const state = advancedAfter({ type: 'add-group' }, ...CANNOT_POWER);
    const result = calculateVoltageDrop(state);
    expect(describeProblem({ kind: 'cannot-power', groupId: 'g2' }, state, result)).toBe(
      "Camera group 2: the run can't deliver 60 W at 12 V DC. No listed wire size is enough at this length: keep runs under 16 ft or use a higher-voltage supply."
    );
  });

  it('returns nothing for an unknown group', () => {
    expect(describeProblem({ kind: 'over-limit', groupId: 'g9' }, simple, simpleResult)).toBe('');
  });
});

describe('supplySegments', () => {
  it('splits the rating into groups, free and reserve', () => {
    expect(supplySegments(simple, simpleResult)).toEqual([
      { key: 'g1', label: 'Devices', value: 2, color: 'var(--group-color-0)' },
      { key: 'free', label: 'Free', value: 2, color: 'var(--app-capacity-unused)' },
      { key: 'reserve', label: 'Reserve', value: 1, color: 'var(--app-capacity-reserve)' },
    ]);
  });

  it('lets the groups fill the bar when over the rating', () => {
    const state = advancedAfter({ type: 'update-group', id: 'g1', changes: { deviceCount: 12 } });
    const segments = supplySegments(state, calculateVoltageDrop(state));
    expect(segments.map((segment) => [segment.label, segment.value])).toEqual([
      ['Camera group 1', 6],
      ['Free', 0],
      ['Reserve', 0],
    ]);
  });
});
