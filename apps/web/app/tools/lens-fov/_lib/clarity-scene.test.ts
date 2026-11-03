import { calculateLensFov } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialLensFovCalculatorState,
  lensFovCalculatorReducer,
} from '../_state/lens-fov-calculator-state';
import {
  CLARITY_SCENE_SVG,
  CLARITY_SCENE_URL,
  claritySlider,
  MAX_SCENE_PIXELS,
  pixelsPerMetreAt,
  scenePixels,
} from './clarity-scene';

const defaults = calculateLensFov(createInitialLensFovCalculatorState());

describe('pixelsPerMetreAt', () => {
  it('matches the result at its own distance and falls with distance', () => {
    expect(pixelsPerMetreAt(defaults, defaults.distanceM)).toBeCloseTo(defaults.pixelsPerMetre, 10);
    expect(pixelsPerMetreAt(defaults, defaults.distanceM * 2)).toBeCloseTo(
      defaults.pixelsPerMetre / 2,
      10
    );
  });
});

describe('scenePixels', () => {
  it('covers the 2.4 × 2 m scene at the density', () => {
    // Identification, 250 px/m: 600 × 500 pixels.
    expect(scenePixels(250)).toEqual({ width: 600, height: 500 });
    // Detection, 25 px/m: 60 × 50.
    expect(scenePixels(25)).toEqual({ width: 60, height: 50 });
  });

  it('keeps at least one pixel and caps where more stops showing', () => {
    expect(scenePixels(0.01)).toEqual({ width: 1, height: 1 });
    expect(scenePixels(10_000).width).toBe(MAX_SCENE_PIXELS);
  });
});

describe('claritySlider', () => {
  it('marks each DORI level, nearest first, and runs past Detection', () => {
    const slider = claritySlider(defaults);
    expect(slider.marks.map((mark) => mark.level)).toEqual([
      'identification',
      'recognition',
      'observation',
      'detection',
    ]);
    const detection = slider.marks[3]?.distanceM ?? 0;
    expect(slider.max).toBeCloseTo(detection * 1.25, 10);
    expect(slider.min).toBeCloseTo(slider.max / 100, 10);
  });

  it('reaches past the calculator distance when that is farther', () => {
    const far = calculateLensFov(
      lensFovCalculatorReducer(createInitialLensFovCalculatorState(), {
        type: 'set-distance',
        distance: 2000,
      })
    );
    expect(claritySlider(far).max).toBeCloseTo(far.distanceM * 1.25, 10);
  });
});

describe('the drawn scene', () => {
  it('is drawn in centimetres at the stated size, with a made-up plate', () => {
    expect(CLARITY_SCENE_SVG).toContain('viewBox="0 0 240 200"');
    expect(CLARITY_SCENE_SVG).toContain('NOT A REAL PLATE');
    expect(CLARITY_SCENE_URL.startsWith('data:image/svg+xml')).toBe(true);
  });
});
