import { calculateLensFov, METRES_PER_FOOT } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialLensFovCalculatorState,
  lensFovCalculatorReducer as reduce,
  type LensFovCalculatorAction,
} from '../_state/lens-fov-calculator-state';
import { cameraViewLayout, coverageLayout, niceStep, PERSON_WIDTH_RATIO } from './visual-geometry';

function resultWith(...actions: LensFovCalculatorAction[]) {
  return calculateLensFov(actions.reduce(reduce, createInitialLensFovCalculatorState()));
}

const defaults = resultWith();

describe('niceStep', () => {
  it('picks the smallest 1-2-5 step within the divisions', () => {
    expect(niceStep(60, 8)).toBe(10);
    expect(niceStep(3, 8)).toBe(0.5);
    expect(niceStep(0.3, 8)).toBe(0.1);
    expect(niceStep(1e9, 8)).toBe(10_000);
  });
});

describe('cameraViewLayout', () => {
  const layout = cameraViewLayout(640, defaults, 'ft', false);

  it('draws the frame in the image shape with the coverage as its width', () => {
    expect(layout.height).toBeCloseTo(360, 6);
    const pxPerFoot = 640 / (defaults.horizontalCoverageM / METRES_PER_FOOT);
    expect(layout.person.height).toBeCloseTo(6 * pxPerFoot, 6);
    expect(layout.person.width).toBeCloseTo(layout.person.height * PERSON_WIDTH_RATIO, 6);
  });

  it('stands the person on the ground near the bottom when they fit', () => {
    expect(layout.personFits).toBe(true);
    expect(layout.person.y + layout.person.height).toBeCloseTo(layout.groundY, 6);
    expect(layout.groundY).toBeLessThan(layout.height);
  });

  it('spaces the grid in round units, centred on the person', () => {
    expect(layout.gridStep).toBe(10);
    const steps = layout.gridX.slice(1).map((x, i) => x - (layout.gridX[i] ?? 0));
    for (const step of steps) {
      expect(step).toBeCloseTo(steps[0] ?? 0, 6);
    }
    expect(layout.gridX.some((x) => Math.abs(x - 320) < 1e-6)).toBe(true);
    expect(layout.gridY[0]).toBeCloseTo(layout.groundY, 6);
  });

  it('hides the pixel grid and unit square until asked', () => {
    expect(layout.pixelX).toEqual([]);
    expect(layout.unitSquare).toBeNull();
  });

  it('draws pixel cells no smaller than 8 px and a 1 ft square', () => {
    const shown = cameraViewLayout(640, defaults, 'ft', true);
    // 2560 image pixels across 640 SVG pixels: 4 × 4 image pixels is 1 SVG pixel, so 32 per 8.
    expect(shown.cellPixels).toBe(32);
    expect(shown.pixelX.length).toBe(Math.floor(640 / 8));
    expect(shown.unitSquare?.side).toBeCloseTo(
      640 / (defaults.horizontalCoverageM / METRES_PER_FOOT),
      6
    );
  });

  it('keeps the head in frame when the person is taller than the view', () => {
    const close = resultWith(
      { type: 'set-focal-length', focalLengthMm: 50 },
      { type: 'set-distance', distance: 10 }
    );
    const tall = cameraViewLayout(640, close, 'ft', true);
    expect(tall.personFits).toBe(false);
    expect(tall.person.y).toBeGreaterThan(0);
    expect(tall.groundY).toBeGreaterThan(tall.height);
    // A 1 ft square is wider than 30% of a frame under 1 ft tall.
    expect(tall.unitSquare).toBeNull();
  });
});

describe('coverageLayout', () => {
  const layout = coverageLayout(640, defaults, 'ft');

  it('snaps the depth to a range step past the distance', () => {
    // 30 ft × 1.15 = 34.5 ft, so 40 ft; ticks every 10 ft.
    expect(layout.ticks.map((tick) => tick.value)).toEqual([10, 20, 30, 40]);
    expect(layout.ticks.at(-1)?.y).toBeCloseTo(layout.farY, 6);
  });

  it('draws the cone at its true angle', () => {
    const depth = layout.camera.y - layout.planeY;
    const halfAngle = Math.atan(layout.planeHalfWidth / depth);
    expect((halfAngle * 360) / Math.PI).toBeCloseTo(defaults.horizontalFovDeg, 6);
    expect(layout.farHalfWidth / (layout.camera.y - layout.farY)).toBeCloseTo(
      layout.planeHalfWidth / depth,
      6
    );
  });

  it('shades the DORI bands from the camera out, within the range', () => {
    // Identification to 16.7 ft, Recognition to 33.4 ft, Observation clipped at 40 ft.
    expect(layout.bands.map((band) => band.level)).toEqual([
      'identification',
      'recognition',
      'observation',
    ]);
    expect(layout.bands[0]?.points.split(' ')[0]).toBe(`${layout.camera.x},${layout.camera.y}`);
  });

  it('keeps a very wide lens within the width', () => {
    const wide = coverageLayout(
      640,
      resultWith({ type: 'set-focal-length', focalLengthMm: 1 }),
      'm'
    );
    expect(wide.farHalfWidth).toBeLessThanOrEqual(640 / 2 - 16 + 1e-6);
    expect(wide.height).toBeGreaterThanOrEqual(200);
  });

  it('covers distances past the last range step', () => {
    const far = coverageLayout(
      640,
      resultWith({ type: 'set-distance', distance: 5000 }, { type: 'set-length-unit', unit: 'm' }),
      'm'
    );
    expect(far.ticks.length).toBeGreaterThan(0);
    expect(far.bands).toHaveLength(4);
  });
});
