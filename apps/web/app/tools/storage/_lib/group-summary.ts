import type { CameraGroupUsage } from '@cctv/calc-core';
import type { CameraGroupState } from '../_state/storage-calculator-state';
import { formatFixed, formatMbps, formatNumber, formatRangeBounds, rangeDigits } from './format';
import { CODEC_LABELS } from './storage-labels';

/** "Continuous", "Motion 30%" or "Schedule 12 h". */
export function describeRecording(group: CameraGroupState): string {
  switch (group.recordingMode) {
    case 'continuous':
      return 'Continuous';
    case 'motion':
      return `Motion ${group.motionPercent}%`;
    case 'schedule':
      return `Schedule ${group.scheduleHours} h`;
  }
}

/** Short per-camera bitrate with its source: "~6.2 Mbps est.", "8 Mbps avg", "8 Mbps cap". */
export function describeBitrateShort(group: CameraGroupState, usage: CameraGroupUsage): string {
  switch (group.bitrate.source) {
    case 'estimate':
      return `~${formatMbps(usage.bitratePerCameraMbps.typical)} est.`;
    case 'known-average':
      return `${formatMbps(group.bitrate.mbps)} avg`;
    case 'bitrate-cap':
      return `${formatMbps(group.bitrate.mbps)} cap`;
  }
}

/** Estimate with its range: "~6.2 Mbps (4.3–8.1) estimated". */
export function describeEstimate(usage: CameraGroupUsage): string {
  const range = usage.bitratePerCameraMbps;
  const digits = rangeDigits(range);
  return `~${formatFixed(range.typical, digits)} Mbps (${formatRangeBounds(range, digits)}) estimated`;
}

/** Collapsed-card summary, e.g. "12 × 4MP H.265 · 15 fps · Motion 30% · ~6.2 Mbps est." */
export function summarizeGroup(group: CameraGroupState, usage: CameraGroupUsage): string {
  return [
    `${formatNumber(group.cameraCount, 0)} × ${group.resolution} ${CODEC_LABELS[group.codec]}`,
    `${group.frameRate} fps`,
    describeRecording(group),
    describeBitrateShort(group, usage),
  ].join(' · ');
}
