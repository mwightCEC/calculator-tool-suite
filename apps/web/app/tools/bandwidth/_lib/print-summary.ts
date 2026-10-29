import {
  isBitrateModelValidated,
  isPointRange,
  LINK_CAUTION_ABOVE,
  LINK_OVER_CAPACITY_ABOVE,
  type BandwidthGroupUsage,
  type BandwidthResult,
  type ValueRange,
} from '@cctv/calc-core';
import {
  CODEC_LABELS,
  RESOLUTION_LABELS,
  SCENE_COMPLEXITY_LABELS,
} from '../../../../lib/camera-labels';
import {
  formatFixed,
  formatMbps,
  formatNumber,
  formatRangeBounds,
  rangeDigits,
} from '../../../../lib/format';
import type {
  BandwidthCalculatorState,
  BandwidthGroupState,
} from '../_state/bandwidth-calculator-state';
import { LINK_LABELS, LINK_STATUS_LABELS } from './bandwidth-labels';
import {
  describeBandwidth,
  describeViewing,
  describeWarning,
  formatLinkSpeed,
  type ResultFigure,
} from './result-summary';

/*
 * Content for the printable summary (Export). Pure, so it can be unit tested;
 * PrintSummary only renders it.
 */

export interface LabelledValue {
  label: string;
  value: string;
}

export interface LinkRow {
  key: string;
  link: string;
  capacity: string;
  load: string;
  utilisation: string;
  status: string;
}

export interface GroupRow {
  /** The group id: unique even when names and settings are identical (e.g. duplicates). */
  key: string;
  name: string;
  cameras: string;
  camera: string;
  scene: string;
  bitrate: string;
  total: string;
}

export interface PrintSummary {
  bandwidth: ResultFigure;
  sourceLabel: string;
  keyFigures: LabelledValue[];
  links: LinkRow[];
  warning: string | null;
  groups: GroupRow[];
  settings: LabelledValue[];
  notes: string[];
}

/** "~16 Mbps (11.2–20.8)" for an estimated range, "40 Mbps" for an exact value. */
function rangeValue(range: ValueRange): string {
  return isPointRange(range)
    ? formatMbps(range.typical)
    : `~${formatMbps(range.typical)} (${formatRangeBounds(range)})`;
}

const percent = (fraction: number) => `${formatNumber(fraction * 100, 0)}%`;

function groupBitrate(group: BandwidthGroupState, usage: BandwidthGroupUsage): string {
  switch (group.bitrate.source) {
    case 'estimate': {
      const range = usage.perCameraMbps;
      const digits = rangeDigits(range);
      return `~${formatFixed(range.typical, digits)} Mbps est. (${formatRangeBounds(range, digits)})`;
    }
    case 'known-average':
      return `${formatMbps(group.bitrate.mbps)} VBR average`;
    case 'bitrate-cap':
      return `${formatMbps(group.bitrate.mbps)} CBR`;
  }
}

function groupRows(state: BandwidthCalculatorState, result: BandwidthResult): GroupRow[] {
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
        bitrate: groupBitrate(group, usage),
        total: `${approx}${formatMbps(usage.totalMbps.typical)}`,
      },
    ];
  });
}

function linkRows(result: BandwidthResult): LinkRow[] {
  return result.linkChecks.map((check) => ({
    key: check.link,
    link: LINK_LABELS[check.link],
    capacity: formatLinkSpeed(check.capacityMbps),
    load: `Up to ${formatMbps(check.loadMbps.high)}`,
    utilisation: percent(check.utilisation),
    status: LINK_STATUS_LABELS[check.status],
  }));
}

function notes(result: BandwidthResult): string[] {
  const list = [
    `Network checks compare the high estimate with each link: up to ${percent(LINK_CAUTION_ABOVE)} is OK, up to ${percent(LINK_OVER_CAPACITY_ABOVE)} is a caution, above that is over capacity.`,
  ];
  if (result.isEstimated) {
    list.push(
      'Bitrates marked "~" or "est." are planning estimates; real bitrate varies with scene, night/IR and camera model. Use a measured VBR average or the configured CBR bitrate for the most reliable results.'
    );
    if (!isBitrateModelValidated) {
      list.push(
        'The bitrate estimates currently use preliminary placeholder values that have not been validated against measured cameras.'
      );
    }
  }
  return list;
}

export function buildPrintSummary(
  state: BandwidthCalculatorState,
  result: BandwidthResult
): PrintSummary {
  const viewing = result.remoteViewing;
  return {
    bandwidth: describeBandwidth(result),
    sourceLabel: result.isEstimated ? 'Estimated' : 'From known bitrates',
    keyFigures: [
      ...(viewing
        ? [{ label: 'Remote viewing bandwidth', value: rangeValue(viewing.totalMbps) }]
        : []),
      { label: 'Camera streams (before overhead)', value: rangeValue(result.streamsMbps) },
      { label: 'Per camera (average)', value: rangeValue(result.averagePerCameraMbps) },
      { label: 'Cameras', value: formatNumber(result.totalCameras, 0) },
    ],
    links: linkRows(result),
    warning: describeWarning(result),
    groups: groupRows(state, result),
    settings: [
      { label: 'Remote viewing', value: describeViewing(state, result) },
      { label: 'Overhead', value: `${state.overheadPercent}%` },
    ],
    notes: notes(result),
  };
}
