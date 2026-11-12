import { calculateVoltageDrop } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialVoltageDropCalculatorState,
  voltageDropCalculatorReducer,
  type VoltageDropCalculatorAction,
  type VoltageDropCalculatorState,
} from '../_state/voltage-drop-calculator-state';
import {
  buildMetricTiles,
  describeLimit,
  describeProblem,
  describeRemaining,
  describeRunDrop,
  describeRunLimits,
  describeSupplyLoad,
  describeWorstDropPercent,
  describeWorstRun,
  formatRunLength,
  isSupplyLoadKnown,
  supplySegments,
  visibleProblems,
  worstRun,
} from './result-summary';

function stateAfter(...actions: VoltageDropCalculatorAction[]): VoltageDropCalculatorState {
  return actions.reduce(voltageDropCalculatorReducer, createInitialVoltageDropCalculatorState());
}

const defaults = createInitialVoltageDropCalculatorState();
const defaultResult = calculateVoltageDrop(defaults);

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
    expect(describeWorstRun(defaults, defaultResult)).toEqual({
      value: '11.36 V',
      detail: '5.3% worst voltage drop (0.64 V)',
    });
    expect(describeWorstDropPercent(defaultResult)).toBe('5.3% worst drop');
    expect(describeLimit(defaults)).toBe('12 V DC supply, 10% drop limit');
  });

  it('names the worst group when there are several', () => {
    const state = stateAfter({ type: 'add-group' }, LONG_RUN);
    const result = calculateVoltageDrop(state);
    expect(worstRun(result).groupId).toBe('g1');
    expect(describeWorstRun(state, result)).toEqual({
      value: '10.4 V',
      detail: 'Device group 1: 13.3% worst voltage drop (1.6 V)',
    });
  });

  it('puts a run that cannot power its device first', () => {
    const state = stateAfter(LONG_RUN, { type: 'add-group' }, ...CANNOT_POWER);
    const result = calculateVoltageDrop(state);
    expect(worstRun(result).groupId).toBe('g2');
    expect(describeWorstRun(state, result)).toEqual({
      value: "Can't power",
      detail: "Device group 2: the run can't deliver the device's power",
    });
    expect(describeWorstDropPercent(result)).toBeNull();
  });

  it('keeps the worse of two runs whichever comes first', () => {
    const state = stateAfter(
      { type: 'add-group' },
      { type: 'update-group', id: 'g2', changes: { cableLength: 50 } }
    );
    expect(worstRun(calculateVoltageDrop(state)).groupId).toBe('g1');
  });
});

describe('run text', () => {
  const [usage] = defaultResult.groups;

  it('describes the drop and the limits', () => {
    expect(describeRunDrop(usage!)).toBe('5.3% · 11.36 V');
    expect(describeRunLimits(usage!, 'awg-18', 'ft')).toBe(
      'Passes on 20 AWG or thicker · up to 187 ft on 18 AWG'
    );
    expect(describeRunLimits(usage!, 'awg-18', 'm')).toBe(
      'Passes on 20 AWG or thicker · up to 57 m on 18 AWG'
    );
  });

  it('names the wire a failing run needs', () => {
    const longUsage = calculateVoltageDrop(stateAfter(LONG_RUN)).groups[0]!;
    expect(describeRunLimits(longUsage, 'awg-18', 'ft')).toBe(
      'Needs 16 AWG or thicker · up to 187 ft on 18 AWG'
    );
  });

  it('says when no wire fits or the run cannot power the device', () => {
    const state = stateAfter({ type: 'add-group' }, ...CANNOT_POWER);
    const usage2 = calculateVoltageDrop(state).groups[0]!; // the new group, added at the top
    expect(describeRunDrop(usage2)).toBe("Can't power");
    const far = stateAfter({ type: 'update-group', id: 'g1', changes: { cableLength: 5000 } });
    const farUsage = calculateVoltageDrop(far).groups[0]!;
    expect(describeRunLimits(farUsage, 'awg-18', 'ft')).toBe(
      'No listed wire passes · up to 187 ft on 18 AWG'
    );
  });

  it('rounds run lengths down', () => {
    expect(formatRunLength(57.29, 'm')).toBe('57 m');
    expect(formatRunLength(30.48, 'ft')).toBe('100 ft');
  });
});

describe('supply text', () => {
  it('describes the defaults', () => {
    expect(describeSupplyLoad(defaults, defaultResult)).toEqual({
      value: '2 A',
      detail: 'of 4 A usable',
    });
    expect(describeRemaining(defaults, defaultResult)).toBe('2 A left');
  });

  it('describes no reserve and an overload', () => {
    const state = stateAfter(
      { type: 'update-supply', changes: { reservePercent: 0 } },
      { type: 'update-group', id: 'g1', changes: { deviceCount: 12 } }
    );
    const result = calculateVoltageDrop(state);
    expect(describeRemaining(state, result)).toBe('1 A over the usable rating');
  });
});

describe('buildMetricTiles', () => {
  it('shows the supply load, what is left and the rating with its reserve', () => {
    expect(buildMetricTiles(defaults, defaultResult)).toEqual([
      { label: 'Supply load', value: '2 A', detail: '24 W output' },
      { label: 'Remaining', value: '2 A', detail: 'before the reserve' },
      { label: 'Supply rating', value: '5 A', detail: '20% reserve (1 A)' },
    ]);
  });

  it('shows how far over and no reserve', () => {
    const state = stateAfter(
      { type: 'update-supply', changes: { reservePercent: 0 } },
      { type: 'update-group', id: 'g1', changes: { deviceCount: 12 } }
    );
    expect(buildMetricTiles(state, calculateVoltageDrop(state))).toEqual([
      { label: 'Supply load', value: '6 A', detail: '72 W output' },
      { label: 'Short by', value: '1 A', detail: null },
      { label: 'Supply rating', value: '5 A', detail: 'no reserve' },
    ]);
  });
});

describe('an AC transformer', () => {
  // 24 V AC rated 100 VA (about 4.17 A); the default 4 × 0.5 A load is 48 VA.
  const ac = stateAfter(
    { type: 'update-supply', changes: { kind: 'ac', volts: 24 } },
    { type: 'update-supply', changes: { ratedAmps: 100 / 24 } }
  );
  const acResult = calculateVoltageDrop(ac);

  it('shows the supply figures in VA', () => {
    expect(buildMetricTiles(ac, acResult)).toEqual([
      { label: 'Supply load', value: '48 VA', detail: '2 A drawn' },
      { label: 'Remaining', value: '32 VA', detail: 'before the reserve' },
      { label: 'Supply rating', value: '100 VA', detail: '20% reserve (20 VA)' },
    ]);
    expect(describeSupplyLoad(ac, acResult)).toEqual({ value: '48 VA', detail: 'of 80 VA usable' });
    expect(describeRemaining(ac, acResult)).toBe('32 VA left');
  });

  it('names the VA rating when over it', () => {
    const over = voltageDropCalculatorReducer(ac, {
      type: 'update-group',
      id: 'g1',
      changes: { deviceCount: 12 },
    });
    expect(describeProblem({ kind: 'over-budget' }, over, calculateVoltageDrop(over))).toBe(
      'Draws 144 VA, more than the 100 VA rating. Use a larger supply or split the devices across more than one.'
    );
  });
});

describe('supply figures when a run cannot power its device', () => {
  // The audit's case: 4 × 6 W on 1000 ft of 18 AWG at 12 V DC.
  const state = stateAfter(
    { type: 'set-load-input', id: 'g1', input: 'watts' },
    { type: 'update-group', id: 'g1', changes: { cableLength: 1000 } }
  );
  const result = calculateVoltageDrop(state);

  it('marks the supply load unknown only when a run cannot power its device', () => {
    expect(isSupplyLoadKnown(defaultResult)).toBe(true);
    expect(isSupplyLoadKnown(calculateVoltageDrop(stateAfter(LONG_RUN)))).toBe(true);
    expect(isSupplyLoadKnown(result)).toBe(false);
  });

  it('shows the load and what is left as unavailable, keeping the rating', () => {
    expect(describeSupplyLoad(state, result)).toEqual({
      value: 'Unavailable',
      detail: "a run can't be powered",
    });
    expect(describeRemaining(state, result)).toBe('Unavailable');
    expect(buildMetricTiles(state, result)).toEqual([
      { label: 'Supply load', value: 'Unavailable', detail: "a run can't be powered" },
      { label: 'Remaining', value: 'Unavailable', detail: 'needs the supply load' },
      { label: 'Supply rating', value: '5 A', detail: '20% reserve (1 A)' },
    ]);
  });

  it('leaves out supply checks but keeps the run problems', () => {
    const overloaded = stateAfter({ type: 'add-group' }, ...CANNOT_POWER, {
      type: 'update-group',
      id: 'g1',
      changes: { deviceCount: 12 },
    });
    const overloadedResult = calculateVoltageDrop(overloaded);
    expect(overloadedResult.problems[0]).toEqual({ kind: 'over-budget' });
    expect(visibleProblems(overloadedResult)).toEqual([{ kind: 'cannot-power', groupId: 'g2' }]);
    expect(visibleProblems(defaultResult)).toBe(defaultResult.problems);
  });
});

describe('describeProblem', () => {
  it('describes the supply checks', () => {
    const over = stateAfter({ type: 'update-group', id: 'g1', changes: { deviceCount: 12 } });
    const overResult = calculateVoltageDrop(over);
    expect(describeProblem({ kind: 'over-budget' }, over, overResult)).toBe(
      'Draws 6 A, more than the 5 A rating. Use a larger supply or split the devices across more than one.'
    );
    expect(describeProblem({ kind: 'into-reserve' }, over, overResult)).toMatch(
      /^Uses part of the 20% reserve\./
    );
  });

  it('describes a run over the limit, with the fix', () => {
    const state = stateAfter(LONG_RUN);
    const result = calculateVoltageDrop(state);
    expect(result.problems).toEqual([{ kind: 'over-limit', groupId: 'g1' }]);
    expect(describeProblem(result.problems[0]!, state, result)).toBe(
      'Device group 1: 13.3% drop, over the 10% limit. Use 16 AWG or thicker, or keep runs under 187 ft.'
    );
  });

  it('names the group and suggests a higher voltage when no wire fits', () => {
    const state = voltageDropCalculatorReducer(defaults, {
      type: 'update-group',
      id: 'g1',
      changes: { load: { input: 'amps', amps: 0.2 }, cableLength: 4000 },
    });
    const result = calculateVoltageDrop(state);
    expect(describeProblem({ kind: 'over-limit', groupId: 'g1' }, state, result)).toBe(
      'Device group 1: 85.1% drop, over the 10% limit. No listed wire size is enough at this length: keep runs under 469 ft or use a higher-voltage supply.'
    );
  });

  it('describes a run that cannot power its device', () => {
    const state = stateAfter({ type: 'add-group' }, ...CANNOT_POWER);
    const result = calculateVoltageDrop(state);
    expect(describeProblem({ kind: 'cannot-power', groupId: 'g2' }, state, result)).toBe(
      "Device group 2: the run can't deliver 60 W at 12 V DC. No listed wire size is enough at this length: keep runs under 16 ft or use a higher-voltage supply."
    );
  });

  it('returns nothing for an unknown group', () => {
    expect(describeProblem({ kind: 'over-limit', groupId: 'g9' }, defaults, defaultResult)).toBe(
      ''
    );
  });
});

describe('supplySegments', () => {
  it('splits the rating into groups, free and reserve', () => {
    expect(supplySegments(defaults, defaultResult)).toEqual([
      { key: 'g1', label: 'Device group 1', value: 2, color: 'var(--group-color-0)' },
      { key: 'free', label: 'Free', value: 2, color: 'var(--app-capacity-unused)' },
      { key: 'reserve', label: 'Reserve', value: 1, color: 'var(--app-capacity-reserve)' },
    ]);
  });

  it('combines the groups into one Devices segment when simplified', () => {
    const state = stateAfter({ type: 'add-group' });
    const result = calculateVoltageDrop(state);
    const segments = supplySegments(state, result, true);
    expect(segments.map((segment) => segment.label)).toEqual(['Devices', 'Free', 'Reserve']);
    expect(segments[0]?.value).toBeCloseTo(result.totalAmps);
    expect(segments[0]?.color).toBe('var(--mantine-color-brand-6)');
  });

  it('lets the groups fill the bar when over the rating', () => {
    const state = stateAfter({ type: 'update-group', id: 'g1', changes: { deviceCount: 12 } });
    const segments = supplySegments(state, calculateVoltageDrop(state));
    expect(segments.map((segment) => [segment.label, segment.value])).toEqual([
      ['Device group 1', 6],
      ['Free', 0],
      ['Reserve', 0],
    ]);
  });
});
