import type { RaidLevel } from '../options';
import { ceilTolerant } from '../rounding';

interface RaidSpec {
  minDrives: number;
  /** Valid drive counts are minDrives, minDrives + step, minDrives + 2·step, … */
  driveStep: number;
  /** Number of drives' worth of capacity used for redundancy in an n-drive array. */
  redundancyDrives: (driveCount: number) => number;
  /** Smallest drive count (before min/step rules) that stores `dataDrives` drives of data. */
  drivesForDataDrives: (dataDrives: number) => number;
}

const RAID_SPECS: Record<RaidLevel, RaidSpec> = {
  none: {
    minDrives: 1,
    driveStep: 1,
    redundancyDrives: () => 0,
    drivesForDataDrives: (d) => d,
  },
  raid1: {
    minDrives: 2,
    driveStep: 2,
    redundancyDrives: (n) => n / 2,
    drivesForDataDrives: (d) => d * 2,
  },
  raid5: {
    minDrives: 3,
    driveStep: 1,
    redundancyDrives: () => 1,
    drivesForDataDrives: (d) => d + 1,
  },
  raid6: {
    minDrives: 4,
    driveStep: 1,
    redundancyDrives: () => 2,
    drivesForDataDrives: (d) => d + 2,
  },
  raid10: {
    minDrives: 4,
    driveStep: 2,
    redundancyDrives: (n) => n / 2,
    drivesForDataDrives: (d) => d * 2,
  },
};

export function raidMinDrives(level: RaidLevel): number {
  return RAID_SPECS[level].minDrives;
}

export function raidDriveStep(level: RaidLevel): number {
  return RAID_SPECS[level].driveStep;
}

export function isValidDriveCount(level: RaidLevel, driveCount: number): boolean {
  const { minDrives, driveStep } = RAID_SPECS[level];
  return (
    Number.isInteger(driveCount) &&
    driveCount >= minDrives &&
    (driveCount - minDrives) % driveStep === 0
  );
}

/** Rounds a drive count up to the nearest count the RAID level allows. */
export function normalizeDriveCount(level: RaidLevel, driveCount: number): number {
  const { minDrives, driveStep } = RAID_SPECS[level];
  if (driveCount <= minDrives) {
    return minDrives;
  }
  return minDrives + Math.ceil((driveCount - minDrives) / driveStep) * driveStep;
}

/** Usable (post-redundancy) capacity in TB. Expects a valid drive count. */
export function usableCapacityTb(
  level: RaidLevel,
  driveCount: number,
  driveSizeTb: number
): number {
  const redundancy = RAID_SPECS[level].redundancyDrives(driveCount);
  return (driveCount - redundancy) * driveSizeTb;
}

/** Smallest valid drive count whose usable capacity is at least `requiredTb`. */
export function minimumDrivesForCapacity(
  level: RaidLevel,
  requiredTb: number,
  driveSizeTb: number
): number {
  const dataDrives = Math.max(0, ceilTolerant(requiredTb / driveSizeTb));
  return normalizeDriveCount(level, RAID_SPECS[level].drivesForDataDrives(dataDrives));
}
