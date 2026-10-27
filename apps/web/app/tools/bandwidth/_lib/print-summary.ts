import {
  isBitrateModelValidated,
  isPointRange,
  isSubStreamModelValidated,
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
import {
  LINK_LABELS,
  LINK_STATUS_LABELS,
  RECORDED_STREAMS_LABELS,
  SUB_STREAM_RESOLUTION_LABELS,
} from './bandwidth-labels';
import {
  describeIngest,
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
  subStream: string;
  bitrate: string;
  mainTotal: string;
  subTotal: string;
}

export interface PrintSummary {
  /** "Simple mode" for Simple input, null for Advanced. */
  inputModeLabel: string | null;
  /** "Cameras" in Simple mode (one setup), "Camera groups" in Advanced. */
  groupsHeading: string;
  ingest: ResultFigure;
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
      const range = usage.mainPerCameraMbps;
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
  const simple = state.inputMode === 'simple';
  return state.cameraGroups.flatMap((group) => {
    const usage = result.groups.find((candidate) => candidate.groupId === group.id);
    if (!usage) {
      return [];
    }
    const approx = group.bitrate.source === 'estimate' ? '~' : '';
    return [
      {
        key: group.id,
        // Simple mode's one setup has no visible group name.
        name: simple ? 'Cameras' : group.name,
        cameras: formatNumber(group.cameraCount, 0),
        camera: `${RESOLUTION_LABELS[group.resolution]} · ${CODEC_LABELS[group.codec]} · ${group.frameRate} fps`,
        scene:
          group.bitrate.source === 'estimate'
            ? SCENE_COMPLEXITY_LABELS[group.sceneComplexity]
            : 'n/a (known bitrate)',
        subStream: SUB_STREAM_RESOLUTION_LABELS[group.subStreamResolution],
        bitrate: groupBitrate(group, usage),
        mainTotal: `${approx}${formatMbps(usage.mainTotalMbps.typical)}`,
        // Sub-streams always use the placeholder estimates.
        subTotal: `~${formatMbps(usage.subTotalMbps.typical)}`,
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
    if (!(isBitrateModelValidated && isSubStreamModelValidated)) {
      list.push(
        'The bitrate and sub-stream estimates currently use preliminary placeholder values that have not been validated against measured cameras.'
      );
    }
  }
  return list;
}

export function buildPrintSummary(
  state: BandwidthCalculatorState,
  result: BandwidthResult
): PrintSummary {
  const recordsSub = state.recordedStreams === 'main-and-sub';
  return {
    inputModeLabel: state.inputMode === 'simple' ? 'Simple mode' : null,
    groupsHeading: state.inputMode === 'simple' ? 'Cameras' : 'Camera groups',
    ingest: describeIngest(result),
    sourceLabel: result.isEstimated ? 'Estimated' : 'From known bitrates',
    keyFigures: [
      { label: 'Remote viewing bandwidth', value: rangeValue(result.viewingUploadMbps) },
      { label: 'Main streams', value: rangeValue(result.mainTotalMbps) },
      {
        label: `Sub-streams (${recordsSub ? 'included' : 'not included'})`,
        value: rangeValue(result.subTotalMbps),
      },
      { label: 'Cameras', value: formatNumber(result.totalCameras, 0) },
    ],
    links: linkRows(result),
    warning: describeWarning(result),
    groups: groupRows(state, result),
    settings: [
      { label: 'Recorded streams', value: RECORDED_STREAMS_LABELS[state.recordedStreams] },
      { label: 'Remote viewing', value: describeViewing(state, result) },
      { label: 'Overhead', value: `${state.overheadPercent}%` },
    ],
    notes: notes(result),
  };
}
