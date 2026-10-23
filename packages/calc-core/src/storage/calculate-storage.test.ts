import { describe, expect, it } from 'vitest';
import { BITRATE_MODEL } from '../bitrate/bitrate-model';
import { estimateBitrateRange } from '../bitrate/estimate-bitrate';
import { createCameraGroup, DEFAULT_STORAGE_SETTINGS } from '../model/defaults';
import type { CameraGroup, StorageCalculationInput, StorageSettings } from '../model/schema';
import { RAID_LEVELS, RESERVE_PERCENTS } from '../options';
import { minimumDrivesForCapacity } from '../raid/raid-levels';
import { isPointRange } from '../range';
import { calculateStorage, type StorageCalculationResult } from './calculate-storage';

/** 10 cameras × 4 Mbps known average, continuous = 432 GB/day = 0.432 TB/day. */
const KNOWN_432_GB_PER_DAY: CameraGroup = {
  ...createCameraGroup('a', 'Group A'),
  cameraCount: 10,
  bitrate: { source: 'known-average', mbps: 4 },
  recordingMode: 'continuous',
};

/** Same cameras, but bitrate from the model estimate (a range). */
const ESTIMATED: CameraGroup = {
  ...KNOWN_432_GB_PER_DAY,
  id: 'e',
  bitrate: { source: 'estimate' },
};

/** RAID 5 with a 10% reserve, so the tests exercise parity and reserve whatever the defaults are. */
const BASE_STORAGE: StorageSettings = {
  ...DEFAULT_STORAGE_SETTINGS,
  raidLevel: 'raid5',
  reservePercent: 10,
};

function input(
  mode: StorageCalculationInput['mode'],
  storage: Partial<StorageSettings> = {},
  cameraGroups: CameraGroup[] = [KNOWN_432_GB_PER_DAY]
): StorageCalculationInput {
  return { mode, cameraGroups, storage: { ...BASE_STORAGE, ...storage } };
}

function breakdownTotal(result: StorageCalculationResult): number {
  const { footageTbByGroup, reserveTb, parityTb, unusedTb } = result.breakdown;
  const footageTb = footageTbByGroup.reduce((sum, group) => sum + group.tb, 0);
  return footageTb + reserveTb + parityTb + unusedTb;
}

/** Estimated daily TB for the ESTIMATED group, from the data file. */
function estimatedDailyTb(bound: 'low' | 'typical' | 'high'): number {
  return (estimateBitrateRange(ESTIMATED)[bound] * ESTIMATED.cameraCount * 10.8) / 1000;
}

describe('storage needed mode, known bitrates', () => {
  // 0.432 TB/day × 30 days = 12.96 TB footage; ÷ (1 − 10%) = 14.4 TB required.
  const result = calculateStorage(
    input('storage-needed', {
      retentionDays: 30,
      driveSizeTb: 14,
      raidLevel: 'raid5',
      reservePercent: 10,
    })
  );

  it('collapses every range to a single value', () => {
    expect(result.isEstimated).toBe(false);
    expect(isPointRange(result.totalBitrateMbps)).toBe(true);
    expect(isPointRange(result.dailyWriteTb)).toBe(true);
    expect(isPointRange(result.requiredCapacityTb!)).toBe(true);
    expect(isPointRange(result.retentionDays)).toBe(true);
  });

  it('totals bitrate, daily write and required capacity', () => {
    expect(result.totalBitrateMbps.typical).toBe(40);
    expect(result.dailyWriteTb.typical).toBeCloseTo(0.432);
    expect(result.requiredCapacityTb?.typical).toBeCloseTo(14.4);
    expect(result.retentionDays.typical).toBe(30);
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
    expect(result.breakdown.footageTbByGroup).toEqual([
      { groupId: 'a', tb: expect.closeTo(12.96) },
    ]);
    expect(result.breakdown.reserveTb).toBeCloseTo(2.8);
    expect(result.breakdown.parityTb).toBe(14);
    expect(result.breakdown.unusedTb).toBeCloseTo(12.24);
    expect(breakdownTotal(result)).toBeCloseTo(42);
  });

  it('ignores the drive count input', () => {
    expect(calculateStorage(input('storage-needed', { driveCount: 12 })).drives.driveCount).toBe(3);
  });

  it('is not thrown off by floating-point noise at an exact drive boundary', () => {
    // 10 × 5 Mbps = 0.54 TB/day × 30 days ÷ 0.9 = exactly 18 TB = 3 × 6 TB.
    const exact = calculateStorage(
      input('storage-needed', { retentionDays: 30, driveSizeTb: 6, raidLevel: 'none' }, [
        { ...KNOWN_432_GB_PER_DAY, bitrate: { source: 'bitrate-cap', mbps: 5 } },
      ])
    );
    expect(exact.drives.driveCount).toBe(3);
    expect(exact.breakdown.unusedTb).toBeCloseTo(0);
  });
});

describe('storage needed mode, estimated bitrates', () => {
  const storage = {
    retentionDays: 30,
    driveSizeTb: 4,
    raidLevel: 'none',
    reservePercent: 0,
  } as const;
  const result = calculateStorage(input('storage-needed', storage, [ESTIMATED]));

  it('flags the result as estimated', () => {
    expect(result.isEstimated).toBe(true);
  });

  it('propagates the range through daily write and required capacity', () => {
    for (const bound of ['low', 'typical', 'high'] as const) {
      expect(result.dailyWriteTb[bound]).toBeCloseTo(estimatedDailyTb(bound));
      expect(result.requiredCapacityTb?.[bound]).toBeCloseTo(estimatedDailyTb(bound) * 30);
    }
    expect(result.requiredCapacityTb!.low).toBeLessThan(result.requiredCapacityTb!.high);
  });

  it('sizes the drives for the HIGH estimate', () => {
    const forHigh = minimumDrivesForCapacity('none', result.requiredCapacityTb!.high, 4);
    const forTypical = minimumDrivesForCapacity('none', result.requiredCapacityTb!.typical, 4);
    expect(result.drives.driveCount).toBe(forHigh);
    expect(forHigh).toBeGreaterThan(forTypical);
  });

  it('shows the high-estimate footage in the capacity breakdown', () => {
    expect(result.breakdown.footageTbByGroup[0]?.tb).toBeCloseTo(estimatedDailyTb('high') * 30);
    expect(breakdownTotal(result)).toBeCloseTo(result.drives.rawCapacityTb);
  });
});

describe('days from capacity mode, known bitrates', () => {
  // RAID 5, 4 × 14 TB → 42 TB usable × 0.9 = 37.8 TB ÷ 0.432 TB/day = 87.5 days.
  const result = calculateStorage(
    input('days-from-capacity', {
      driveCount: 4,
      driveSizeTb: 14,
      raidLevel: 'raid5',
      reservePercent: 10,
    })
  );

  it('floors the estimated retention days to a single value', () => {
    expect(result.retentionDays).toEqual({ low: 87, typical: 87, high: 87 });
    expect(result.requiredCapacityTb).toBeNull();
  });

  it('uses the supplied drive count', () => {
    expect(result.drives).toMatchObject({ driveCount: 4, usableCapacityTb: 42, rawCapacityTb: 56 });
  });

  it('compares retention against the target', () => {
    expect(result.meetsRetentionTarget).toBe(true);
    const shortfall = calculateStorage(
      input('days-from-capacity', { driveCount: 3, raidLevel: 'raid5', retentionDays: 90 })
    );
    expect(shortfall.retentionDays.low).toBe(58);
    expect(shortfall.meetsRetentionTarget).toBe(false);
  });

  it('rounds an invalid drive count up to the RAID minimum and step', () => {
    const raid10 = calculateStorage(
      input('days-from-capacity', { driveCount: 5, raidLevel: 'raid10' })
    );
    const raid6 = calculateStorage(
      input('days-from-capacity', { driveCount: 1, raidLevel: 'raid6' })
    );
    expect(raid10.drives.driveCount).toBe(6);
    expect(raid6.drives.driveCount).toBe(4);
  });

  it('is not thrown off by floating-point noise at an exact day boundary', () => {
    // 1 × 1 Mbps at 30% motion = 0.00324 TB/day; 3 × 6 TB × 0.9 = 16.2 TB → exactly 5000 days.
    const exact = calculateStorage(
      input(
        'days-from-capacity',
        { driveCount: 3, driveSizeTb: 6, raidLevel: 'none', reservePercent: 10 },
        [
          {
            ...KNOWN_432_GB_PER_DAY,
            cameraCount: 1,
            bitrate: { source: 'known-average', mbps: 1 },
            recordingMode: 'motion',
            motionPercent: 30,
          },
        ]
      )
    );
    expect(exact.retentionDays.typical).toBe(5000);
  });
});

describe('days from capacity mode, estimated bitrates', () => {
  const storage = {
    driveCount: 4,
    driveSizeTb: 14,
    raidLevel: 'raid5',
    reservePercent: 10,
  } as const;
  const result = calculateStorage(input('days-from-capacity', storage, [ESTIMATED]));
  const recordableTb = 42 * 0.9;

  it('derives the worst-case (low) days from the HIGH bitrate', () => {
    expect(result.retentionDays.low).toBe(Math.floor(recordableTb / estimatedDailyTb('high')));
    expect(result.retentionDays.typical).toBe(
      Math.floor(recordableTb / estimatedDailyTb('typical'))
    );
    expect(result.retentionDays.high).toBe(Math.floor(recordableTb / estimatedDailyTb('low')));
    expect(result.retentionDays.low).toBeLessThan(result.retentionDays.high);
  });

  it('checks the retention target against the worst case', () => {
    const target = result.retentionDays.low + 1;
    const withTarget = calculateStorage(
      input('days-from-capacity', { ...storage, retentionDays: target }, [ESTIMATED])
    );
    expect(withTarget.retentionDays.typical).toBeGreaterThanOrEqual(target);
    expect(withTarget.meetsRetentionTarget).toBe(false);
  });
});

describe('multiple camera groups', () => {
  const groups: CameraGroup[] = [
    KNOWN_432_GB_PER_DAY,
    {
      ...createCameraGroup('b', 'Group B'),
      cameraCount: 5,
      bitrate: { source: 'bitrate-cap', mbps: 2 },
      recordingMode: 'schedule',
      scheduleHours: 12,
    },
  ];

  it('sums bitrate and daily write across groups', () => {
    // Group B: 10 Mbps stream, 108 GB/day × 0.5 = 54 GB/day.
    const result = calculateStorage(input('storage-needed', { retentionDays: 10 }, groups));
    expect(result.groups.map((group) => group.groupId)).toEqual(['a', 'b']);
    expect(result.totalBitrateMbps.typical).toBe(50);
    expect(result.dailyWriteTb.typical).toBeCloseTo(0.486);
    expect(result.breakdown.footageTbByGroup).toEqual([
      { groupId: 'a', tb: expect.closeTo(4.32) },
      { groupId: 'b', tb: expect.closeTo(0.54) },
    ]);
  });

  it('is estimated if any one group uses the estimate', () => {
    const mixed = calculateStorage(input('storage-needed', {}, [...groups, ESTIMATED]));
    expect(mixed.isEstimated).toBe(true);
    expect(isPointRange(mixed.dailyWriteTb)).toBe(false);
  });
});

describe('capacity breakdown invariants', () => {
  it('always sums to raw capacity and never exceeds usable capacity', () => {
    for (const mode of ['storage-needed', 'days-from-capacity'] as const) {
      for (const cameraGroups of [[KNOWN_432_GB_PER_DAY], [ESTIMATED]]) {
        for (const raidLevel of RAID_LEVELS) {
          for (const reservePercent of RESERVE_PERCENTS) {
            for (const retentionDays of [1, 7, 30, 90, 365]) {
              const result = calculateStorage(
                input(
                  mode,
                  { raidLevel, reservePercent, retentionDays, driveCount: 6, driveSizeTb: 8 },
                  cameraGroups
                )
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
    }
  });
});

describe('bitrate model injection', () => {
  it('uses the supplied model for estimates', () => {
    const doubled = structuredClone(BITRATE_MODEL);
    doubled.baselineMbps['4MP'].value *= 2;
    const normal = calculateStorage(input('storage-needed', {}, [ESTIMATED]));
    const withDoubled = calculateStorage(input('storage-needed', {}, [ESTIMATED]), doubled);
    expect(withDoubled.dailyWriteTb.typical).toBeCloseTo(normal.dailyWriteTb.typical * 2);
  });
});
