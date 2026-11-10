import { type LensComparisonRow, type LensFovNote, type LensFovResult } from '@cctv/calc-core';
import type { MetricTile } from '../../../../components/ResultsCard/ResultsPanel';
import { RESOLUTION_LABELS } from '../../../../lib/camera-labels';
import { formatNumber } from '../../../../lib/format';
import type { LensFovCalculatorState } from '../_state/lens-fov-calculator-state';
import {
  DENSITY_UNIT_LABELS,
  formatDegrees,
  formatDensity,
  formatLength,
  lengthIn,
  SENSOR_LABELS,
} from './lens-fov-labels';

const otherUnit = (state: LensFovCalculatorState) => (state.lengthUnit === 'ft' ? 'm' : 'ft');

/** "60.3 × 33.9 ft": horizontal × vertical coverage with the unit once. */
export function describeCoverage(state: LensFovCalculatorState, result: LensFovResult): string {
  const width = formatNumber(lengthIn(result.horizontalCoverageM, state.lengthUnit));
  return `${width} × ${formatLength(result.verticalCoverageM, state.lengthUnit)}`;
}

/** "4MP (1440p) · 1/2.8" · 2.8 mm lens", or the custom sizes. */
export function describeCamera(state: LensFovCalculatorState): string {
  const { resolution, sensor } = state;
  const image =
    resolution.kind === 'preset'
      ? RESOLUTION_LABELS[resolution.resolution]
      : `${resolution.width} × ${resolution.height} px`;
  const sensorText =
    sensor.kind === 'format'
      ? SENSOR_LABELS[sensor.format]
      : `${formatNumber(sensor.widthMm, 2)} × ${formatNumber(sensor.heightMm, 2)} mm sensor`;
  return `${image} · ${sensorText} · ${formatNumber(state.focalLengthMm, 1)} mm lens`;
}

/** What the distance mode aims for: "38.1 PPF". */
export function describeTarget(state: LensFovCalculatorState): string {
  return `${formatNumber(state.target.density, 1)} ${DENSITY_UNIT_LABELS[state.lengthUnit]}`;
}

export interface Headline {
  value: string;
  label: string;
  detail: string;
}

/** Coverage at the distance, or the farthest distance for the target and what it covers there. */
export function describeHeadline(state: LensFovCalculatorState, result: LensFovResult): Headline {
  const coverage = describeCoverage(state, result);
  if (state.solveFor === 'coverage') {
    return {
      value: coverage,
      label: `Coverage at ${formatLength(result.distanceM, state.lengthUnit)}`,
      detail: `${formatDegrees(result.horizontalFovDeg)} horizontal field of view`,
    };
  }
  return {
    value: formatLength(result.distanceM, state.lengthUnit),
    label: `Farthest distance for ${describeTarget(state)}`,
    detail: `Covers ${coverage} there`,
  };
}

export function buildMetricTiles(
  state: LensFovCalculatorState,
  result: LensFovResult
): MetricTile[] {
  return [
    {
      label: 'Pixel density',
      value: formatDensity(result.pixelsPerMetre, state.lengthUnit),
      detail: formatDensity(result.pixelsPerMetre, otherUnit(state)),
    },
    {
      label: 'Field of view',
      value: formatDegrees(result.horizontalFovDeg),
      detail: `${formatDegrees(result.verticalFovDeg)} vertical`,
    },
    {
      label: '6 ft person',
      value: `${formatNumber(Math.round(result.personHeightPx), 0)} px`,
      detail: result.personFitsInFrame ? 'tall in the image' : 'taller than the frame',
    },
  ];
}

export interface LensRow {
  focalLengthMm: number;
  lens: string;
  fov: string;
  /** Coverage width at the distance, or the farthest distance for the target. */
  reach: string;
  density: string;
  current: boolean;
}

/** Common lenses on this camera: coverage at the distance, or each one's farthest distance. */
export function lensComparisonRows(
  state: LensFovCalculatorState,
  rows: LensComparisonRow[]
): LensRow[] {
  return rows.map((row) => ({
    focalLengthMm: row.focalLengthMm,
    lens: `${formatNumber(row.focalLengthMm, 1)} mm`,
    fov: formatDegrees(row.horizontalFovDeg),
    reach: formatLength(row.targetDistanceM ?? row.horizontalCoverageM, state.lengthUnit),
    density: formatDensity(row.pixelsPerMetre, state.lengthUnit),
    current: row.focalLengthMm === state.focalLengthMm,
  }));
}

/** What the lens comparison shows: "At 30 ft with this camera and sensor." */
export function describeLensComparison(
  state: LensFovCalculatorState,
  result: LensFovResult
): string {
  return state.solveFor === 'coverage'
    ? `At ${formatLength(result.distanceM, state.lengthUnit)} with this camera and sensor.`
    : `Farthest distance for ${describeTarget(state)} with this camera and sensor.`;
}

/**
 * The results card's angles row: "90.3° × 58.1° (98.4° diagonal)", with the sensor area
 * used, "5.63 × 3.17 mm active area", under the label.
 */
export function buildOpticsRow(result: LensFovResult): MetricTile {
  const { sensor } = result;
  return {
    label: 'Angles and sensor',
    value:
      `${formatDegrees(result.horizontalFovDeg)} × ${formatDegrees(result.verticalFovDeg)} ` +
      `(${formatDegrees(result.diagonalFovDeg)} diagonal)`,
    detail: `${formatNumber(sensor.widthMm, 2)} × ${formatNumber(sensor.heightMm, 2)} mm active area`,
  };
}

export function describeNote(
  note: LensFovNote,
  state: LensFovCalculatorState,
  result: LensFovResult
): string {
  switch (note) {
    case 'wide-angle':
      return 'Lenses this wide usually have strong barrel distortion, so real coverage can differ. Use the datasheet field of view where there is one.';
    case 'person-taller-than-frame':
      return `A 6 ft person is taller than the ${formatLength(result.verticalCoverageM, state.lengthUnit)} the camera sees at this distance, so only part of them is in frame.`;
    case 'sensor-cropped':
      return "The custom sensor's shape doesn't match the image, so the calculation uses the largest area of the image's shape that fits on it.";
  }
}
