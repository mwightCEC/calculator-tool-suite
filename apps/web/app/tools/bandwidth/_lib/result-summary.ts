import {
  isPointRange,
  type BandwidthResult,
  type ValueRange,
  type LinkCheck,
  type RemoteViewingUsage,
} from '@cctv/calc-core';
import type { MetricTile } from '../../../../components/ResultsCard/ResultsPanel';
import {
  formatLikelyRange,
  formatMbps,
  formatNumber,
  formatRangeBounds,
} from '../../../../lib/format';
import type { BandwidthCalculatorState } from '../_state/bandwidth-calculator-state';
import {
  LINK_LABELS,
  LINK_PLANNING_LIMIT,
  LINK_STATUS_LABELS,
  VIEWING_BITRATE_SOURCE_LABELS,
} from './bandwidth-labels';

export interface ResultFigure {
  value: string;
  /** e.g. "likely 26–55 Mbps"; null when the value is exact. */
  likelyRange: string | null;
}

/** The bandwidth estimate, the headline: "~38 Mbps", "likely 26–55 Mbps". */
export function describeBandwidth(result: BandwidthResult): ResultFigure {
  const approx = result.isEstimated ? '~' : '';
  return {
    value: `${approx}${formatMbps(result.bandwidthMbps.typical)}`,
    likelyRange: formatLikelyRange(result.bandwidthMbps, 'Mbps'),
  };
}

/** Remote viewing bandwidth, with "~" when it comes from estimated camera bitrates. */
export function describeRemoteViewing(viewing: RemoteViewingUsage): ResultFigure {
  const approx = isPointRange(viewing.totalMbps) ? '' : '~';
  return {
    value: `${approx}${formatMbps(viewing.totalMbps.typical)}`,
    likelyRange: formatLikelyRange(viewing.totalMbps, 'Mbps'),
  };
}

const plural = (count: number, noun: string) =>
  `${formatNumber(count, 0)} ${count === 1 ? noun : `${noun}s`}`;

/** "2 viewers × 4 cameras · Average camera bitrate", "… · Custom bitrate 0.5 Mbps", or "Off". */
export function describeViewing(state: BandwidthCalculatorState, result: BandwidthResult): string {
  const viewing = result.remoteViewing;
  if (!viewing) {
    return 'Off';
  }
  const { viewers, bitrateSource, customMbps } = state.remoteViewing;
  const rate =
    bitrateSource === 'custom'
      ? `${VIEWING_BITRATE_SOURCE_LABELS.custom} ${formatMbps(customMbps)}`
      : VIEWING_BITRATE_SOURCE_LABELS.camera;
  return `${plural(viewers, 'viewer')} × ${plural(viewing.viewedCamerasPerViewer, 'camera')} · ${rate}`;
}

/** "1 Gbps" for whole gigabits, otherwise "250 Mbps". */
export function formatLinkSpeed(mbps: number): string {
  return mbps >= 1000 && mbps % 1000 === 0 ? `${formatNumber(mbps / 1000)} Gbps` : formatMbps(mbps);
}

/** Load against capacity, using the high estimate the status is based on: "Up to 55 Mbps of 100 Mbps · 55%". */
export function describeLinkLoad(check: LinkCheck): string {
  const percent = formatNumber(check.utilisation * 100, 0);
  return `Up to ${formatMbps(check.loadMbps.high)} of ${formatLinkSpeed(check.capacityMbps)} · ${percent}%`;
}

/** True when the high estimate is more than the link can carry, not just past the planning limit. */
function exceedsLink(check: LinkCheck): boolean {
  return check.status === 'over-capacity' && check.utilisation > 1;
}

/** The link's badge: "OK", "Caution", "Above 90%", or "Exceeds link" past its full capacity. */
export function describeLinkStatus(check: LinkCheck): string {
  return exceedsLink(check) ? 'Exceeds link' : LINK_STATUS_LABELS[check.status];
}

const linkNames = (checks: LinkCheck[]) =>
  checks.map((check) => LINK_LABELS[check.link]).join(', ');

/**
 * Warning naming the links the traffic may exceed, then those only past the
 * planning limit; null when every link is within it.
 */
export function describeWarning(result: BandwidthResult): string | null {
  const over = result.linkChecks.filter((check) => check.status === 'over-capacity');
  if (over.length === 0) {
    return null;
  }
  const exceeds = over.filter(exceedsLink);
  const aboveLimit = over.filter((check) => !exceedsLink(check));
  const parts = [
    exceeds.length > 0 && `Traffic may exceed: ${linkNames(exceeds)}.`,
    aboveLimit.length > 0 &&
      `Above the ${LINK_PLANNING_LIMIT} planning limit: ${linkNames(aboveLimit)}.`,
  ].filter(Boolean);
  return `${parts.join(' ')} Allow headroom for bursts and other traffic.`;
}

export interface TrafficSegment {
  key: string;
  label: string;
  mbps: number;
  /** Camera group palette index; null for the overhead allowance. */
  colorIndex: number | null;
}

/** Typical bandwidth estimate split by camera group, with the overhead allowance as its own segment. */
export function bandwidthSegments(
  state: BandwidthCalculatorState,
  result: BandwidthResult
): TrafficSegment[] {
  const groupSegments = result.groups.map((usage) => {
    const group = state.cameraGroups.find((candidate) => candidate.id === usage.groupId);
    return {
      key: usage.groupId,
      label: group?.name ?? usage.groupId,
      mbps: usage.totalMbps.typical,
      colorIndex: group?.colorIndex ?? 0,
    };
  });
  const streamsMbps = groupSegments.reduce((sum, segment) => sum + segment.mbps, 0);
  return [
    ...groupSegments,
    {
      key: 'overhead',
      label: 'Overhead',
      mbps: result.bandwidthMbps.typical - streamsMbps,
      colorIndex: null,
    },
  ];
}

/** "~" when the range is an estimate rather than an exact figure. */
const approx = (range: ValueRange) => (isPointRange(range) ? '' : '~');

/** The results card's figure row: camera streams, the overhead allowance and the per-camera average. */
export function buildMetricTiles(
  state: BandwidthCalculatorState,
  result: BandwidthResult
): MetricTile[] {
  const { streamsMbps, averagePerCameraMbps, bandwidthMbps } = result;
  return [
    {
      label: 'Camera streams',
      value: `${approx(streamsMbps)}${formatMbps(streamsMbps.typical)}`,
      detail: isPointRange(streamsMbps) ? null : `${formatRangeBounds(streamsMbps)} Mbps`,
    },
    {
      label: 'Overhead',
      value: `${approx(bandwidthMbps)}${formatMbps(bandwidthMbps.typical - streamsMbps.typical)}`,
      detail: `${state.overheadPercent}% allowance`,
    },
    {
      label: 'Per camera',
      value: `${approx(averagePerCameraMbps)}${formatMbps(averagePerCameraMbps.typical)}`,
      detail: 'average, before overhead',
    },
  ];
}
