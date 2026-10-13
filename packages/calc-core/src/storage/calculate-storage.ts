import type { StorageCalculationInput, StorageSettings } from '../model/schema';
import type { CalculationMode, DriveSizeTb, RaidLevel } from '../options';
import {
  minimumDrivesForCapacity,
  normalizeDriveCount,
  usableCapacityTb,
} from '../raid/raid-levels';
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
 * How the raw drive capacity is used, in TB. Segments sum to `rawTb`.
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
  /** Sum of all groups' stream bitrates in Mbps (while recording). */
  totalBitrateMbps: number;
  /** Footage written per day across all groups, in decimal TB. */
  dailyWriteTb: number;
  /** Retention the result is based on: the target, or the estimate from capacity. */
  retentionDays: number;
  /** Capacity needed for the retention target including reserve (storage-needed mode only). */
  requiredCapacityTb: number | null;
  drives: DriveArray;
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
    tb: (group.gbPerDay / GB_PER_TB) * retentionDays,
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

/**
 * Sizes storage for a retention target, or estimates retention from a drive count.
 * Expects input that has passed `storageCalculationInputSchema`.
 */
export function calculateStorage(input: StorageCalculationInput): StorageCalculationResult {
  const { storage } = input;
  const groups = input.cameraGroups.map(calculateCameraGroupUsage);
  const totalBitrateMbps = groups.reduce((sum, group) => sum + group.totalBitrateMbps, 0);
  const dailyWriteTb = groups.reduce((sum, group) => sum + group.gbPerDay, 0) / GB_PER_TB;
  const reserveFraction = storage.reservePercent / 100;

  let drives: DriveArray;
  let retentionDays: number;
  let requiredCapacityTb: number | null = null;

  if (input.mode === 'storage-needed') {
    retentionDays = storage.retentionDays;
    requiredCapacityTb = (dailyWriteTb * retentionDays) / (1 - reserveFraction);
    const driveCount = minimumDrivesForCapacity(
      storage.raidLevel,
      requiredCapacityTb,
      storage.driveSizeTb
    );
    drives = buildDriveArray(storage, driveCount);
  } else {
    drives = buildDriveArray(storage, normalizeDriveCount(storage.raidLevel, storage.driveCount));
    const recordableTb = drives.usableCapacityTb * (1 - reserveFraction);
    retentionDays = floorTolerant(recordableTb / dailyWriteTb);
  }

  return {
    mode: input.mode,
    groups,
    totalBitrateMbps,
    dailyWriteTb,
    retentionDays,
    requiredCapacityTb,
    drives,
    meetsRetentionTarget: retentionDays >= storage.retentionDays,
    breakdown: buildCapacityBreakdown(groups, drives, retentionDays, reserveFraction),
  };
}
