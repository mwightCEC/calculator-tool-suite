import type { BandwidthGroupUsage } from '@cctv/calc-core';
import { describeBitrateShort } from '../../../../lib/bitrate-text';
import { CODEC_LABELS } from '../../../../lib/camera-labels';
import { formatMbps, formatNumber } from '../../../../lib/format';
import type { BandwidthGroupState } from '../_state/bandwidth-calculator-state';

/** Collapsed-card summary, e.g. "8 × 4MP H.265 · 15 fps · ~3.9 Mbps est." */
export function summarizeGroup(group: BandwidthGroupState, usage: BandwidthGroupUsage): string {
  return [
    `${formatNumber(group.cameraCount, 0)} × ${group.resolution} ${CODEC_LABELS[group.codec]}`,
    `${group.frameRate} fps`,
    describeBitrateShort(group.bitrate, usage.perCameraMbps),
  ].join(' · ');
}

/** The group's total, with "~" when it comes from the estimate: "~31 Mbps". */
export function describeGroupTotal(group: BandwidthGroupState, usage: BandwidthGroupUsage): string {
  const approx = group.bitrate.source === 'estimate' ? '~' : '';
  return `${approx}${formatMbps(usage.totalMbps.typical)}`;
}
