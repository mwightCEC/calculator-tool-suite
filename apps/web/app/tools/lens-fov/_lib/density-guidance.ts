import { DORI_LEVELS, DORI_PIXELS_PER_METRE } from '@cctv/calc-core';
import { formatNumber } from '../../../../lib/format';
import { DORI_LEVEL_LABELS, densityIn } from './lens-fov-labels';

export interface DensityGuidanceRow {
  label: string;
  /** Pixels per metre, as published. */
  ppm: string;
  /** Pixels per foot, rounded. */
  ppf: string;
}

/** The IEC 62676-4:2014 levels, lowest density first: "Detection", "25", "7.6". */
export function densityGuidanceRows(): DensityGuidanceRow[] {
  return DORI_LEVELS.map((level) => {
    const pixelsPerMetre = DORI_PIXELS_PER_METRE[level];
    return {
      label: DORI_LEVEL_LABELS[level],
      ppm: formatNumber(pixelsPerMetre, 1),
      ppf: formatNumber(densityIn(pixelsPerMetre, 'ft'), 1),
    };
  });
}
