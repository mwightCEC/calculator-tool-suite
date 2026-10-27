import type { GroupBitrate, ValueRange } from '@cctv/calc-core';
import { formatFixed, formatMbps, formatRangeBounds, rangeDigits } from './format';

/** Short per-camera bitrate with its source: "~6.2 Mbps est.", "8 Mbps VBR", "8 Mbps CBR". */
export function describeBitrateShort(bitrate: GroupBitrate, perCameraMbps: ValueRange): string {
  switch (bitrate.source) {
    case 'estimate':
      return `~${formatMbps(perCameraMbps.typical)} est.`;
    case 'known-average':
      return `${formatMbps(bitrate.mbps)} VBR`;
    case 'bitrate-cap':
      return `${formatMbps(bitrate.mbps)} CBR`;
  }
}

/** Estimate with its range: "~6.2 Mbps (4.3–8.1) estimated". */
export function describeEstimate(perCameraMbps: ValueRange): string {
  const digits = rangeDigits(perCameraMbps);
  return `~${formatFixed(perCameraMbps.typical, digits)} Mbps (${formatRangeBounds(perCameraMbps, digits)}) estimated`;
}
