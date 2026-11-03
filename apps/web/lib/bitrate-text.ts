import type { BitrateEstimateBreakdown, GroupBitrate, ValueRange } from '@cctv/calc-core';
import { formatFixed, formatMbps, formatNumber, formatRangeBounds, rangeDigits } from './format';

/** Short per-camera bitrate: "~6.2 Mbps est." or, entered, "8 Mbps". */
export function describeBitrateShort(bitrate: GroupBitrate, perCameraMbps: ValueRange): string {
  switch (bitrate.source) {
    case 'estimate':
      return `~${formatMbps(perCameraMbps.typical)} est.`;
    case 'manual':
      return formatMbps(bitrate.mbps);
  }
}

/** Hint after the bitrate section title: "Estimated – ~2 Mbps" or "Manual – 2 Mbps". */
export function describeBitrateHint(bitrate: GroupBitrate, perCameraMbps: ValueRange): string {
  return bitrate.source === 'estimate'
    ? `Estimated – ~${formatMbps(perCameraMbps.typical)}`
    : `Manual – ${formatMbps(bitrate.mbps)}`;
}

/** The parts of the estimate's working, formatted with the range's precision. */
export interface EstimateWorking {
  /** "3.4 Mbps": typical for the resolution, frame rate and codec. */
  stream: string;
  /** "1", "0.6": the scene complexity multiplier. */
  multiplier: string;
  /** "3.4 Mbps": stream × multiplier. */
  typical: string;
  /** "likely 2.4–4.4 Mbps". */
  likely: string;
}

export function describeEstimateWorking(
  breakdown: BitrateEstimateBreakdown,
  perCameraMbps: ValueRange
): EstimateWorking {
  const digits = rangeDigits(perCameraMbps);
  return {
    stream: `${formatFixed(breakdown.streamMbps, digits)} Mbps`,
    multiplier: formatNumber(breakdown.sceneMultiplier, 2),
    typical: `${formatFixed(perCameraMbps.typical, digits)} Mbps`,
    likely: `likely ${formatRangeBounds(perCameraMbps, digits)} Mbps`,
  };
}
