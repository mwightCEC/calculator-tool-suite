import type { BitrateModel } from '../bitrate/bitrate-model-schema';
import { cameraBitrateRange } from '../bitrate/group-bitrate';
import type { CameraGroup } from '../model/schema';
import type { BitrateSource } from '../options';
import { scaleRange, type ValueRange } from '../range';
import { dutyCycle } from '../recording/duty-cycle';
import { BITS_PER_BYTE, MB_PER_GB, SECONDS_PER_DAY } from '../units';

export interface CameraGroupUsage {
  groupId: string;
  bitrateSource: BitrateSource;
  /** Per-camera stream bitrate in Mbps. */
  bitratePerCameraMbps: ValueRange;
  /** Combined stream bitrate of all cameras in the group, in Mbps. */
  totalBitrateMbps: ValueRange;
  /** Fraction of the day written to disk (0–1). */
  dutyCycle: number;
  /** Footage written per day in decimal GB. */
  gbPerDay: ValueRange;
}

/** Converts a continuous bitrate in Mbps to decimal GB per day. */
export function mbpsToGbPerDay(mbps: number): number {
  return (mbps * SECONDS_PER_DAY) / BITS_PER_BYTE / MB_PER_GB;
}

export function calculateCameraGroupUsage(
  group: CameraGroup,
  model?: BitrateModel
): CameraGroupUsage {
  const bitratePerCameraMbps = cameraBitrateRange(group, model);
  const totalBitrateMbps = scaleRange(bitratePerCameraMbps, group.cameraCount);
  const groupDutyCycle = dutyCycle(group);

  return {
    groupId: group.id,
    bitrateSource: group.bitrate.source,
    bitratePerCameraMbps,
    totalBitrateMbps,
    dutyCycle: groupDutyCycle,
    gbPerDay: scaleRange(totalBitrateMbps, mbpsToGbPerDay(1) * groupDutyCycle),
  };
}
