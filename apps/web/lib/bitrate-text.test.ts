import { describe, expect, it } from 'vitest';
import { describeBitrateHint, describeBitrateShort, describeEstimateWorking } from './bitrate-text';

const range = { low: 2.38, typical: 3.4, high: 4.42 };

describe('describeBitrateShort', () => {
  it('marks an estimate as approximate', () => {
    expect(describeBitrateShort({ source: 'estimate' }, range)).toBe('~3.4 Mbps est.');
  });

  it('shows an entered bitrate as it is', () => {
    expect(describeBitrateShort({ source: 'manual', mbps: 8 }, range)).toBe('8 Mbps');
  });
});

describe('describeBitrateHint', () => {
  it('names the source and the per-camera bitrate', () => {
    expect(describeBitrateHint({ source: 'estimate' }, range)).toBe(
      'bitrate: Estimated – ~3.4 Mbps'
    );
    expect(describeBitrateHint({ source: 'manual', mbps: 2 }, range)).toBe(
      'bitrate: Manual – 2 Mbps'
    );
  });
});

describe('describeEstimateWorking', () => {
  it('formats every part with the range precision', () => {
    const breakdown = { streamMbps: 5.666, sceneMultiplier: 0.6, typicalMbps: 3.4 };
    expect(describeEstimateWorking(breakdown, range)).toEqual({
      stream: '5.7 Mbps',
      multiplier: '0.6',
      typical: '3.4 Mbps',
      likely: 'likely 2.4–4.4 Mbps',
    });
  });

  it('drops trailing zeros from the multiplier', () => {
    const breakdown = { streamMbps: 3.4, sceneMultiplier: 1, typicalMbps: 3.4 };
    expect(describeEstimateWorking(breakdown, range).multiplier).toBe('1');
  });
});
