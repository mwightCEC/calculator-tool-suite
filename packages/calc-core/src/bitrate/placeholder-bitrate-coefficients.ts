import type { Codec, Resolution, SceneComplexity } from '../options';

/*
 * ============================================================================
 * PLACEHOLDER DATA — NOT VALIDATED
 * ============================================================================
 * These coefficients come from the prototype. They are NOT validated
 * real-world estimates and must not be presented as reliable product guidance.
 *
 * TODO: Replace with validated data (e.g. measured stream bitrates from
 * representative cameras/scenes, or vendor calculator references) and then
 * set PLACEHOLDER_BITRATE_MODEL.validated to true.
 *
 * Model: Mbps = base[resolution] × codec × (fps / 30)^exponent × complexity
 * ============================================================================
 */
export const PLACEHOLDER_BITRATE_MODEL = {
  /** False until the coefficients below are replaced with validated data. */
  validated: false,

  /** H.264 Mbps at 30 fps and medium scene complexity. */
  baseH264MbpsAt30Fps: {
    '1MP': 2,
    '2MP': 4,
    '3MP': 5,
    '4MP': 6,
    '5MP': 7,
    '6MP': 8,
    '8MP': 12,
    '12MP': 16,
  } satisfies Record<Resolution, number>,

  /** Multiplier relative to H.264. */
  codecFactor: {
    h264: 1.0,
    'h264-smart': 0.6,
    h265: 0.6,
    'h265-smart': 0.35,
    mjpeg: 5.0,
  } satisfies Record<Codec, number>,

  /** Frame-rate factor = (fps / referenceFps)^exponent. */
  frameRate: {
    referenceFps: 30,
    exponent: 0.85,
  },

  complexityFactor: {
    low: 0.6,
    medium: 1.0,
    high: 1.5,
  } satisfies Record<SceneComplexity, number>,
} as const;
