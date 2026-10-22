import type { BandwidthResult, LinkCheck } from '@cctv/calc-core';
import { formatLikelyRange, formatMbps, formatNumber } from '../../../../lib/format';
import type { BandwidthCalculatorState } from '../_state/bandwidth-calculator-state';
import { LINK_LABELS, VIEWING_STREAM_LABELS } from './bandwidth-labels';

export interface ResultFigure {
  value: string;
  /** e.g. "likely 26–55 Mbps"; null when the value is exact. */
  likelyRange: string | null;
}

/** Recorder ingest, the headline: "~38 Mbps", "likely 26–55 Mbps". */
export function describeIngest(result: BandwidthResult): ResultFigure {
  const approx = result.isEstimated ? '~' : '';
  return {
    value: `${approx}${formatMbps(result.ingestMbps.typical)}`,
    likelyRange: formatLikelyRange(result.ingestMbps, 'Mbps'),
  };
}

/** Remote viewing upload; "0 Mbps" with no viewers. */
export function describeViewingUpload(result: BandwidthResult): ResultFigure {
  const approx = result.viewingPerCameraMbps !== null && result.isEstimated ? '~' : '';
  return {
    value: `${approx}${formatMbps(result.viewingUploadMbps.typical)}`,
    likelyRange: formatLikelyRange(result.viewingUploadMbps, 'Mbps'),
  };
}

const plural = (count: number, noun: string) =>
  `${formatNumber(count, 0)} ${count === 1 ? noun : `${noun}s`}`;

/** "2 viewers × 4 cameras · Sub (grid)", or "No remote viewers". */
export function describeViewing(state: BandwidthCalculatorState, result: BandwidthResult): string {
  const { viewers, stream } = state.remoteViewing;
  if (viewers === 0) {
    return 'No remote viewers';
  }
  return `${plural(viewers, 'viewer')} × ${plural(result.viewedCamerasPerViewer, 'camera')} · ${VIEWING_STREAM_LABELS[stream]}`;
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

/**
 * Typical recorder ingest split by camera group (main streams, plus sub-streams
 * when recorded) with the overhead allowance as its own segment.
 */
export function ingestSegments(
  state: BandwidthCalculatorState,
  result: BandwidthResult
): TrafficSegment[] {
  const recordsSub = state.recordedStreams === 'main-and-sub';
  const groupSegments = result.groups.map((usage) => {
    const group = state.cameraGroups.find((candidate) => candidate.id === usage.groupId);
    const subMbps = recordsSub ? usage.subTotalMbps.typical : 0;
    return {
      key: usage.groupId,
      label: group?.name ?? usage.groupId,
      mbps: usage.mainTotalMbps.typical + subMbps,
      colorIndex: group?.colorIndex ?? 0,
    };
  });
  const streamsMbps = groupSegments.reduce((sum, segment) => sum + segment.mbps, 0);
  return [
    ...groupSegments,
    {
      key: 'overhead',
      label: 'Overhead',
      mbps: result.ingestMbps.typical - streamsMbps,
      colorIndex: null,
    },
  ];
}
