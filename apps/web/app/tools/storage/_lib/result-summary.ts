import { isPointRange, type StorageCalculationResult } from '@cctv/calc-core';
import { formatDays, formatLikelyRange, formatRangeBounds, formatTb } from './format';
import { RAID_LABELS } from './storage-labels';

export interface ResultHeadline {
  label: string;
  value: string;
  /** e.g. "likely 30–48 TB"; null when every group uses a known bitrate. */
  likelyRange: string | null;
}

/**
 * Storage needed: typical capacity, with the likely range beneath.
 * Days from capacity: the worst-case (low) days, with the range beneath.
 */
export function describeHeadline(result: StorageCalculationResult): ResultHeadline {
  if (result.requiredCapacityTb) {
    return {
      label: 'Storage required',
      value: formatTb(result.requiredCapacityTb.typical),
      likelyRange: formatLikelyRange(result.requiredCapacityTb, 'TB'),
    };
  }
  const days = result.retentionDays;
  return {
    label: 'Estimated retention',
    value: formatDays(days.low),
    likelyRange: isPointRange(days) ? null : `likely ${formatRangeBounds(days, 0)} days`,
  };
}

/** "3 × 14 TB drives". */
export function describeDriveCount(result: StorageCalculationResult): string {
  const { driveCount, driveSizeTb } = result.drives;
  return `${driveCount} × ${driveSizeTb} TB ${driveCount === 1 ? 'drive' : 'drives'}`;
}

/** "RAID 5", or "No RAID". */
export function describeRaid(result: StorageCalculationResult): string {
  return result.drives.raidLevel === 'none' ? 'No RAID' : RAID_LABELS[result.drives.raidLevel];
}

/**
 * Warning for the results card, or null when there is nothing to warn about.
 * Only Days-from-capacity mode can warn: Storage needed always meets its target.
 */
export function describeWarning(result: StorageCalculationResult): string | null {
  if (result.mode === 'days-from-capacity' && result.retentionDays.low < 1) {
    return 'Less than one day of footage fits on these drives';
  }
  return null;
}
