import { voltageDropInputSchema } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import {
  convertRunLength,
  createInitialVoltageDropCalculatorState,
  hasCustomGroups,
  supplyPresetIndex,
  voltageDropCalculatorReducer as reduce,
  voltageDropCalculatorStateSchema,
  type VoltageDropCalculatorAction,
  type VoltageDropCalculatorState,
} from './voltage-drop-calculator-state';

const initial = createInitialVoltageDropCalculatorState;

/** Applies actions in order, starting from the initial state. */
function apply(...actions: VoltageDropCalculatorAction[]): VoltageDropCalculatorState {
  return actions.reduce(reduce, initial());
}

const ids = (state: VoltageDropCalculatorState) => state.deviceGroups.map((group) => group.id);
const first = (state: VoltageDropCalculatorState) => state.deviceGroups[0];

describe('createInitialVoltageDropCalculatorState', () => {
  it('starts with the calc-core defaults', () => {
    const state = createInitialVoltageDropCalculatorState();
    expect(voltageDropCalculatorStateSchema.parse(state)).toEqual(state);
    expect(voltageDropInputSchema.safeParse(state).success).toBe(true);
    expect(first(state)?.colorIndex).toBe(0);
  });
});

describe('voltageDropCalculatorStateSchema', () => {
  const initialState = createInitialVoltageDropCalculatorState();

  it('accepts several groups, a custom supply and any reserve or drop limit', () => {
    const state = apply(
      { type: 'add-group' },
      { type: 'update-supply', changes: { volts: 13.8, reservePercent: 0 } },
      { type: 'set-drop-limit', dropLimitPercent: 5 }
    );
    expect(voltageDropCalculatorStateSchema.safeParse(state).success).toBe(true);
  });

  it('rejects a wire size from the other system', () => {
    expect(
      voltageDropCalculatorStateSchema.safeParse({ ...initialState, wireSystem: 'mm2' }).success
    ).toBe(false);
  });
});

describe('supplyPresetIndex', () => {
  it('finds the presets and nothing else', () => {
    expect(supplyPresetIndex({ kind: 'dc', volts: 12 })).toBe(0);
    expect(supplyPresetIndex({ kind: 'ac', volts: 24 })).toBe(2);
    expect(supplyPresetIndex({ kind: 'ac', volts: 12 })).toBeUndefined();
  });
});

describe('convertRunLength', () => {
  it('converts to one decimal and keeps within range', () => {
    expect(convertRunLength(100, 'm')).toBe(30.5);
    expect(convertRunLength(30.5, 'ft')).toBe(100.1);
    expect(convertRunLength(0.1, 'm')).toBe(0.1);
    expect(convertRunLength(5000, 'ft')).toBe(5000);
  });
});

describe('voltageDropCalculatorReducer', () => {
  it('updates a group and switches its load input to the defaults', () => {
    const state = apply(
      { type: 'update-group', id: 'g1', changes: { deviceCount: 6, gauge: 'awg-16' } },
      { type: 'set-load-input', id: 'g1', input: 'watts' }
    );
    expect(first(state)).toEqual(
      expect.objectContaining({
        deviceCount: 6,
        gauge: 'awg-16',
        load: { input: 'watts', watts: 6 },
      })
    );
    expect(reduce(state, { type: 'set-load-input', id: 'g1', input: 'watts' })).toBe(state);
    const back = reduce(state, { type: 'set-load-input', id: 'g1', input: 'amps' });
    expect(first(back)?.load).toEqual({ input: 'amps', amps: 0.5 });
  });

  it('adds, duplicates, removes and restores groups', () => {
    // New groups go at the top; a copy goes just after its source.
    const added = apply({ type: 'add-group' }, { type: 'duplicate-group', id: 'g1' });
    expect(ids(added)).toEqual(['g2', 'g1', 'g3']);
    const removed = reduce(added, { type: 'remove-group', id: 'g3' });
    expect(ids(removed)).toEqual(['g2', 'g1']);
    const group = added.deviceGroups[2]!;
    expect(ids(reduce(removed, { type: 'restore-group', group, index: 2 }))).toEqual(ids(added));
  });

  it('adds new groups in the current wire system and length unit', () => {
    const state = apply(
      { type: 'set-wire-system', wireSystem: 'mm2' },
      { type: 'set-cable-length-unit', unit: 'm' },
      { type: 'add-group' }
    );
    expect(first(state)).toEqual(expect.objectContaining({ gauge: 'mm2-0.75', cableLength: 30.5 }));
    expect(voltageDropCalculatorStateSchema.safeParse(state).success).toBe(true);
  });

  it('stops adding at the group limit', () => {
    const adds = Array.from(
      { length: MAX_CAMERA_GROUPS + 2 },
      () => ({ type: 'add-group' }) as const
    );
    expect(apply(...adds).deviceGroups).toHaveLength(MAX_CAMERA_GROUPS);
  });

  it('clears to one default group, keeping the supply and units', () => {
    const state = apply(
      { type: 'update-supply', changes: { ratedAmps: 10 } },
      { type: 'set-wire-system', wireSystem: 'mm2' },
      { type: 'add-group' },
      { type: 'clear-groups' }
    );
    expect(ids(state)).toEqual(['g1']);
    expect(first(state)?.gauge).toBe('mm2-0.75');
    expect(state.powerSupply.ratedAmps).toBe(10);
    expect(hasCustomGroups(state)).toBe(false);
  });

  it('restores a cleared group list', () => {
    const before = apply({ type: 'add-group' });
    const restored = reduce(reduce(before, { type: 'clear-groups' }), {
      type: 'restore-groups',
      groups: before.deviceGroups,
    });
    expect(restored.deviceGroups).toBe(before.deviceGroups);
  });

  it('reports custom groups', () => {
    expect(hasCustomGroups(initial())).toBe(false);
    expect(
      hasCustomGroups(apply({ type: 'update-group', id: 'g1', changes: { cableLength: 50 } }))
    ).toBe(true);
  });

  it('sets the supply and drop limit', () => {
    const state = apply(
      { type: 'update-supply', changes: { kind: 'ac', volts: 24, ratedAmps: 4.2 } },
      { type: 'set-drop-limit', dropLimitPercent: 15 }
    );
    expect(state.powerSupply).toEqual({
      kind: 'ac',
      volts: 24,
      ratedAmps: 4.2,
      reservePercent: 20,
    });
    expect(state.dropLimitPercent).toBe(15);
  });

  it('converts every group when the wire system changes', () => {
    const state = apply(
      { type: 'add-group' },
      { type: 'update-group', id: 'g2', changes: { gauge: 'awg-14' } },
      { type: 'set-wire-system', wireSystem: 'mm2' }
    );
    expect(state.deviceGroups.map((group) => group.gauge)).toEqual(['mm2-2.5', 'mm2-0.75']);
    expect(reduce(state, { type: 'set-wire-system', wireSystem: 'mm2' })).toBe(state);
  });

  it('converts every run when the length unit changes', () => {
    const state = apply({ type: 'set-cable-length-unit', unit: 'm' });
    expect(first(state)?.cableLength).toBe(30.5);
    expect(reduce(state, { type: 'set-cable-length-unit', unit: 'm' })).toBe(state);
  });

  it('repairs neighbouring colours when loading a state', () => {
    const state = apply({ type: 'add-group' });
    const clashing = {
      ...state,
      deviceGroups: state.deviceGroups.map((group) => ({ ...group, colorIndex: 0 })),
    };
    const loaded = reduce(state, { type: 'load-state', state: clashing });
    expect(loaded.deviceGroups[1]?.colorIndex).not.toBe(0);
  });
});
