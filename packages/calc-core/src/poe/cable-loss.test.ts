import { describe, expect, it } from 'vitest';
import {
  cableLengthInMetres,
  cableLossWatts,
  poeLoopOhms,
  pairsForDeviceWatts,
  PORT_STANDARD_MIN_VOLTS,
} from './cable-loss';
import { POE_CLASS_SPECS } from './poe-classes';

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

describe('poeLoopOhms', () => {
  it('scales 12.5 Ω per 100 m and halves it on four pairs', () => {
    expect(poeLoopOhms(6, 100)).toBe(12.5);
    expect(poeLoopOhms(6, 50)).toBe(6.25);
    expect(poeLoopOhms(40, 100)).toBe(6.25);
  });
});

describe('PORT_STANDARD_MIN_VOLTS', () => {
  it('uses the 802.3af/at/bt switch-port minimums', () => {
    expect(PORT_STANDARD_MIN_VOLTS).toEqual({ af: 44, at: 50, 'bt-type3': 50, 'bt-type4': 52 });
  });
});

describe('cableLossWatts', () => {
  it('solves for the voltage lost in the cable: 25.5 W over 100 m on PoE+ loses 4.5 W', () => {
    // I = (50 − √(2500 − 1275)) ÷ 25 = 0.6 A; 0.6² × 12.5 = 4.5 W.
    expect(cableLossWatts(25.5, 100, 'at')).toBeCloseTo(4.5, 6);
  });

  it('gives 71.3 W over 100 m on four pairs at 52 V about 18.7 W', () => {
    expect(cableLossWatts(71.3, 100, 'bt-type4')).toBeCloseTo(18.74, 2);
  });

  it('stays small for a low-power device', () => {
    expect(cableLossWatts(6, 100, 'at')).toBeCloseTo(0.1917, 4);
    expect(cableLossWatts(6, 50, 'at')).toBeCloseTo(0.0928, 4);
  });

  it('is higher at the lower PoE (af) port voltage', () => {
    const af = cableLossWatts(12.95, 100, 'af');
    const at = cableLossWatts(12.95, 100, 'at');
    expect(af).toBeCloseTo(1.31, 2);
    expect(af).toBeGreaterThan(at as number);
  });

  it('reproduces the class 4–8 allocations at 100 m on their own standard', () => {
    // The standard's allocations follow from the same method: the device's maximum
    // plus the loss lands within 0.1 W of the switch-side power.
    for (const spec of POE_CLASS_SPECS.filter((s) => s.poeClass >= 4)) {
      const loss = cableLossWatts(spec.deviceWatts, 100, spec.standard) as number;
      expect(spec.deviceWatts + loss).toBeCloseTo(spec.switchWatts, 0);
    }
    expect(25.5 + (cableLossWatts(25.5, 100, 'at') as number)).toBeCloseTo(30, 6);
  });

  it('returns null when the cable cannot carry the power', () => {
    // 4 × 90 W × 6.25 Ω = 2250 > 44² = 1936.
    expect(cableLossWatts(90, 100, 'af')).toBeNull();
    // 300 m on two pairs: 4 × 25.5 W × 37.5 Ω = 3825 > 2500.
    expect(cableLossWatts(25.5, 300, 'at')).toBeNull();
  });
});
