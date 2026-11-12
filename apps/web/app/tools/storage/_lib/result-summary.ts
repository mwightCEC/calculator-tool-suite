import {
  GB_PER_TB,
  isPointRange,
  scaleRange,
  type StorageCalculationResult,
} from '@cctv/calc-core';
import {
  formatDays,
  formatGb,
  formatApproxRange,
  formatMbps,
  formatNumber,
  formatTb,
} from '../../../../lib/format';
import type { StorageCalculatorState } from '../_state/storage-calculator-state';
import { RAID_LABELS } from './storage-labels';

export interface ResultHeadline {
  label: string;
  value: string;
  /** The likely range, e.g. "~30–48 TB"; null when every group uses a known bitrate. */
  likelyRange: string | null;
  /** What the headline figure is, where that isn't obvious; null otherwise. */
  note: string | null;
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
      likelyRange: formatApproxRange(result.requiredCapacityTb, 'TB'),
      note: null,
    };
  }
  const days = result.retentionDays;
  return {
    label: 'Estimated retention',
    value: formatDays(days.low),
    likelyRange: formatApproxRange(days, 'days', 0),
    note: isPointRange(days) ? 'In complete days, rounded down.' : null,
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

export interface SummaryItem {
  label: string;
  value: string;
  /** Subtext: what the value covers, or its likely range ("~11–21 Mbps"); null for none. */
  detail: string | null;
}

const plural = (count: number, word: string) =>
  `${formatNumber(count, 0)} ${count === 1 ? word : `${word}s`}`;

export interface SummarySections {
  /** What the cameras record: bitrate, footage per day, cameras. */
  recording: SummaryItem[];
  /** What the drives hold: recording, usable and raw capacity, below a divider. */
  capacity: SummaryItem[];
}

/**
 * The results card's summary rows: what the cameras record, then (below a divider)
 * what the drives hold.
 */
export function buildSummarySections(
  result: StorageCalculationResult,
  state: StorageCalculatorState
): SummarySections {
  const { drives, breakdown } = result;
  const approx = result.isEstimated ? '~' : '';
  const raid = drives.raidLevel === 'none' ? 'no RAID' : RAID_LABELS[drives.raidLevel];
  const cameras = state.cameraGroups.reduce((sum, group) => sum + group.cameraCount, 0);
  // Shown in decimal GB, as on the camera group cards.
  const dailyGb = scaleRange(result.dailyWriteTb, GB_PER_TB);
  return {
    recording: [
      {
        label: 'Total bitrate',
        value: `${approx}${formatMbps(result.totalBitrateMbps.typical)}`,
        detail: formatApproxRange(result.totalBitrateMbps, 'Mbps'),
      },
      {
        label: 'Daily recording',
        value: `${approx}${formatGb(dailyGb.typical)}/day`,
        detail: formatApproxRange(dailyGb, 'GB/day'),
      },
      {
        label: 'Cameras',
        value: formatNumber(cameras, 0),
        detail: `in ${plural(state.cameraGroups.length, 'group')}`,
      },
    ],
    capacity: [
      {
        label: 'Recording capacity',
        value: formatTb(drives.usableCapacityTb - breakdown.reserveTb),
        detail: `after ${state.storage.reservePercent}% reserve`,
      },
      {
        label: 'Usable capacity',
        value: formatTb(drives.usableCapacityTb),
        detail: `${raid}, ${plural(drives.driveCount, 'drive')}`,
      },
      {
        label: 'Raw capacity',
        value: formatTb(drives.rawCapacityTb),
        detail: `${formatNumber(drives.driveCount, 0)} × ${drives.driveSizeTb} TB`,
      },
    ],
  };
}
