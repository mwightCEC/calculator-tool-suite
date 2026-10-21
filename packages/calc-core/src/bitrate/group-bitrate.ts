import type { CameraGroup, GroupBitrate } from '../model/schema';
import { BITRATE_INPUT_MAX_MBPS, BITRATE_INPUT_MIN_MBPS, type BitrateSource } from '../options';
import { pointRange, type ValueRange } from '../range';
import type { BitrateModel } from './bitrate-model-schema';
import { estimateBitrateRange, estimateTypicalBitrateMbps } from './estimate-bitrate';

/** The camera group fields that determine bitrate (shared by Storage and Bandwidth groups). */
export type BitrateGroupFields = Pick<
  CameraGroup,
  'resolution' | 'codec' | 'frameRate' | 'sceneComplexity' | 'bitrate'
>;

/** Per-camera bitrate range in Mbps. Entered bitrates collapse to a single value. */
export function cameraBitrateRange(group: BitrateGroupFields, model?: BitrateModel): ValueRange {
  return group.bitrate.source === 'estimate'
    ? estimateBitrateRange(group, model)
    : pointRange(group.bitrate.mbps);
}

/** Rounds to 0.1 Mbps and clamps to the range a user may enter. */
function toEnteredBitrate(mbps: number, maxMbps: number): number {
  const rounded = Math.round(mbps * 10) / 10;
  return Math.min(maxMbps, Math.max(BITRATE_INPUT_MIN_MBPS, rounded));
}

/**
 * Returns the group's bitrate after switching to `source`.
 * Leaving Estimate prefills the input with the current typical estimate;
 * switching between Known average and Bitrate cap keeps the entered value.
 */
export function changeBitrateSource(
  group: BitrateGroupFields,
  source: BitrateSource,
  options: { maxMbps?: number; model?: BitrateModel } = {}
): GroupBitrate {
  const { maxMbps = BITRATE_INPUT_MAX_MBPS, model } = options;
  if (source === 'estimate') {
    return { source };
  }
  if (group.bitrate.source === 'estimate') {
    return { source, mbps: toEnteredBitrate(estimateTypicalBitrateMbps(group, model), maxMbps) };
  }
  return { source, mbps: group.bitrate.mbps };
}
