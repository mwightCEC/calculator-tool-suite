import { poeInputSchema } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import {
  convertCableLength,
  createInitialPoeCalculatorState,
  describeSwitchToSimple,
  poeCalculatorReducer as reduce,
  poeCalculatorStateSchema,
  type PoeCalculatorAction,
  type PoeCalculatorState,
} from './poe-calculator-state';

/** The default state switched to Advanced, so every setting can change. */
const initial = () =>
  reduce(createInitialPoeCalculatorState(), { type: 'set-input-mode', inputMode: 'advanced' });

/** Applies actions in order, starting from the initial Advanced state. */
function apply(...actions: PoeCalculatorAction[]): PoeCalculatorState {
  return actions.reduce(reduce, initial());
}

const ids = (state: PoeCalculatorState) => state.deviceGroups.map((group) => group.id);

describe('createInitialPoeCalculatorState', () => {
  it('starts in Simple mode with the calc-core defaults', () => {
    const state = createInitialPoeCalculatorState();
    expect(state.inputMode).toBe('simple');
    expect(poeCalculatorStateSchema.parse(state)).toEqual(state);
    expect(poeInputSchema.safeParse(state).success).toBe(true);
    expect(state.deviceGroups[0]?.colorIndex).toBe(0);
  });
});

describe('poeCalculatorStateSchema', () => {
  it('rejects a Simple state that breaks its rules', () => {
    const simple = createInitialPoeCalculatorState();
    const [group] = simple.deviceGroups;
    const withLength = { ...simple, deviceGroups: [{ ...group, cableLength: 50 }] };
    const withReserve = { ...simple, powerSource: { ...simple.powerSource, reservePercent: 0 } };
    expect(poeCalculatorStateSchema.safeParse(withLength).success).toBe(false);
    expect(poeCalculatorStateSchema.safeParse(withReserve).success).toBe(false);
  });

  it('accepts the same settings in Advanced', () => {
    const state = apply(
      { type: 'update-switch', changes: { reservePercent: 0 } },
      { type: 'update-group', id: 'g1', changes: { cableLength: 50 } }
    );
    expect(poeCalculatorStateSchema.safeParse(state).success).toBe(true);
  });
});

describe('poeCalculatorReducer', () => {
  it('keeps the same state when the mode is unchanged', () => {
    const state = initial();
    expect(reduce(state, { type: 'set-input-mode', inputMode: 'advanced' })).toBe(state);
  });

  it('updates group fields and switch settings', () => {
    const state = apply(
      { type: 'update-group', id: 'g1', changes: { deviceCount: 10, name: 'Fence' } },
      { type: 'update-switch', changes: { budgetWatts: 370, portStandard: 'bt-type3' } }
    );
    expect(state.deviceGroups[0]).toEqual(
      expect.objectContaining({ deviceCount: 10, name: 'Fence' })
    );
    expect(state.powerSource).toEqual(
      expect.objectContaining({ budgetWatts: 370, ports: 8, portStandard: 'bt-type3' })
    );
  });

  it('switches power input to that input’s default, and leaves the same input alone', () => {
    const toClass = apply({ type: 'set-power-input', id: 'g1', input: 'class' });
    expect(toClass.deviceGroups[0]?.power).toEqual({ input: 'class', poeClass: 3 });
    expect(reduce(toClass, { type: 'set-power-input', id: 'g1', input: 'class' })).toBe(toClass);
    const back = reduce(toClass, { type: 'set-power-input', id: 'g1', input: 'watts' });
    expect(back.deviceGroups[0]?.power).toEqual({ input: 'watts', watts: 6 });
  });

  it('adds, duplicates, removes and restores groups', () => {
    const added = apply({ type: 'add-group' }, { type: 'duplicate-group', id: 'g1' });
    expect(ids(added)).toEqual(['g1', 'g3', 'g2']);
    expect(added.deviceGroups[2]?.name).toBe('Camera group 2');

    const [, copy] = added.deviceGroups;
    const removed = reduce(added, { type: 'remove-group', id: 'g3' });
    expect(ids(removed)).toEqual(['g1', 'g2']);
    const restored = copy && reduce(removed, { type: 'restore-group', group: copy, index: 1 });
    expect(restored && ids(restored)).toEqual(['g1', 'g3', 'g2']);
  });

  it('stops adding at the group limit', () => {
    const actions = Array.from({ length: MAX_CAMERA_GROUPS + 2 }, () => ({
      type: 'add-group' as const,
    }));
    expect(apply(...actions).deviceGroups).toHaveLength(MAX_CAMERA_GROUPS);
  });

  it('clears to the default group, keeps the switch, and restores the previous groups', () => {
    const custom = apply({ type: 'add-group' }, { type: 'update-switch', changes: { ports: 24 } });
    const cleared = reduce(custom, { type: 'clear-groups' });
    expect(cleared.deviceGroups).toEqual(createInitialPoeCalculatorState().deviceGroups);
    expect(cleared.powerSource.ports).toBe(24);
    const restored = reduce(cleared, { type: 'restore-groups', groups: custom.deviceGroups });
    expect(restored.deviceGroups).toBe(custom.deviceGroups);
  });

  it('converts every cable length when the unit changes', () => {
    const state = apply(
      { type: 'add-group' },
      { type: 'update-group', id: 'g1', changes: { cableLength: 300 } },
      { type: 'set-cable-length-unit', unit: 'm' }
    );
    expect(state.cableLengthUnit).toBe('m');
    expect(state.deviceGroups.map((group) => group.cableLength)).toEqual([91.4, null]);
    expect(reduce(state, { type: 'set-cable-length-unit', unit: 'm' })).toBe(state);
  });

  it('loads a state and repairs neighbouring groups that share a colour', () => {
    const twoGroups = apply({ type: 'add-group' });
    const clashing = {
      ...twoGroups,
      deviceGroups: twoGroups.deviceGroups.map((group) => ({ ...group, colorIndex: 0 })),
    };
    const loaded = reduce(initial(), { type: 'load-state', state: clashing });
    const [first, second] = loaded.deviceGroups;
    expect(first?.colorIndex).not.toBe(second?.colorIndex);
  });
});

describe('Simple mode', () => {
  const advancedSetup = () =>
    apply(
      { type: 'add-group' },
      { type: 'update-group', id: 'g1', changes: { cableLength: 200 } },
      { type: 'update-switch', changes: { reservePercent: 0 } }
    );

  it('trims to the first group, clears its cable length and resets the reserve', () => {
    const simple = reduce(advancedSetup(), { type: 'set-input-mode', inputMode: 'simple' });
    expect(ids(simple)).toEqual(['g1']);
    expect(simple.deviceGroups[0]?.cableLength).toBeNull();
    expect(simple.powerSource.reservePercent).toBe(20);
    expect(poeCalculatorStateSchema.safeParse(simple).success).toBe(true);
  });

  it('keeps its rules after later actions', () => {
    const simple = reduce(createInitialPoeCalculatorState(), { type: 'add-group' });
    expect(ids(simple)).toEqual(['g1']);
    const reserve = reduce(simple, { type: 'update-switch', changes: { reservePercent: 30 } });
    expect(reserve.powerSource.reservePercent).toBe(20);
  });

  it('describes what switching to Simple changes', () => {
    expect(describeSwitchToSimple(advancedSetup())).toEqual([
      'removed 1 device group',
      'cable length cleared',
      'reserve set to 20%',
    ]);
    expect(describeSwitchToSimple(initial())).toEqual([]);
    expect(describeSwitchToSimple(createInitialPoeCalculatorState())).toEqual([]);
  });

  it('pluralises removed groups', () => {
    const three = apply({ type: 'add-group' }, { type: 'add-group' });
    expect(describeSwitchToSimple(three)).toEqual(['removed 2 device groups']);
  });
});

describe('convertCableLength', () => {
  it.each([
    [null, 'm', null],
    [100, 'ft', 328.1],
    [328, 'm', 100],
    [500, 'ft', 1000],
  ] as const)('%s converts to %s as %s', (length, unit, expected) => {
    expect(convertCableLength(length, unit)).toBe(expected);
  });
});
