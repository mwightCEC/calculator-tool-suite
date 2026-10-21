import {
  isBitrateModelValidated,
  isPointRange,
  type CameraGroupUsage,
  type StorageCalculationResult,
  type ValueRange,
} from '@cctv/calc-core';
import type { CameraGroupState, StorageCalculatorState } from '../_state/storage-calculator-state';
import {
  formatDays,
  formatFixed,
  formatGb,
  formatMbps,
  formatNumber,
  formatRangeBounds,
  formatTb,
  formatTbPerDay,
  rangeDigits,
} from './format';
import { describeRecording } from './group-summary';
import {
  describeDriveCount,
  describeHeadline,
  describeRaid,
  type ResultHeadline,
} from './result-summary';
import {
  CALCULATION_MODE_LABELS,
  CODEC_LABELS,
  RAID_LABELS,
  RESOLUTION_LABELS,
  SCENE_COMPLEXITY_LABELS,
} from './storage-labels';

/*
 * Content for the printable summary (Export). Pure, so it can be unit tested;
 * PrintSummary only renders it.
 */

export interface LabelledValue {
  label: string;
  value: string;
}

export interface CapacityRow {
  /** Unique React key: the group id for footage rows, a fixed name otherwise. */
  key: string;
  label: string;
  tb: string;
  share: string;
  /** The raw-capacity total row, styled apart from the segments above it. */
  isTotal?: boolean;
}

export interface GroupRow {
  /** The group id: unique even when names and settings are identical (e.g. duplicates). */
  key: string;
  name: string;
  cameras: string;
  camera: string;
  scene: string;
  recording: string;
  bitrate: string;
  totalMbps: string;
  perDay: string;
}

export interface PrintSummary {
  modeLabel: string;
  headline: ResultHeadline;
  drives: string;
  raid: string;
  sizedForHigh: boolean;
  sourceLabel: string;
  keyFigures: LabelledValue[];
  capacity: CapacityRow[];
  groups: GroupRow[];
  settings: LabelledValue[];
  notes: string[];
}

/** "~16 Mbps (11.2–20.8)" for an estimated range, "40 Mbps" for an exact value. */
function rangeValue(range: ValueRange, format: (value: number) => string, digits?: number) {
  return isPointRange(range)
    ? format(range.typical)
    : `~${format(range.typical)} (${formatRangeBounds(range, digits)})`;
}

function retentionFigure(result: StorageCalculationResult): LabelledValue {
  const days = result.retentionDays;
  if (result.mode === 'storage-needed') {
    return { label: 'Retention target', value: formatDays(days.typical) };
  }
  const worstCase = formatDays(days.low);
  return {
    label: 'Estimated retention',
    value: isPointRange(days)
      ? worstCase
      : `${worstCase} worst case (likely ${formatRangeBounds(days, 0)})`,
  };
}

function groupBitrate(group: CameraGroupState, usage: CameraGroupUsage): string {
  switch (group.bitrate.source) {
    case 'estimate': {
      const range = usage.bitratePerCameraMbps;
      const digits = rangeDigits(range);
      return `~${formatFixed(range.typical, digits)} Mbps est. (${formatRangeBounds(range, digits)})`;
    }
    case 'known-average':
      return `${formatMbps(group.bitrate.mbps)} known average`;
    case 'bitrate-cap':
      return `${formatMbps(group.bitrate.mbps)} cap`;
  }
}

function groupRows(state: StorageCalculatorState, result: StorageCalculationResult): GroupRow[] {
  return state.cameraGroups.flatMap((group) => {
    const usage = result.groups.find((candidate) => candidate.groupId === group.id);
    if (!usage) {
      return [];
    }
    const approx = group.bitrate.source === 'estimate' ? '~' : '';
    return [
      {
        key: group.id,
        name: group.name,
        cameras: formatNumber(group.cameraCount, 0),
        camera: `${RESOLUTION_LABELS[group.resolution]} · ${CODEC_LABELS[group.codec]} · ${group.frameRate} fps`,
        scene:
          group.bitrate.source === 'estimate'
            ? SCENE_COMPLEXITY_LABELS[group.sceneComplexity]
            : 'n/a (known bitrate)',
        recording: describeRecording(group),
        bitrate: groupBitrate(group, usage),
        totalMbps: `${approx}${formatMbps(usage.totalBitrateMbps.typical)}`,
        perDay: `${approx}${formatGb(usage.gbPerDay.typical)}`,
      },
    ];
  });
}

function capacityRows(
  state: StorageCalculatorState,
  result: StorageCalculationResult
): CapacityRow[] {
  const { breakdown } = result;
  const share = (tb: number) =>
    breakdown.rawTb > 0 ? `${formatNumber((tb / breakdown.rawTb) * 100, 0)}%` : '0%';
  const row = (key: string, label: string, tb: number) => ({
    key,
    label,
    tb: formatTb(tb),
    share: share(tb),
  });

  const footage = breakdown.footageTbByGroup.map(({ groupId, tb }) => {
    const name = state.cameraGroups.find((group) => group.id === groupId)?.name ?? groupId;
    return row(groupId, `Footage: ${name}`, tb);
  });
  return [
    ...footage,
    row('reserve', 'Reserve', breakdown.reserveTb),
    row('parity', 'RAID parity', breakdown.parityTb),
    row('unused', 'Unused', breakdown.unusedTb),
    { ...row('total', 'Raw capacity', breakdown.rawTb), isTotal: true },
  ];
}

function settingsRows(state: StorageCalculatorState, result: StorageCalculationResult) {
  const { storage } = state;
  const sizing: LabelledValue =
    state.mode === 'storage-needed'
      ? { label: 'Retention target', value: formatDays(storage.retentionDays) }
      : { label: 'Drives', value: formatNumber(result.drives.driveCount, 0) };
  return [
    sizing,
    { label: 'Drive size', value: `${storage.driveSizeTb} TB` },
    { label: 'RAID', value: RAID_LABELS[storage.raidLevel] },
    { label: 'Reserve', value: `${storage.reservePercent}%` },
  ];
}

function notes(result: StorageCalculationResult): string[] {
  const list = [
    'Capacities are decimal TB (10¹² bytes), as printed on drives. Recorders and operating systems may show less because they use binary units.',
  ];
  if (result.isEstimated) {
    list.push(
      'Bitrates marked "est." are planning estimates; real bitrate varies with scene, night/IR and camera model. Use measured averages or configured bitrate caps for the most reliable results.'
    );
    if (!isBitrateModelValidated) {
      list.push(
        'The estimates currently use preliminary placeholder values that have not been validated against measured cameras.'
      );
    }
  }
  return list;
}

export function buildPrintSummary(
  state: StorageCalculatorState,
  result: StorageCalculationResult
): PrintSummary {
  return {
    modeLabel: CALCULATION_MODE_LABELS[result.mode],
    headline: describeHeadline(result),
    drives: describeDriveCount(result),
    raid: describeRaid(result),
    sizedForHigh: result.mode === 'storage-needed' && result.isEstimated,
    sourceLabel: result.isEstimated ? 'Estimated' : 'From known bitrates',
    keyFigures: [
      { label: 'Total bitrate', value: rangeValue(result.totalBitrateMbps, formatMbps) },
      { label: 'Daily write', value: rangeValue(result.dailyWriteTb, formatTbPerDay, 2) },
      retentionFigure(result),
      { label: 'Usable capacity', value: formatTb(result.drives.usableCapacityTb) },
    ],
    capacity: capacityRows(state, result),
    groups: groupRows(state, result),
    settings: settingsRows(state, result),
    notes: notes(result),
  };
}
