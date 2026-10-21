import type { CameraGroupUsage } from '@cctv/calc-core';
import { describeBitrateShort } from '../../../../lib/bitrate-text';
import { CODEC_LABELS } from '../../../../lib/camera-labels';
import { formatNumber } from '../../../../lib/format';
import type { CameraGroupState } from '../_state/storage-calculator-state';

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

/** Collapsed-card summary, e.g. "12 × 4MP H.265 · 15 fps · Motion 30% · ~6.2 Mbps est." */
export function summarizeGroup(group: CameraGroupState, usage: CameraGroupUsage): string {
  return [
    `${formatNumber(group.cameraCount, 0)} × ${group.resolution} ${CODEC_LABELS[group.codec]}`,
    `${group.frameRate} fps`,
    describeRecording(group),
    describeBitrateShort(group.bitrate, usage.bitratePerCameraMbps),
  ].join(' · ');
}
