import { calculatePoe } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialPoeCalculatorState,
  poeCalculatorReducer,
  type PoeCalculatorAction,
  type PoeCalculatorState,
} from '../_state/poe-calculator-state';
import {
  budgetSegments,
  buildMetricTiles,
  describeBudget,
  describePorts,
  describeProblem,
  describeRemaining,
  describeUsage,
} from './result-summary';

function stateAfter(...actions: PoeCalculatorAction[]): PoeCalculatorState {
  return actions.reduce(poeCalculatorReducer, createInitialPoeCalculatorState());
}

/** Four class 4 devices: exactly 120 W, so 24 W into the 20% reserve. */
const CLASS_4: PoeCalculatorAction[] = [
  { type: 'set-power-input', id: 'g1', input: 'class' },
  { type: 'update-group', id: 'g1', changes: { power: { input: 'class', poeClass: 4 } } },
];

describe('headline text', () => {
  it('describes the defaults', () => {
    const state = createInitialPoeCalculatorState();
    const result = calculatePoe(state);
    expect(describeUsage(result)).toEqual({ value: '24.8 W', detail: 'of 96 W available' });
    expect(describeRemaining(result)).toBe('71.2 W left');
    expect(describeBudget(state, result)).toBe('120 W budget less a 20% reserve (24 W)');
    expect(describePorts(result)).toBe('4 of 8 PoE ports used');
  });

  it('says how far over the available budget the load is', () => {
    const result = calculatePoe(stateAfter(...CLASS_4));
    expect(describeRemaining(result)).toBe('24 W over the available budget');
  });

  it('describes a budget with no reserve, and devices that outnumber the ports', () => {
    const state = stateAfter({
      type: 'update-switch',
      changes: { reservePercent: 0, ports: 1 },
    });
    const result = calculatePoe(state);
    expect(describeBudget(state, result)).toBe('120 W budget, no reserve');
    expect(describePorts(result)).toBe('4 devices for 1 PoE port');
  });
});

describe('buildMetricTiles', () => {
  it('shows what is left, the budget with its reserve, and the ports', () => {
    const state = createInitialPoeCalculatorState();
    expect(buildMetricTiles(state, calculatePoe(state))).toEqual([
      { label: 'Remaining', value: '71.2 W', detail: 'before the reserve' },
      { label: 'PoE budget', value: '120 W', detail: '20% reserve (24 W)' },
      { label: 'Ports', value: '4 of 8', detail: 'PoE ports used' },
    ]);
  });

  it('shows how far over, no reserve and too few ports', () => {
    const state = stateAfter(...CLASS_4, {
      type: 'update-switch',
      changes: { reservePercent: 0, ports: 2, budgetWatts: 100 },
    });
    expect(buildMetricTiles(state, calculatePoe(state))).toEqual([
      { label: 'Short by', value: '20 W', detail: null },
      { label: 'PoE budget', value: '100 W', detail: 'no reserve' },
      { label: 'Ports', value: '4 of 2', detail: 'not enough PoE ports' },
    ]);
  });
});

describe('describeProblem', () => {
  it('describes going over the budget and running short of ports', () => {
    const state = stateAfter({
      type: 'update-switch',
      changes: { budgetWatts: 20, ports: 3 },
    });
    const result = calculatePoe(state);
    expect(result.problems.map((problem) => describeProblem(problem, state, result))).toEqual([
      'Needs 24.8 W, more than the 20 W budget. Use a switch with a larger budget or split the devices across more than one.',
      '4 devices but only 3 PoE ports.',
    ]);
  });

  it('describes using the reserve', () => {
    const state = stateAfter(...CLASS_4);
    const result = calculatePoe(state);
    expect(describeProblem({ kind: 'into-reserve' }, state, result)).toBe(
      'Uses part of the 20% reserve. It fits the budget, but leaves little headroom for heaters, start-up surges or more devices.'
    );
  });

  it('says when a cable run cannot carry the device power', () => {
    const state = stateAfter({
      type: 'update-group',
      id: 'g1',
      changes: { name: 'Gate', cableLength: 1000, power: { input: 'watts', watts: 25.5 } },
    });
    const result = calculatePoe(state);
    expect(describeProblem({ kind: 'cannot-power', groupId: 'g1' }, state, result)).toBe(
      'Gate: too much power is lost in this cable run for the device to get what it needs. Shorten the run, use a higher PoE standard or a PoE extender.'
    );
  });

  it('names the group and the class it needs when ports fall short', () => {
    const state = stateAfter(
      {
        type: 'update-group',
        id: 'g1',
        changes: { name: 'PTZ', power: { input: 'watts', watts: 40 } },
      },
      { type: 'add-group' },
      { type: 'update-group', id: 'g2', changes: { power: { input: 'watts', watts: 80 } } }
    );
    const result = calculatePoe(state);
    const text = (groupId: string) =>
      describeProblem({ kind: 'port-standard', groupId }, state, result);
    expect(text('g1')).toBe('PTZ: needs class 5 (PoE++ Type 3), more than PoE+ ports supply.');
    expect(text('g2')).toBe(
      'Device group 2: needs more power than any PoE class provides, more than PoE+ ports supply.'
    );
  });

  it('gives the cable limit in the input unit', () => {
    const feet = stateAfter({ type: 'update-group', id: 'g1', changes: { cableLength: 400 } });
    const metres = poeCalculatorReducer(feet, { type: 'set-cable-length-unit', unit: 'm' });
    const problem = { kind: 'cable-too-long', groupId: 'g1' } as const;
    expect(describeProblem(problem, feet, calculatePoe(feet))).toBe(
      "Device group 1: the cable run is longer than Ethernet's 328 ft limit. Use a PoE extender or a switch closer to the devices."
    );
    expect(describeProblem(problem, metres, calculatePoe(metres))).toContain(
      "Ethernet's 100 m limit"
    );
  });

  it('names the group', () => {
    const state = poeCalculatorReducer(createInitialPoeCalculatorState(), {
      type: 'update-group',
      id: 'g1',
      changes: { power: { input: 'watts', watts: 40 } },
    });
    const result = calculatePoe(state);
    expect(describeProblem({ kind: 'port-standard', groupId: 'g1' }, state, result)).toMatch(
      /^Device group 1: /
    );
  });
});

describe('budgetSegments', () => {
  const watts = (state: PoeCalculatorState) =>
    budgetSegments(state, calculatePoe(state)).map((segment) => [segment.key, segment.value]);

  it('splits the budget into groups, free watts and the reserve', () => {
    const segments = budgetSegments(
      createInitialPoeCalculatorState(),
      calculatePoe(createInitialPoeCalculatorState())
    );
    expect(segments.map((segment) => segment.label)).toEqual(['Device group 1', 'Free', 'Reserve']);
    expect(segments[0]?.value).toBeCloseTo(24.767);
    expect(segments[1]?.value).toBeCloseTo(71.233);
    expect(segments[2]?.value).toBe(24);
    expect(segments[0]?.color).toBe('var(--group-color-0)');
  });

  it('combines the groups into one Devices segment when simplified', () => {
    const state = stateAfter({ type: 'add-group' });
    const result = calculatePoe(state);
    const segments = budgetSegments(state, result, true);
    expect(segments.map((segment) => segment.label)).toEqual(['Devices', 'Free', 'Reserve']);
    expect(segments[0]?.value).toBeCloseTo(result.totalWatts);
    expect(segments[0]?.color).toBe('var(--mantine-color-brand-6)');
  });

  it('shrinks the reserve as the load runs into it', () => {
    const state = stateAfter(...CLASS_4, {
      type: 'update-group',
      id: 'g1',
      changes: { deviceCount: 3 },
    });
    expect(watts(state)).toEqual([
      ['g1', 90],
      ['free', 6],
      ['reserve', 24],
    ]);
    const into = stateAfter(...CLASS_4, {
      type: 'update-switch',
      changes: { budgetWatts: 130 },
    });
    expect(watts(into)).toEqual([
      ['g1', 120],
      ['free', 0],
      ['reserve', 10],
    ]);
  });

  it('leaves only the groups when over budget', () => {
    const state = stateAfter(...CLASS_4, {
      type: 'update-switch',
      changes: { budgetWatts: 100 },
    });
    expect(watts(state)).toEqual([
      ['g1', 120],
      ['free', 0],
      ['reserve', 0],
    ]);
  });
});
