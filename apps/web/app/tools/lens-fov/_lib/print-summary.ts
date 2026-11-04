import type { LensFovResult } from '@cctv/calc-core';
import { RESOLUTION_LABELS } from '../../../../lib/camera-labels';
import { formatNumber } from '../../../../lib/format';
import type { LensFovCalculatorState } from '../_state/lens-fov-calculator-state';
import { densityGuidanceRows, type DensityGuidanceRow } from './density-guidance';
import { formatDegrees, formatDensity, formatLength, SENSOR_LABELS } from './lens-fov-labels';
import {
  describeHeadline,
  describeNote,
  describeTarget,
  lensComparisonRows,
  type Headline,
  type LensRow,
} from './result-summary';

/*
 * Content for the printable summary (Export). Pure, so it can be unit tested;
 * PrintSummary only renders it.
 */

export interface LabelledValue {
  label: string;
  value: string;
}

export interface PrintSummary {
  headline: Headline;
  keyFigures: LabelledValue[];
  warnings: string[];
  lensRows: LensRow[];
  /** True when the lens table shows each lens's farthest distance rather than its coverage. */
  solvingDistance: boolean;
  settings: LabelledValue[];
  guidanceRows: DensityGuidanceRow[];
  notes: string[];
}

function settings(state: LensFovCalculatorState, result: LensFovResult): LabelledValue[] {
  const { resolution, sensor } = state;
  const area = `${formatNumber(result.sensor.widthMm, 2)} × ${formatNumber(result.sensor.heightMm, 2)} mm active area`;
  return [
    {
      label: 'Resolution',
      value:
        resolution.kind === 'preset'
          ? `${RESOLUTION_LABELS[resolution.resolution]}, ${result.imageWidthPx} × ${result.imageHeightPx} px`
          : `Custom, ${resolution.width} × ${resolution.height} px`,
    },
    {
      label: 'Sensor',
      value: `${sensor.kind === 'format' ? SENSOR_LABELS[sensor.format] : 'Custom'}, ${area}`,
    },
    { label: 'Lens', value: `${formatNumber(state.focalLengthMm, 1)} mm` },
    state.solveFor === 'coverage'
      ? { label: 'Distance', value: formatLength(result.distanceM, state.lengthUnit) }
      : { label: 'Target', value: describeTarget(state) },
  ];
}

const NOTES = [
  'The lens is treated as distortion-free and aimed straight at a flat target; mounting height and tilt are not modelled. Where the datasheet gives a field of view, use that.',
  'Pixel density is the horizontal pixels divided by the width covered at the target.',
  'The pixel density levels are from IEC 62676-4:2014, one published reference point; the 2025 edition revises them, and other standards use different figures.',
  "Meeting a pixel density doesn't guarantee a person can be recognised or identified: lighting, focus, compression, motion and camera angle matter too.",
];

export function buildPrintSummary(
  state: LensFovCalculatorState,
  result: LensFovResult
): PrintSummary {
  const unit = state.lengthUnit;
  return {
    headline: describeHeadline(state, result),
    keyFigures: [
      {
        label: 'Pixel density',
        value: `${formatDensity(result.pixelsPerMetre, unit)} (${formatDensity(result.pixelsPerMetre, unit === 'ft' ? 'm' : 'ft')})`,
      },
      {
        label: 'Field of view',
        value: `${formatDegrees(result.horizontalFovDeg)} × ${formatDegrees(result.verticalFovDeg)} (${formatDegrees(result.diagonalFovDeg)} diagonal)`,
      },
      { label: '6 ft person', value: `${Math.round(result.personHeightPx)} px tall` },
    ],
    warnings: result.notes.map((note) => describeNote(note, state, result)),
    lensRows: lensComparisonRows(state, result.lensComparison),
    solvingDistance: state.solveFor === 'distance',
    settings: settings(state, result),
    guidanceRows: densityGuidanceRows(),
    notes: NOTES,
  };
}
