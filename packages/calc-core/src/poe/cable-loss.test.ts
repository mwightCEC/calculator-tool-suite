import { describe, expect, it } from 'vitest';
import { cableLengthInMetres, cableLossWatts, pairsForDeviceWatts } from './cable-loss';

describe('cableLengthInMetres', () => {
  it('keeps metres and converts feet', () => {
    expect(cableLengthInMetres(80, 'm')).toBe(80);
    expect(cableLengthInMetres(100, 'ft')).toBeCloseTo(30.48);
  });
});

describe('pairsForDeviceWatts', () => {
  it('uses two pairs up to class 4 power and four above it', () => {
    expect(pairsForDeviceWatts(25.5)).toBe(2);
    expect(pairsForDeviceWatts(25.6)).toBe(4);
  });
});

describe('cableLossWatts', () => {
  it('matches the spec example: 25.5 W over 100 m loses about 3.25 W', () => {
    expect(cableLossWatts(25.5, 100)).toBeCloseTo(3.25125);
  });

  it('scales with cable length', () => {
    expect(cableLossWatts(6, 100)).toBeCloseTo(0.18);
    expect(cableLossWatts(6, 50)).toBeCloseTo(0.09);
  });

  it('halves the resistance on four pairs', () => {
    expect(cableLossWatts(40, 100)).toBeCloseTo(4);
  });

  it('stays inside the class allocation at 100 m', () => {
    expect(25.5 + cableLossWatts(25.5, 100)).toBeLessThan(30);
    expect(40 + cableLossWatts(40, 100)).toBeLessThan(45);
  });
});
