import type { BitrateModel } from '../bitrate/bitrate-model-schema';
import type { StorageCalculationInput, StorageSettings } from '../model/schema';
import type { CalculationMode, DriveSizeTb, RaidLevel } from '../options';
import {
  minimumDrivesForCapacity,
  normalizeDriveCount,
  usableCapacityTb,
} from '../raid/raid-levels';
import { pointRange, scaleRange, sumRanges, type ValueRange } from '../range';
import { floorTolerant } from '../rounding';
import { GB_PER_TB } from '../units';
import { calculateCameraGroupUsage, type CameraGroupUsage } from './camera-group-usage';

export interface DriveArray {
  driveCount: number;
  driveSizeTb: DriveSizeTb;
  raidLevel: RaidLevel;
  rawCapacityTb: number;
  usableCapacityTb: number;
}

/**
 * How the raw drive capacity is used, in TB, at the HIGH bitrate estimate
 * (the conservative case the drives are sized for). Segments sum to `rawTb`.
 * Reserve is a share of usable capacity; parity is raw minus usable.
 */
export interface CapacityBreakdown {
  rawTb: number;
  footageTbByGroup: { groupId: string; tb: number }[];
  reserveTb: number;
  parityTb: number;
  unusedTb: number;
}

export interface StorageCalculationResult {
  mode: CalculationMode;
  groups: CameraGroupUsage[];
  /** True when any group uses the bitrate model's estimate rather than entered data. */
  isEstimated: boolean;
  /** Sum of all groups' stream bitrates in Mbps (while recording). */
  totalBitrateMbps: ValueRange;
  /** Footage written per day across all groups, in decimal TB. */
  dailyWriteTb: ValueRange;
  /**
   * Retention in days. Storage-needed mode: the target (a single value).
   * Days-from-capacity mode: `low` is the worst case (high bitrate) and is the
   * conservative headline; `high` comes from the low bitrate.
   */
  retentionDays: ValueRange;
  /** Capacity needed for the retention target including reserve (storage-needed mode only). */
  requiredCapacityTb: ValueRange | null;
  /** Storage-needed mode sizes the drives for the HIGH end of requiredCapacityTb. */
  drives: DriveArray;
  /** Whether the worst-case retention meets the retention target. */
  meetsRetentionTarget: boolean;
  breakdown: CapacityBreakdown;
}

function buildDriveArray(storage: StorageSettings, driveCount: number): DriveArray {
  return {
    driveCount,
    driveSizeTb: storage.driveSizeTb,
    raidLevel: storage.raidLevel,
    rawCapacityTb: driveCount * storage.driveSizeTb,
    usableCapacityTb: usableCapacityTb(storage.raidLevel, driveCount, storage.driveSizeTb),
  };
}

function buildCapacityBreakdown(
  groups: CameraGroupUsage[],
  drives: DriveArray,
  retentionDays: number,
  reserveFraction: number
): CapacityBreakdown {
  const footageTbByGroup = groups.map((group) => ({
    groupId: group.groupId,
    tb: (group.gbPerDay.high / GB_PER_TB) * retentionDays,
  }));
  const footageTb = footageTbByGroup.reduce((sum, group) => sum + group.tb, 0);
  const reserveTb = drives.usableCapacityTb * reserveFraction;

  return {
    rawTb: drives.rawCapacityTb,
    footageTbByGroup,
    reserveTb,
    parityTb: drives.rawCapacityTb - drives.usableCapacityTb,
    unusedTb: Math.max(0, drives.usableCapacityTb - footageTb - reserveTb),
  };
}

/** Days of footage that fit, per bitrate scenario. Higher bitrate → fewer days. */
function retentionDaysForCapacity(recordableTb: number, dailyWriteTb: ValueRange): ValueRange {
  const days = (dailyTb: number) => floorTolerant(recordableTb / dailyTb);
  return {
    low: days(dailyWriteTb.high),
    typical: days(dailyWriteTb.typical),
    high: days(dailyWriteTb.low),
  };
}

/**
 * Sizes storage for a retention target, or estimates retention from a drive count.
 * Expects input that has passed `storageCalculationInputSchema`.
 * Sizing is conservative: running out of storage is worse than having spare.
 */
export function calculateStorage(
  input: StorageCalculationInput,
  model?: BitrateModel
): StorageCalculationResult {
  const { storage } = input;
  const groups = input.cameraGroups.map((group) => calculateCameraGroupUsage(group, model));
  const totalBitrateMbps = sumRanges(groups.map((group) => group.totalBitrateMbps));
  const dailyWriteTb = scaleRange(sumRanges(groups.map((group) => group.gbPerDay)), 1 / GB_PER_TB);
  const reserveFraction = storage.reservePercent / 100;

  let drives: DriveArray;
  let retentionDays: ValueRange;
  let requiredCapacityTb: ValueRange | null = null;

  if (input.mode === 'storage-needed') {
    retentionDays = pointRange(storage.retentionDays);
    requiredCapacityTb = scaleRange(dailyWriteTb, storage.retentionDays / (1 - reserveFraction));
    const driveCount = minimumDrivesForCapacity(
      storage.raidLevel,
      requiredCapacityTb.high,
      storage.driveSizeTb
    );
    drives = buildDriveArray(storage, driveCount);
  } else {
    drives = buildDriveArray(storage, normalizeDriveCount(storage.raidLevel, storage.driveCount));
    const recordableTb = drives.usableCapacityTb * (1 - reserveFraction);
    retentionDays = retentionDaysForCapacity(recordableTb, dailyWriteTb);
  }

  return {
    mode: input.mode,
    groups,
    isEstimated: groups.some((group) => group.bitrateSource === 'estimate'),
    totalBitrateMbps,
    dailyWriteTb,
    retentionDays,
    requiredCapacityTb,
    drives,
    meetsRetentionTarget: retentionDays.low >= storage.retentionDays,
    breakdown: buildCapacityBreakdown(groups, drives, retentionDays.low, reserveFraction),
  };
}
