import { describe, expect, it } from 'vitest';
import { RAID_LEVELS, type RaidLevel } from '../options';
import {
  isValidDriveCount,
  minimumDrivesForCapacity,
  normalizeDriveCount,
  raidDriveStep,
  raidMinDrives,
  usableCapacityTb,
} from './raid-levels';

describe('RAID minimums and steps', () => {
  it.each([
    ['none', 1, 1],
    ['raid1', 2, 2],
    ['raid5', 3, 1],
    ['raid6', 4, 1],
    ['raid10', 4, 2],
  ] as const)('%s needs at least %d drives in steps of %d', (level, min, step) => {
    expect(raidMinDrives(level)).toBe(min);
    expect(raidDriveStep(level)).toBe(step);
  });
});

describe('usableCapacityTb', () => {
  it.each([
    ['none', 1, 14],
    ['none', 4, 56],
    ['raid1', 2, 14],
    ['raid1', 4, 28],
    ['raid5', 3, 28],
    ['raid5', 4, 42],
    ['raid6', 4, 28],
    ['raid6', 6, 56],
    ['raid10', 4, 28],
    ['raid10', 8, 56],
  ] as const)('%s with %d × 14 TB drives gives %d TB', (level, drives, expected) => {
    expect(usableCapacityTb(level, drives, 14)).toBe(expected);
  });
});

describe('isValidDriveCount', () => {
  it.each([
    ['none', 1, true],
    ['none', 0, false],
    ['raid1', 2, true],
    ['raid1', 3, false],
    ['raid1', 4, true],
    ['raid5', 2, false],
    ['raid5', 3, true],
    ['raid5', 7, true],
    ['raid6', 3, false],
    ['raid6', 5, true],
    ['raid10', 4, true],
    ['raid10', 5, false],
    ['raid10', 6, true],
    ['raid5', 3.5, false],
  ] as const)('%s with %d drives → %s', (level, drives, expected) => {
    expect(isValidDriveCount(level, drives)).toBe(expected);
  });
});

describe('normalizeDriveCount', () => {
  it.each([
    ['none', 0, 1],
    ['none', 5, 5],
    ['raid1', 1, 2],
    ['raid1', 3, 4],
    ['raid5', 1, 3],
    ['raid5', 5, 5],
    ['raid6', 2, 4],
    ['raid10', 5, 6],
    ['raid10', 6, 6],
  ] as const)('%s rounds %d drives up to %d', (level, drives, expected) => {
    expect(normalizeDriveCount(level, drives)).toBe(expected);
  });

  it('always returns a valid count', () => {
    for (const level of RAID_LEVELS) {
      for (let drives = 0; drives <= 20; drives++) {
        expect(isValidDriveCount(level, normalizeDriveCount(level, drives))).toBe(true);
      }
    }
  });
});

describe('minimumDrivesForCapacity', () => {
  it.each([
    ['none', 28, 2],
    ['none', 28.1, 3],
    ['raid1', 14, 2],
    ['raid1', 15, 4],
    ['raid5', 28, 3],
    ['raid5', 28.1, 4],
    ['raid6', 28, 4],
    ['raid6', 43, 6],
    ['raid10', 28, 4],
    ['raid10', 29, 6],
  ] as const)('%s needs enough 14 TB drives for %d TB → %d drives', (level, required, expected) => {
    expect(minimumDrivesForCapacity(level, required, 14)).toBe(expected);
  });

  it('returns the RAID minimum when little or no capacity is required', () => {
    for (const level of RAID_LEVELS) {
      expect(minimumDrivesForCapacity(level, 0, 14)).toBe(raidMinDrives(level));
      expect(minimumDrivesForCapacity(level, 0.5, 14)).toBe(raidMinDrives(level));
    }
  });

  it('matches a brute-force search for the smallest valid count', () => {
    const bruteForceMinimum = (level: RaidLevel, requiredTb: number, driveSizeTb: number) => {
      let drives = raidMinDrives(level);
      while (usableCapacityTb(level, drives, driveSizeTb) < requiredTb) {
        drives += raidDriveStep(level);
      }
      return drives;
    };

    for (const level of RAID_LEVELS) {
      for (let required = 1; required <= 200; required += 7) {
        expect(minimumDrivesForCapacity(level, required, 8)).toBe(
          bruteForceMinimum(level, required, 8)
        );
      }
    }
  });

  it('ignores floating-point noise just above an exact multiple', () => {
    expect(minimumDrivesForCapacity('none', 18.000000000000004, 6)).toBe(3);
  });
});
