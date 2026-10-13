import { estimateBitrateMbps } from '../bitrate/estimate-bitrate';
import type { CameraGroup } from '../model/schema';
import { dutyCycle } from '../recording/duty-cycle';
import { BITS_PER_BYTE, MB_PER_GB, SECONDS_PER_DAY } from '../units';

export interface CameraGroupUsage {
  groupId: string;
  /** Per-camera stream bitrate in Mbps (override or estimate). */
  bitratePerCameraMbps: number;
  /** True when the bitrate is a placeholder-model estimate rather than an override. */
  isBitrateEstimated: boolean;
  /** Combined stream bitrate of all cameras in the group, in Mbps. */
  totalBitrateMbps: number;
  /** Fraction of the day written to disk (0–1). */
  dutyCycle: number;
  /** Footage written per day in decimal GB. */
  gbPerDay: number;
}

/** Converts a continuous bitrate in Mbps to decimal GB per day. */
export function mbpsToGbPerDay(mbps: number): number {
  return (mbps * SECONDS_PER_DAY) / BITS_PER_BYTE / MB_PER_GB;
}

export function calculateCameraGroupUsage(group: CameraGroup): CameraGroupUsage {
  const isBitrateEstimated = group.bitrateOverrideMbps === null;
  const bitratePerCameraMbps = group.bitrateOverrideMbps ?? estimateBitrateMbps(group);
  const totalBitrateMbps = bitratePerCameraMbps * group.cameraCount;
  const groupDutyCycle = dutyCycle(group);

  return {
    groupId: group.id,
    bitratePerCameraMbps,
    isBitrateEstimated,
    totalBitrateMbps,
    dutyCycle: groupDutyCycle,
    gbPerDay: mbpsToGbPerDay(totalBitrateMbps) * groupDutyCycle,
  };
}
