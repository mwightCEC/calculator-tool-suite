import type { Codec, FrameRate, Resolution, SceneComplexity } from '../options';
import { PLACEHOLDER_BITRATE_MODEL } from './placeholder-bitrate-coefficients';

export interface BitrateEstimateInput {
  resolution: Resolution;
  codec: Codec;
  frameRate: FrameRate;
  sceneComplexity: SceneComplexity;
}

/**
 * Estimated per-camera stream bitrate in Mbps.
 *
 * Uses PLACEHOLDER coefficients (see placeholder-bitrate-coefficients.ts).
 * Results are rough placeholders, not validated estimates.
 */
export function estimateBitrateMbps(input: BitrateEstimateInput): number {
  const model = PLACEHOLDER_BITRATE_MODEL;
  const { referenceFps, exponent } = model.frameRate;

  return (
    model.baseH264MbpsAt30Fps[input.resolution] *
    model.codecFactor[input.codec] *
    (input.frameRate / referenceFps) ** exponent *
    model.complexityFactor[input.sceneComplexity]
  );
}

/** Whether bitrate estimates come from validated data. Surface this in the UI. */
export const isBitrateEstimateValidated: boolean = PLACEHOLDER_BITRATE_MODEL.validated;
