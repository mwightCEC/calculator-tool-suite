import { describe, expect, it } from 'vitest';
import { dutyCycle } from './duty-cycle';

const BASE = { motionPercent: 30, scheduleHours: 12 };

describe('dutyCycle', () => {
  it('is 1 for continuous recording regardless of other settings', () => {
    expect(dutyCycle({ ...BASE, recordingMode: 'continuous' })).toBe(1);
  });

  it('is motionPercent / 100 for motion recording', () => {
    expect(dutyCycle({ ...BASE, recordingMode: 'motion' })).toBeCloseTo(0.3);
    expect(dutyCycle({ ...BASE, recordingMode: 'motion', motionPercent: 100 })).toBe(1);
    expect(dutyCycle({ ...BASE, recordingMode: 'motion', motionPercent: 5 })).toBeCloseTo(0.05);
  });

  it('is hours / 24 for scheduled recording', () => {
    expect(dutyCycle({ ...BASE, recordingMode: 'schedule' })).toBe(0.5);
    expect(dutyCycle({ ...BASE, recordingMode: 'schedule', scheduleHours: 24 })).toBe(1);
    expect(dutyCycle({ ...BASE, recordingMode: 'schedule', scheduleHours: 1 })).toBeCloseTo(1 / 24);
  });
});
