import { describe, expect, it } from 'vitest';
import { createCameraGroup } from '../model/defaults';
import type { CameraGroup } from '../model/schema';
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
  it('uses the override bitrate when set', () => {
    const usage = calculateCameraGroupUsage(
      group({ cameraCount: 10, bitrateOverrideMbps: 4, recordingMode: 'continuous' })
    );
    expect(usage).toEqual({
      groupId: 'g',
      bitratePerCameraMbps: 4,
      isBitrateEstimated: false,
      totalBitrateMbps: 40,
      dutyCycle: 1,
      gbPerDay: 432,
    });
  });

  it('uses the placeholder estimate when there is no override', () => {
    const usage = calculateCameraGroupUsage(
      group({
        cameraCount: 2,
        resolution: '4MP',
        codec: 'h264',
        frameRate: 30,
        sceneComplexity: 'medium',
        bitrateOverrideMbps: null,
      })
    );
    expect(usage.isBitrateEstimated).toBe(true);
    expect(usage.bitratePerCameraMbps).toBe(6);
    expect(usage.totalBitrateMbps).toBe(12);
  });

  it('scales GB/day by the motion duty cycle but not the stream bitrate', () => {
    const usage = calculateCameraGroupUsage(
      group({ cameraCount: 10, bitrateOverrideMbps: 4, recordingMode: 'motion', motionPercent: 30 })
    );
    expect(usage.dutyCycle).toBeCloseTo(0.3);
    expect(usage.gbPerDay).toBeCloseTo(129.6);
    expect(usage.totalBitrateMbps).toBe(40);
  });

  it('scales GB/day by the schedule duty cycle', () => {
    const usage = calculateCameraGroupUsage(
      group({
        cameraCount: 10,
        bitrateOverrideMbps: 4,
        recordingMode: 'schedule',
        scheduleHours: 12,
      })
    );
    expect(usage.gbPerDay).toBeCloseTo(216);
  });
});
