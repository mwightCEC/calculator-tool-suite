import type { Codec, FrameRate, Resolution, SceneComplexity } from '../options';
import type { ValueRange } from '../range';
import { BITRATE_MODEL } from './bitrate-model';
import type { BitrateModel } from './bitrate-model-schema';

export interface BitrateEstimateInput {
  resolution: Resolution;
  codec: Codec;
  frameRate: FrameRate;
  sceneComplexity: SceneComplexity;
}

/** The typical estimate in two parts: the stream (resolution, codec, frame rate) and the scene. */
export interface BitrateEstimateBreakdown {
  /** Typical Mbps for the resolution, codec and frame rate, before scene complexity. */
  streamMbps: number;
  sceneMultiplier: number;
  /** streamMbps × sceneMultiplier. */
  typicalMbps: number;
}

export function estimateBitrateBreakdown(
  input: BitrateEstimateInput,
  model: BitrateModel = BITRATE_MODEL
): BitrateEstimateBreakdown {
  const streamMbps =
    model.baselineMbps[input.resolution].value *
    model.codecMultipliers[input.codec].value *
    (input.frameRate / model.reference.frameRate) ** model.frameRateScaling.exponent.value;
  const sceneMultiplier = model.sceneComplexityMultipliers[input.sceneComplexity].value;
  return { streamMbps, sceneMultiplier, typicalMbps: streamMbps * sceneMultiplier };
}

/** Typical per-camera stream bitrate in Mbps from the bitrate model. */
export function estimateTypicalBitrateMbps(
  input: BitrateEstimateInput,
  model: BitrateModel = BITRATE_MODEL
): number {
  return estimateBitrateBreakdown(input, model).typicalMbps;
}

/** Uncertainty band for a scene complexity, falling back to the model default. */
export function uncertaintyBandFor(
  sceneComplexity: SceneComplexity,
  model: BitrateModel = BITRATE_MODEL
): number {
  const band =
    model.uncertaintyBand.bySceneComplexity[sceneComplexity] ?? model.uncertaintyBand.default;
  return band.value;
}

/**
 * Estimated per-camera bitrate range in Mbps.
 * Real bitrate varies widely with scene, night/IR, encoder and camera settings,
 * so this is a planning range, not a prediction.
 */
export function estimateBitrateRange(
  input: BitrateEstimateInput,
  model: BitrateModel = BITRATE_MODEL
): ValueRange {
  const typical = estimateTypicalBitrateMbps(input, model);
  const band = uncertaintyBandFor(input.sceneComplexity, model);
  return { low: typical * (1 - band), typical, high: typical * (1 + band) };
}
