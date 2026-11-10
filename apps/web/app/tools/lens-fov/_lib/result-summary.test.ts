import { calculateLensFov } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialLensFovCalculatorState,
  lensFovCalculatorReducer as reduce,
  type LensFovCalculatorAction,
  type LensFovCalculatorState,
} from '../_state/lens-fov-calculator-state';
import {
  buildMetricTiles,
  buildOpticsRow,
  describeCamera,
  describeHeadline,
  describeLensComparison,
  describeNote,
  describeTarget,
  lensComparisonRows,
} from './result-summary';

function stateWith(...actions: LensFovCalculatorAction[]): LensFovCalculatorState {
  return actions.reduce(reduce, createInitialLensFovCalculatorState());
}

const defaults = stateWith();
const defaultResult = calculateLensFov(defaults);

describe('describeHeadline', () => {
  it('shows the coverage at the distance', () => {
    expect(describeHeadline(defaults, defaultResult)).toEqual({
      value: '60.3 × 33.9 ft',
      label: 'Coverage at 30 ft',
      detail: '90.3° horizontal field of view',
    });
  });

  it('shows the farthest distance for the pixel density', () => {
    const distance = stateWith({ type: 'set-solve-for', solveFor: 'distance' });
    expect(describeHeadline(distance, calculateLensFov(distance))).toEqual({
      value: '33.4 ft',
      label: 'Farthest distance for 38.1 PPF',
      detail: 'Covers 67.2 × 37.8 ft there',
    });

    const custom = stateWith(
      { type: 'set-solve-for', solveFor: 'distance' },
      { type: 'set-length-unit', unit: 'm' },
      { type: 'set-custom-density', density: 100 }
    );
    expect(describeHeadline(custom, calculateLensFov(custom)).label).toBe(
      'Farthest distance for 100 PPM'
    );
  });
});

describe('buildMetricTiles', () => {
  it('gives density in both units, the angles and pixels on a person', () => {
    expect(buildMetricTiles(defaults, defaultResult)).toEqual([
      { label: 'Pixel density', value: '42.4 PPF', detail: '139 PPM' },
      { label: 'Field of view', value: '90.3°', detail: '59° vertical' },
      { label: '6 ft person', value: '255 px', detail: 'tall in the image' },
    ]);
  });

  it('says when a person is taller than the frame', () => {
    const close = stateWith(
      { type: 'set-focal-length', focalLengthMm: 50 },
      { type: 'set-distance', distance: 10 }
    );
    expect(buildMetricTiles(close, calculateLensFov(close))[2]?.detail).toBe(
      'taller than the frame'
    );
  });
});

describe('describeCamera', () => {
  it('names the tier, sensor type and lens, or the custom sizes', () => {
    expect(describeCamera(defaults)).toBe('4MP (1440p) · 1/2.8" · 2.8 mm lens');
    const custom = stateWith(
      { type: 'set-resolution', resolution: 'custom' },
      { type: 'set-sensor', sensor: 'custom' }
    );
    expect(describeCamera(custom)).toBe('2560 × 1440 px · 5.63 × 3.17 mm sensor · 2.8 mm lens');
  });
});

describe('describeTarget', () => {
  it('names the density in the length unit', () => {
    expect(describeTarget(defaults)).toBe('38.1 PPF');
    expect(describeTarget(stateWith({ type: 'set-custom-density', density: 80 }))).toBe('80 PPF');
  });
});

describe('lensComparisonRows', () => {
  it('compares coverage and density at the distance, marking the current lens', () => {
    const rows = lensComparisonRows(defaults, defaultResult.lensComparison);
    expect(rows[0]).toEqual({
      focalLengthMm: 2.8,
      lens: '2.8 mm',
      fov: '90.3°',
      reach: '60.3 ft',
      density: '42.4 PPF',
      current: true,
    });
    expect(rows.filter((row) => row.current)).toHaveLength(1);
  });

  it("gives each lens's farthest distance when solving for distance", () => {
    const state = stateWith({ type: 'set-solve-for', solveFor: 'distance' });
    expect(lensComparisonRows(state, calculateLensFov(state).lensComparison)[0]?.reach).toBe(
      '33.4 ft'
    );
  });
});

describe('describeLensComparison', () => {
  it('names the distance when showing coverage', () => {
    expect(describeLensComparison(defaults, defaultResult)).toBe(
      'At 30 ft with this camera and sensor.'
    );
  });

  it('names the target when solving for distance', () => {
    const state = stateWith({ type: 'set-solve-for', solveFor: 'distance' });
    expect(describeLensComparison(state, calculateLensFov(state))).toBe(
      'Farthest distance for 38.1 PPF with this camera and sensor.'
    );
  });
});

describe('buildOpticsRow', () => {
  it('gives the angles as the value and the active sensor area as the detail', () => {
    expect(buildOpticsRow(defaultResult)).toEqual({
      label: 'Angles and sensor',
      value: '90.3° × 59° (98.2° diagonal)',
      detail: '5.63 × 3.17 mm active area',
    });
  });
});

describe('describeNote', () => {
  it('explains each note', () => {
    expect(describeNote('wide-angle', defaults, defaultResult)).toMatch(/barrel distortion/);
    expect(describeNote('person-taller-than-frame', defaults, defaultResult)).toMatch(
      /taller than the 33.9 ft/
    );
    expect(describeNote('sensor-cropped', defaults, defaultResult)).toMatch(/doesn't match/);
  });
});
