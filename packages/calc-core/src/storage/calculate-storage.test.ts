import { describe, expect, it } from 'vitest';
import { createCameraGroup, DEFAULT_STORAGE_SETTINGS } from '../model/defaults';
import type { CameraGroup, StorageCalculationInput, StorageSettings } from '../model/schema';
import { RAID_LEVELS, RESERVE_PERCENTS } from '../options';
import { calculateStorage, type StorageCalculationResult } from './calculate-storage';

/** 10 cameras × 4 Mbps continuous = 432 GB/day = 0.432 TB/day. */
const GROUP_432_GB_PER_DAY: CameraGroup = {
  ...createCameraGroup('a', 'Group A'),
  cameraCount: 10,
  bitrateOverrideMbps: 4,
  recordingMode: 'continuous',
};

function input(
  mode: StorageCalculationInput['mode'],
  storage: Partial<StorageSettings> = {},
  cameraGroups: CameraGroup[] = [GROUP_432_GB_PER_DAY]
): StorageCalculationInput {
  return { mode, cameraGroups, storage: { ...DEFAULT_STORAGE_SETTINGS, ...storage } };
}

function breakdownTotal(result: StorageCalculationResult): number {
  const { footageTbByGroup, reserveTb, parityTb, unusedTb } = result.breakdown;
  return (
    footageTbByGroup.reduce((sum, group) => sum + group.tb, 0) + reserveTb + parityTb + unusedTb
  );
}

describe('calculateStorage — storage needed mode', () => {
  // 0.432 TB/day × 30 days = 12.96 TB footage; ÷ (1 − 10%) = 14.4 TB required.
  const result = calculateStorage(
    input('storage-needed', {
      retentionDays: 30,
      driveSizeTb: 14,
      raidLevel: 'raid5',
      reservePercent: 10,
    })
  );

  it('totals bitrate and daily write', () => {
    expect(result.totalBitrateMbps).toBe(40);
    expect(result.dailyWriteTb).toBeCloseTo(0.432);
  });

  it('computes required capacity including reserve', () => {
    expect(result.requiredCapacityTb).toBeCloseTo(14.4);
    expect(result.retentionDays).toBe(30);
    expect(result.meetsRetentionTarget).toBe(true);
  });

  it('picks the minimum valid drive count with enough usable capacity', () => {
    expect(result.drives).toEqual({
      driveCount: 3,
      driveSizeTb: 14,
      raidLevel: 'raid5',
      rawCapacityTb: 42,
      usableCapacityTb: 28,
    });
  });

  it('breaks raw capacity into footage, reserve, parity and unused', () => {
    expect(result.breakdown.rawTb).toBe(42);
    expect(result.breakdown.footageTbByGroup).toEqual([
      { groupId: 'a', tb: expect.closeTo(12.96) },
    ]);
    expect(result.breakdown.reserveTb).toBeCloseTo(2.8);
    expect(result.breakdown.parityTb).toBe(14);
    expect(result.breakdown.unusedTb).toBeCloseTo(12.24);
    expect(breakdownTotal(result)).toBeCloseTo(42);
  });

  it('ignores the drive count input', () => {
    const withDifferentDriveCount = calculateStorage(
      input('storage-needed', { retentionDays: 30, driveCount: 12 })
    );
    expect(withDifferentDriveCount.drives.driveCount).toBe(3);
  });

  it('is not thrown off by floating-point noise at an exact drive boundary', () => {
    // 10 × 5 Mbps = 0.54 TB/day × 30 days ÷ 0.9 = exactly 18 TB = 3 × 6 TB.
    const result18 = calculateStorage(
      input('storage-needed', { retentionDays: 30, driveSizeTb: 6, raidLevel: 'none' }, [
        { ...GROUP_432_GB_PER_DAY, bitrateOverrideMbps: 5 },
      ])
    );
    expect(result18.drives.driveCount).toBe(3);
    expect(result18.breakdown.unusedTb).toBeCloseTo(0);
  });
});

describe('calculateStorage — days from capacity mode', () => {
  // RAID 5, 4 × 14 TB → 42 TB usable × 0.9 = 37.8 TB ÷ 0.432 TB/day = 87.5 days.
  const result = calculateStorage(
    input('days-from-capacity', {
      driveCount: 4,
      driveSizeTb: 14,
      raidLevel: 'raid5',
      reservePercent: 10,
    })
  );

  it('floors the estimated retention days', () => {
    expect(result.retentionDays).toBe(87);
    expect(result.requiredCapacityTb).toBeNull();
  });

  it('uses the supplied drive count', () => {
    expect(result.drives.driveCount).toBe(4);
    expect(result.drives.usableCapacityTb).toBe(42);
    expect(result.drives.rawCapacityTb).toBe(56);
  });

  it('compares the estimate against the retention target', () => {
    expect(result.meetsRetentionTarget).toBe(true);
    const shortfall = calculateStorage(
      input('days-from-capacity', { driveCount: 3, raidLevel: 'raid5', retentionDays: 90 })
    );
    expect(shortfall.retentionDays).toBe(58);
    expect(shortfall.meetsRetentionTarget).toBe(false);
  });

  it('rounds an invalid drive count up to the RAID minimum and step', () => {
    expect(
      calculateStorage(input('days-from-capacity', { driveCount: 5, raidLevel: 'raid10' })).drives
        .driveCount
    ).toBe(6);
    expect(
      calculateStorage(input('days-from-capacity', { driveCount: 1, raidLevel: 'raid6' })).drives
        .driveCount
    ).toBe(4);
  });

  it('is not thrown off by floating-point noise at an exact day boundary', () => {
    // 1 × 1 Mbps at 30% motion = 0.00324 TB/day; 3 × 6 TB × 0.9 = 16.2 TB → exactly 5000 days.
    const exact = calculateStorage(
      input(
        'days-from-capacity',
        { driveCount: 3, driveSizeTb: 6, raidLevel: 'none', reservePercent: 10 },
        [
          {
            ...GROUP_432_GB_PER_DAY,
            cameraCount: 1,
            bitrateOverrideMbps: 1,
            recordingMode: 'motion',
            motionPercent: 30,
          },
        ]
      )
    );
    expect(exact.retentionDays).toBe(5000);
  });
});

describe('calculateStorage — multiple camera groups', () => {
  const groups: CameraGroup[] = [
    GROUP_432_GB_PER_DAY,
    {
      ...createCameraGroup('b', 'Group B'),
      cameraCount: 5,
      bitrateOverrideMbps: 2,
      recordingMode: 'schedule',
      scheduleHours: 12,
    },
  ];
  const result = calculateStorage(input('storage-needed', { retentionDays: 10 }, groups));

  it('sums bitrate and daily write across groups', () => {
    // Group B: 10 Mbps stream, 108 GB/day × 0.5 = 54 GB/day.
    expect(result.groups.map((group) => group.groupId)).toEqual(['a', 'b']);
    expect(result.totalBitrateMbps).toBe(50);
    expect(result.dailyWriteTb).toBeCloseTo(0.486);
  });

  it('reports footage per group in input order', () => {
    expect(result.breakdown.footageTbByGroup).toEqual([
      { groupId: 'a', tb: expect.closeTo(4.32) },
      { groupId: 'b', tb: expect.closeTo(0.54) },
    ]);
  });
});

describe('calculateStorage — capacity breakdown invariants', () => {
  it('always sums to raw capacity and never exceeds usable capacity', () => {
    for (const mode of ['storage-needed', 'days-from-capacity'] as const) {
      for (const raidLevel of RAID_LEVELS) {
        for (const reservePercent of RESERVE_PERCENTS) {
          for (const retentionDays of [1, 7, 30, 90, 365]) {
            const result = calculateStorage(
              input(mode, {
                raidLevel,
                reservePercent,
                retentionDays,
                driveCount: 6,
                driveSizeTb: 8,
              })
            );
            const footageTb = result.breakdown.footageTbByGroup.reduce((sum, g) => sum + g.tb, 0);
            expect(breakdownTotal(result)).toBeCloseTo(result.drives.rawCapacityTb, 6);
            expect(footageTb + result.breakdown.reserveTb).toBeLessThanOrEqual(
              result.drives.usableCapacityTb + 1e-9
            );
          }
        }
      }
    }
  });
});
