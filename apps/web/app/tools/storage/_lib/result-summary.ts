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

function raidPhrase(result: StorageCalculationResult): string {
  return result.drives.raidLevel === 'none' ? 'no RAID' : RAID_LABELS[result.drives.raidLevel];
}

/** "3 × 14 TB drives, RAID 5". */
export function describeDrives(result: StorageCalculationResult): string {
  const { driveCount, driveSizeTb } = result.drives;
  return `${driveCount} × ${driveSizeTb} TB ${driveCount === 1 ? 'drive' : 'drives'}, ${raidPhrase(result)}`;
}

export interface ResultStatus {
  tone: 'ok' | 'warn';
  text: string;
}

export function describeStatus(
  result: StorageCalculationResult,
  retentionTargetDays: number
): ResultStatus {
  if (result.mode === 'storage-needed') {
    return { tone: 'ok', text: `Meets ${retentionTargetDays}-day target, ${raidPhrase(result)}` };
  }
  const worstCaseDays = result.retentionDays.low;
  if (worstCaseDays < 1) {
    return { tone: 'warn', text: 'Less than one day of footage fits on these drives' };
  }
  const days = formatDays(worstCaseDays);
  return {
    tone: 'ok',
    text: isPointRange(result.retentionDays) ? `Keeps ${days}` : `Keeps at least ${days}`,
  };
}
