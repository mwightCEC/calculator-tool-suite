import { describe, expect, it } from 'vitest';
import {
  awgAreaMm2,
  gaugesInSystem,
  loopOhms,
  ohmsPerMetre,
  WIRE_GAUGE_SPECS,
  wireGaugeSpec,
} from './wire-gauges';

describe('awgAreaMm2', () => {
  it.each([
    [10, 5.261],
    [18, 0.8231],
    [24, 0.2047],
  ])('AWG %d is about %d mm²', (awg, area) => {
    expect(awgAreaMm2(awg)).toBeCloseTo(area, 3);
  });
});

describe('wireGaugeSpec', () => {
  it('reads the system and size from the id', () => {
    expect(wireGaugeSpec('mm2-0.75')).toEqual({ gauge: 'mm2-0.75', system: 'mm2', areaMm2: 0.75 });
    expect(wireGaugeSpec('awg-18')).toEqual({
      gauge: 'awg-18',
      system: 'awg',
      areaMm2: expect.closeTo(0.8231, 3),
    });
  });

  it('lists each system thinnest first', () => {
    for (const system of ['awg', 'mm2'] as const) {
      const areas = WIRE_GAUGE_SPECS.filter((spec) => spec.system === system).map(
        (spec) => spec.areaMm2
      );
      expect(areas).toEqual([...areas].sort((a, b) => a - b));
    }
  });
});

describe('gaugesInSystem', () => {
  it('returns one system, thinnest first', () => {
    expect(gaugesInSystem('awg')).toEqual([
      'awg-24',
      'awg-22',
      'awg-20',
      'awg-18',
      'awg-16',
      'awg-14',
      'awg-12',
      'awg-10',
    ]);
    expect(gaugesInSystem('mm2')[0]).toBe('mm2-0.5');
  });
});

describe('ohmsPerMetre', () => {
  it.each([
    ['awg-18', 20.95],
    ['awg-16', 13.17],
    ['awg-10', 3.277],
    ['mm2-1.5', 11.49],
  ] as const)('%s matches published copper tables (%d Ω/km at 20 °C)', (gauge, ohmsPerKm) => {
    expect(ohmsPerMetre(gauge) * 1000).toBeCloseTo(ohmsPerKm, 1);
  });
});

describe('loopOhms', () => {
  it('counts the run out and back', () => {
    expect(loopOhms('awg-18', 100)).toBeCloseTo(2 * 100 * ohmsPerMetre('awg-18'));
  });
});
