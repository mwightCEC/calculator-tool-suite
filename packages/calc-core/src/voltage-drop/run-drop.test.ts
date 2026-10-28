import { describe, expect, it } from 'vitest';
import { maxLoopOhms, runCurrent } from './run-drop';

describe('runCurrent', () => {
  it('keeps a constant-current load whatever the cable', () => {
    expect(runCurrent({ input: 'amps', amps: 0.5 }, 12, 3)).toBe(0.5);
  });

  it('draws more than P / V from a constant-power load so the device still gets P', () => {
    const amps = runCurrent({ input: 'watts', watts: 6 }, 12, 1);
    expect(amps).toBeCloseTo(0.52277);
    expect((12 - (amps ?? 0) * 1) * (amps ?? 0)).toBeCloseTo(6);
  });

  it('is P / V on a run with no resistance', () => {
    expect(runCurrent({ input: 'watts', watts: 6 }, 12, 0)).toBeCloseTo(0.5);
  });

  it('is null when the run cannot deliver the power', () => {
    expect(runCurrent({ input: 'watts', watts: 40 }, 12, 1)).toBeNull();
  });
});

describe('maxLoopOhms', () => {
  it('is V × f / I for a constant-current load', () => {
    expect(maxLoopOhms({ input: 'amps', amps: 0.5 }, 12, 0.1)).toBeCloseTo(2.4);
  });

  it('is V² f (1 − f) / P for a constant-power load', () => {
    expect(maxLoopOhms({ input: 'watts', watts: 6 }, 12, 0.1)).toBeCloseTo(2.16);
  });

  it('gives exactly the limit when the run is that resistance', () => {
    const load = { input: 'watts', watts: 6 } as const;
    const ohms = maxLoopOhms(load, 12, 0.1);
    expect((runCurrent(load, 12, ohms) ?? 0) * ohms).toBeCloseTo(1.2);
  });
});
