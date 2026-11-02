import { describe, expect, it } from 'vitest';
import { createDefaultLensFovInput, lensFovInputSchema } from './schema';

const valid = createDefaultLensFovInput();

describe('createDefaultLensFovInput', () => {
  it('passes the schema', () => {
    expect(lensFovInputSchema.parse(valid)).toEqual(valid);
  });

  it('uses the agreed defaults', () => {
    expect(valid).toEqual({
      resolution: { kind: 'preset', resolution: '4MP' },
      sensor: { kind: 'format', format: '1/2.8' },
      focalLengthMm: 2.8,
      solveFor: 'coverage',
      distance: 30,
      target: { kind: 'dori', level: 'recognition' },
      lengthUnit: 'ft',
    });
  });
});

describe('lensFovInputSchema', () => {
  it.each([
    ['a custom resolution', { resolution: { kind: 'custom', width: 2688, height: 1520 } }],
    ['a custom sensor', { sensor: { kind: 'custom', widthMm: 5.6, heightMm: 3.15 } }],
    ['solving for distance', { solveFor: 'distance' }],
    ['a custom density', { target: { kind: 'custom', density: 80 } }],
    ['metres', { lengthUnit: 'm' }],
    ['a 0.8 mm lens', { focalLengthMm: 0.8 }],
    ['a 300 mm lens', { focalLengthMm: 300 }],
    ['a 5000 distance', { distance: 5000 }],
  ])('accepts %s', (_label, changes) => {
    expect(lensFovInputSchema.safeParse({ ...valid, ...changes }).success).toBe(true);
  });

  it.each([
    ['an unknown resolution', { resolution: { kind: 'preset', resolution: '7MP' } }],
    ['a custom width below 160 px', { resolution: { kind: 'custom', width: 100, height: 1080 } }],
    ['a fractional pixel count', { resolution: { kind: 'custom', width: 1920.5, height: 1080 } }],
    ['an unknown sensor type', { sensor: { kind: 'format', format: '1/5' } }],
    ['a custom sensor above 50 mm', { sensor: { kind: 'custom', widthMm: 51, heightMm: 3 } }],
    ['a lens below 0.8 mm', { focalLengthMm: 0.5 }],
    ['a lens above 300 mm', { focalLengthMm: 301 }],
    ['an unknown mode', { solveFor: 'angle' }],
    ['a zero distance', { distance: 0 }],
    ['a distance above 5000', { distance: 5001 }],
    ['an unknown DORI level', { target: { kind: 'dori', level: 'inspection' } }],
    ['a custom density below 1', { target: { kind: 'custom', density: 0.5 } }],
    ['a custom density above 10000', { target: { kind: 'custom', density: 10_001 } }],
    ['an unknown length unit', { lengthUnit: 'yd' }],
  ])('rejects %s', (_label, changes) => {
    expect(lensFovInputSchema.safeParse({ ...valid, ...changes }).success).toBe(false);
  });
});
