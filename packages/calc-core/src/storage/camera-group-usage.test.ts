import { describe, expect, it } from 'vitest';
import { estimateBitrateRange } from '../bitrate/estimate-bitrate';
import { createCameraGroup } from '../model/defaults';
import type { CameraGroup } from '../model/schema';
import { pointRange } from '../range';
import { calculateCameraGroupUsage, mbpsToGbPerDay } from './camera-group-usage';

function group(overrides: Partial<CameraGroup>): CameraGroup {
  return { ...createCameraGroup('g', 'Group'), ...overrides };
}

describe('mbpsToGbPerDay', () => {
  it('converts 1 Mbps to 10.8 decimal GB per day', () => {
    expect(mbpsToGbPerDay(1)).toBeCloseTo(10.8);
  });
});

describe('calculateCameraGroupUsage', () => {
  it('uses a single value for a known average', () => {
    const usage = calculateCameraGroupUsage(
      group({ cameraCount: 10, bitrate: { source: 'known-average', mbps: 4 } })
    );
    expect(usage).toEqual({
      groupId: 'g',
      bitrateSource: 'known-average',
      bitratePerCameraMbps: pointRange(4),
      totalBitrateMbps: pointRange(40),
      dutyCycle: 1,
      gbPerDay: {
        low: expect.closeTo(432),
        typical: expect.closeTo(432),
        high: expect.closeTo(432),
      },
    });
  });

  it('carries the estimate range through stream bitrate and GB/day', () => {
    const estimated = group({ cameraCount: 3, bitrate: { source: 'estimate' } });
    const perCamera = estimateBitrateRange(estimated);
    const usage = calculateCameraGroupUsage(estimated);

    expect(usage.bitrateSource).toBe('estimate');
    expect(usage.bitratePerCameraMbps).toEqual(perCamera);
    for (const bound of ['low', 'typical', 'high'] as const) {
      expect(usage.totalBitrateMbps[bound]).toBeCloseTo(perCamera[bound] * 3);
      expect(usage.gbPerDay[bound]).toBeCloseTo(perCamera[bound] * 3 * 10.8);
    }
    expect(usage.gbPerDay.low).toBeLessThan(usage.gbPerDay.typical);
    expect(usage.gbPerDay.high).toBeGreaterThan(usage.gbPerDay.typical);
  });

  it('scales GB/day by the motion duty cycle but not the stream bitrate', () => {
    const usage = calculateCameraGroupUsage(
      group({
        cameraCount: 10,
        bitrate: { source: 'bitrate-cap', mbps: 4 },
        recordingMode: 'motion',
        motionPercent: 30,
      })
    );
    expect(usage.dutyCycle).toBeCloseTo(0.3);
    expect(usage.gbPerDay.typical).toBeCloseTo(129.6);
    expect(usage.totalBitrateMbps).toEqual(pointRange(40));
  });

  it('scales GB/day by the schedule duty cycle', () => {
    const usage = calculateCameraGroupUsage(
      group({
        cameraCount: 10,
        bitrate: { source: 'known-average', mbps: 4 },
        recordingMode: 'schedule',
        scheduleHours: 12,
      })
    );
    expect(usage.gbPerDay.typical).toBeCloseTo(216);
  });
});
