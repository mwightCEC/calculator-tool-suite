import { describe, expect, it } from 'vitest';
import { METRES_PER_FOOT } from '../poe/cable-loss';
import {
  calculateLensFov,
  imagePixels,
  REFERENCE_PERSON_M,
  targetPixelsPerMetre,
} from './calculate-lens-fov';
import { createDefaultLensFovInput, type LensFovInput } from './schema';

const defaults = createDefaultLensFovInput();
const calculate = (changes: Partial<LensFovInput>) => calculateLensFov({ ...defaults, ...changes });
const feet = (metres: number) => metres / METRES_PER_FOOT;

describe('imagePixels', () => {
  it('looks up a tier and passes a custom size through', () => {
    expect(imagePixels({ kind: 'preset', resolution: '5MP' })).toEqual({
      width: 2592,
      height: 1944,
    });
    expect(imagePixels({ kind: 'custom', width: 2688, height: 1520 })).toEqual({
      kind: 'custom',
      width: 2688,
      height: 1520,
    });
  });
});

describe('targetPixelsPerMetre', () => {
  it('uses the DORI table, or converts a custom density per foot', () => {
    expect(targetPixelsPerMetre({ kind: 'dori', level: 'identification' }, 'ft')).toBe(250);
    expect(targetPixelsPerMetre({ kind: 'custom', density: 80 }, 'm')).toBe(80);
    expect(targetPixelsPerMetre({ kind: 'custom', density: 76.2 }, 'ft')).toBeCloseTo(250, 10);
  });
});

describe('calculateLensFov: defaults (4MP, 1/2.8", 2.8 mm, 30 ft)', () => {
  const result = calculateLensFov(defaults);

  it('works out the angles', () => {
    expect(result.horizontalFovDeg).toBeCloseTo(90.31, 1);
    expect(result.diagonalFovDeg).toBeGreaterThan(result.horizontalFovDeg);
    expect(result.verticalFovDeg).toBeLessThan(result.horizontalFovDeg);
  });

  it('covers about 60.3 × 33.9 ft at 139 px/m, which meets Recognition', () => {
    expect(result.distanceM).toBeCloseTo(30 * METRES_PER_FOOT, 10);
    expect(feet(result.horizontalCoverageM)).toBeCloseTo(60.32, 1);
    expect(feet(result.verticalCoverageM)).toBeCloseTo(33.93, 1);
    expect(result.pixelsPerMetre).toBeCloseTo(139.23, 1);
    expect(result.verticalPixelsPerMetre).toBeCloseTo(result.pixelsPerMetre, 6);
    expect(result.doriLevel).toBe('recognition');
    expect(result.targetPixelsPerMetre).toBeNull();
  });

  it('puts about 255 px on a 6 ft person, who fits in frame', () => {
    expect(result.personHeightPx).toBeCloseTo(254.6, 0);
    expect(result.personFitsInFrame).toBe(true);
    expect(result.notes).toEqual([]);
  });

  it('gives the farthest distance for each DORI level', () => {
    expect(result.doriDistances.map((row) => row.level)).toEqual([
      'detection',
      'observation',
      'recognition',
      'identification',
    ]);
    expect(feet(result.doriDistances[2]?.distanceM ?? 0)).toBeCloseTo(33.41, 1);
    for (const row of result.doriDistances) {
      const atLevel = calculate({ distance: feet(row.distanceM) });
      expect(atLevel.pixelsPerMetre).toBeCloseTo(row.pixelsPerMetre, 8);
      expect(atLevel.doriLevel).toBe(row.level);
    }
  });

  it('compares common lenses at the same distance', () => {
    expect(result.lensComparison.map((row) => row.focalLengthMm)).toEqual([2.8, 4, 6, 8, 12, 25]);
    expect(result.lensComparison[0]).toEqual({
      focalLengthMm: 2.8,
      horizontalFovDeg: result.horizontalFovDeg,
      horizontalCoverageM: result.horizontalCoverageM,
      pixelsPerMetre: result.pixelsPerMetre,
      doriLevel: 'recognition',
      targetDistanceM: null,
    });
    expect(result.lensComparison.at(-1)?.doriLevel).toBe('identification');
  });
});

describe('calculateLensFov: solving for distance', () => {
  it('finds the farthest distance for a DORI level', () => {
    const result = calculate({
      solveFor: 'distance',
      target: { kind: 'dori', level: 'identification' },
    });
    expect(result.targetPixelsPerMetre).toBe(250);
    expect(result.pixelsPerMetre).toBeCloseTo(250, 8);
    expect(result.doriLevel).toBe('identification');
    expect(result.distanceM).toBeCloseTo(result.doriDistances[3]?.distanceM ?? 0, 10);
  });

  it('finds the farthest distance for a custom density per metre', () => {
    const result = calculate({
      solveFor: 'distance',
      target: { kind: 'custom', density: 100 },
      lengthUnit: 'm',
    });
    expect(result.pixelsPerMetre).toBeCloseTo(100, 8);
    expect(result.doriLevel).toBe('observation');
  });

  it('gives each compared lens its own farthest distance', () => {
    const result = calculate({ solveFor: 'distance' });
    const distances = result.lensComparison.map((row) => row.targetDistanceM ?? 0);
    expect(distances[0]).toBeCloseTo(result.distanceM, 10);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });
});

describe('calculateLensFov: optics', () => {
  it('narrows the view and raises density with a longer lens', () => {
    const wide = calculate({});
    const tele = calculate({ focalLengthMm: 12 });
    expect(tele.horizontalFovDeg).toBeLessThan(wide.horizontalFovDeg);
    expect(tele.horizontalCoverageM).toBeLessThan(wide.horizontalCoverageM);
    expect(tele.pixelsPerMetre).toBeGreaterThan(wide.pixelsPerMetre);
  });

  it('changes coverage but never the angles with distance', () => {
    const near = calculate({ distance: 20 });
    const far = calculate({ distance: 40 });
    expect(far.horizontalFovDeg).toBe(near.horizontalFovDeg);
    expect(far.horizontalCoverageM).toBeCloseTo(near.horizontalCoverageM * 2, 10);
    expect(far.pixelsPerMetre).toBeCloseTo(near.pixelsPerMetre / 2, 10);
  });

  it('raises density, not the field of view, with more pixels at the same shape', () => {
    const twoMp = calculate({ resolution: { kind: 'preset', resolution: '2MP' } });
    const eightMp = calculate({ resolution: { kind: 'preset', resolution: '8MP' } });
    expect(eightMp.horizontalFovDeg).toBe(twoMp.horizontalFovDeg);
    expect(eightMp.pixelsPerMetre).toBeCloseTo(twoMp.pixelsPerMetre * 2, 10);
  });

  it('reads the distance in metres when the unit is metres', () => {
    expect(calculate({ distance: 10, lengthUnit: 'm' }).distanceM).toBe(10);
  });

  it('reads below Detection far away', () => {
    expect(calculate({ distance: 500 }).doriLevel).toBeNull();
  });
});

describe('calculateLensFov: notes', () => {
  it('notes a field of view wider than 110°', () => {
    expect(calculate({ focalLengthMm: 1.6 }).notes).toEqual(['wide-angle']);
  });

  it('notes a person taller than the frame', () => {
    const result = calculate({ focalLengthMm: 50, distance: 10 });
    expect(result.verticalCoverageM).toBeLessThan(REFERENCE_PERSON_M);
    expect(result.personFitsInFrame).toBe(false);
    expect(result.notes).toEqual(['person-taller-than-frame']);
  });

  it('notes a custom sensor cropped to the image', () => {
    const result = calculate({ sensor: { kind: 'custom', widthMm: 4.8, heightMm: 3.6 } });
    expect(result.sensor).toMatchObject({ widthMm: 4.8, heightMm: 2.7, cropped: true });
    expect(result.notes).toEqual(['sensor-cropped']);
  });
});
