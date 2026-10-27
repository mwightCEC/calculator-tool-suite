import {
  isPointRange,
  type BandwidthResult,
  type LinkCheck,
  type RemoteViewingUsage,
} from '@cctv/calc-core';
import { formatLikelyRange, formatMbps, formatNumber } from '../../../../lib/format';
import type { BandwidthCalculatorState } from '../_state/bandwidth-calculator-state';
import { LINK_LABELS, VIEWING_BITRATE_SOURCE_LABELS } from './bandwidth-labels';

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

/** "2 viewers × 4 cameras · Camera bitrate", "… · Custom bitrate 0.5 Mbps", or "Off". */
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

/** Warning naming the links that are over capacity, or null when none are. */
export function describeWarning(result: BandwidthResult): string | null {
  const over = result.linkChecks.filter((check) => check.status === 'over-capacity');
  if (over.length === 0) {
    return null;
  }
  const names = over.map((check) => LINK_LABELS[check.link]).join(', ');
  return `Traffic may exceed: ${names}. Allow headroom for bursts and other traffic.`;
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
      // Simple mode's one setup has no visible group name.
      label: state.inputMode === 'simple' ? 'Cameras' : (group?.name ?? usage.groupId),
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
