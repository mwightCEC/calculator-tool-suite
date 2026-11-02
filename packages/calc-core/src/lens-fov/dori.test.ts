import { describe, expect, it } from 'vitest';
import { DORI_PIXELS_PER_METRE, doriLevelFor, pixelsPerFoot, pixelsPerMetreFromFeet } from './dori';

describe('DORI_PIXELS_PER_METRE', () => {
  it('uses the IEC 62676-4:2014 values', () => {
    expect(DORI_PIXELS_PER_METRE).toEqual({
      detection: 25,
      observation: 62.5,
      recognition: 125,
      identification: 250,
    });
  });
});

describe('doriLevelFor', () => {
  it.each([
    [0, null],
    [24.9, null],
    [25, 'detection'],
    [62.4, 'detection'],
    [62.5, 'observation'],
    [125, 'recognition'],
    [249, 'recognition'],
    [250, 'identification'],
    [1000, 'identification'],
  ])('rates %s px/m as %s', (density, level) => {
    expect(doriLevelFor(density)).toBe(level);
  });

  it('treats floating-point noise just below a level as meeting it', () => {
    expect(doriLevelFor(125 * (1 - 1e-12))).toBe('recognition');
  });
});

describe('pixels per foot', () => {
  it('converts both ways', () => {
    expect(pixelsPerFoot(250)).toBeCloseTo(76.2, 10);
    expect(pixelsPerMetreFromFeet(76.2)).toBeCloseTo(250, 10);
  });
});
