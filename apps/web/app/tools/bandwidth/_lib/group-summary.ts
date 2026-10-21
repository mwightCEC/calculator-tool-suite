import type { BandwidthGroupUsage } from '@cctv/calc-core';
import { describeBitrateShort } from '../../../../lib/bitrate-text';
import { CODEC_LABELS } from '../../../../lib/camera-labels';
import { formatMbps, formatNumber } from '../../../../lib/format';
import type { BandwidthGroupState } from '../_state/bandwidth-calculator-state';
import { SUB_STREAM_RESOLUTION_LABELS } from './bandwidth-labels';

/** Collapsed-card summary, e.g. "8 × 4MP H.265 · 15 fps · Sub D1 · ~3.9 Mbps est." */
export function summarizeGroup(group: BandwidthGroupState, usage: BandwidthGroupUsage): string {
  return [
    `${formatNumber(group.cameraCount, 0)} × ${group.resolution} ${CODEC_LABELS[group.codec]}`,
    `${group.frameRate} fps`,
    `Sub ${SUB_STREAM_RESOLUTION_LABELS[group.subStreamResolution]}`,
    describeBitrateShort(group.bitrate, usage.mainPerCameraMbps),
  ].join(' · ');
}

/** The group's main-stream total, with "~" when it comes from the estimate: "~31 Mbps". */
export function describeMainTotal(group: BandwidthGroupState, usage: BandwidthGroupUsage): string {
  const approx = group.bitrate.source === 'estimate' ? '~' : '';
  return `${approx}${formatMbps(usage.mainTotalMbps.typical)}`;
}

/** Main and sub-stream totals: "~31 Mbps main · ~4 Mbps sub". Sub-streams are always estimated. */
export function describeGroupTotals(
  group: BandwidthGroupState,
  usage: BandwidthGroupUsage
): string {
  return `${describeMainTotal(group, usage)} main · ~${formatMbps(usage.subTotalMbps.typical)} sub`;
}
