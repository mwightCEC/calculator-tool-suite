import { describe, expect, it } from 'vitest';
import {
  convertDensity,
  convertDistance,
  createInitialLensFovCalculatorState,
  lensFovCalculatorReducer as reduce,
  lensFovCalculatorStateSchema,
  levelDensity,
  type LensFovCalculatorAction,
  type LensFovCalculatorState,
} from './lens-fov-calculator-state';

const initial = createInitialLensFovCalculatorState;

/** Applies actions in order, starting from the initial state. */
function apply(...actions: LensFovCalculatorAction[]): LensFovCalculatorState {
  return actions.reduce(reduce, initial());
}

describe('createInitialLensFovCalculatorState', () => {
  it('starts with the calc-core defaults', () => {
    const state = initial();
    expect(lensFovCalculatorStateSchema.parse(state)).toEqual(state);
    expect(state.resolution).toEqual({ kind: 'preset', resolution: '4MP' });
    expect(state.lengthUnit).toBe('ft');
  });
});

describe('resolution', () => {
  it('picks a tier', () => {
    expect(apply({ type: 'set-resolution', resolution: '8MP' }).resolution).toEqual({
      kind: 'preset',
      resolution: '8MP',
    });
  });

  it('starts a custom size from the current tier and edits it', () => {
    const state = apply(
      { type: 'set-resolution', resolution: 'custom' },
      { type: 'set-custom-resolution', changes: { width: 2688 } }
    );
    expect(state.resolution).toEqual({ kind: 'custom', width: 2688, height: 1440 });
    expect(reduce(state, { type: 'set-resolution', resolution: 'custom' })).toBe(state);
  });

  it('ignores custom size edits while a tier is picked', () => {
    const state = initial();
    expect(reduce(state, { type: 'set-custom-resolution', changes: { width: 2688 } })).toBe(state);
  });
});

describe('sensor', () => {
  it('picks a type', () => {
    expect(apply({ type: 'set-sensor', sensor: '1/1.8' }).sensor).toEqual({
      kind: 'format',
      format: '1/1.8',
    });
  });

  it("starts a custom sensor from the type's active area and edits it", () => {
    const state = apply({ type: 'set-sensor', sensor: 'custom' });
    // 1/2.8" (6.46 mm diagonal) at 16:9.
    expect(state.sensor).toEqual({ kind: 'custom', widthMm: 5.63, heightMm: 3.17 });
    const edited = reduce(state, { type: 'set-custom-sensor', changes: { heightMm: 4.2 } });
    expect(edited.sensor).toEqual({ kind: 'custom', widthMm: 5.63, heightMm: 4.2 });
    expect(reduce(edited, { type: 'set-sensor', sensor: 'custom' }).sensor).toEqual(edited.sensor);
  });

  it('ignores custom sensor edits while a type is picked', () => {
    const state = initial();
    expect(reduce(state, { type: 'set-custom-sensor', changes: { widthMm: 5 } })).toBe(state);
  });
});

describe('lens, mode, distance and target', () => {
  it('sets each field', () => {
    const state = apply(
      { type: 'set-focal-length', focalLengthMm: 6 },
      { type: 'set-solve-for', solveFor: 'distance' },
      { type: 'set-distance', distance: 45 },
      { type: 'set-custom-density', density: 80 }
    );
    expect(state).toMatchObject({
      focalLengthMm: 6,
      solveFor: 'distance',
      distance: 45,
      target: { kind: 'custom', density: 80 },
    });
  });

  it('restores a loaded state as is', () => {
    const loaded = { ...initial(), focalLengthMm: 12 };
    expect(reduce(initial(), { type: 'load-state', state: loaded })).toBe(loaded);
  });
});

describe('levelDensity', () => {
  it("gives a published level's density per foot, rounded, or per metre", () => {
    expect(levelDensity('recognition', 'ft')).toBe(38.1);
    expect(levelDensity('recognition', 'm')).toBe(125);
    expect(levelDensity('detection', 'ft')).toBe(7.6);
  });
});

describe('length unit', () => {
  it('converts the distance and a custom density', () => {
    const state = apply(
      { type: 'set-custom-density', density: 76.2 },
      { type: 'set-length-unit', unit: 'm' }
    );
    expect(state.lengthUnit).toBe('m');
    expect(state.distance).toBe(9.1);
    expect(state.target).toEqual({ kind: 'custom', density: 250 });
  });

  it('ignores the unit already in use', () => {
    const state = initial();
    expect(reduce(state, { type: 'set-length-unit', unit: 'ft' })).toBe(state);
  });

  it('keeps converted values within range', () => {
    expect(convertDistance(5000, 'ft')).toBe(5000);
    expect(convertDistance(0.1, 'm')).toBe(0.1);
    expect(convertDensity(1, 'ft')).toBe(1);
    expect(convertDensity(10_000, 'm')).toBe(10_000);
  });
});
