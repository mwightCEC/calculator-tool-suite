import {
  type DoriLevel,
  type LensComparisonRow,
  type LensFovNote,
  type LensFovResult,
} from '@cctv/calc-core';
import type { MetricTile } from '../../../../components/ResultsCard/ResultsPanel';
import { RESOLUTION_LABELS } from '../../../../lib/camera-labels';
import { formatNumber } from '../../../../lib/format';
import type { LensFovCalculatorState } from '../_state/lens-fov-calculator-state';
import {
  DENSITY_UNIT_LABELS,
  DORI_LEVEL_LABELS,
  formatDegrees,
  formatDensity,
  formatLength,
  lengthIn,
  SENSOR_LABELS,
} from './lens-fov-labels';

const otherUnit = (state: LensFovCalculatorState) => (state.lengthUnit === 'ft' ? 'm' : 'ft');

/** "Recognition", or "Below detection" under 25 px/m. */
export function describeDoriLevel(level: DoriLevel | null): string {
  return level ? DORI_LEVEL_LABELS[level] : 'Below detection';
}

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

/** What the distance mode aims for: "Recognition" or "80 PPF". */
export function describeTarget(state: LensFovCalculatorState): string {
  return state.target.kind === 'dori'
    ? DORI_LEVEL_LABELS[state.target.level]
    : `${formatNumber(state.target.density, 1)} ${DENSITY_UNIT_LABELS[state.lengthUnit]}`;
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

export interface DoriDistanceRow {
  level: DoriLevel;
  label: string;
  density: string;
  distance: string;
  /** True when the current distance is within this level's farthest distance. */
  met: boolean;
}

/** The farthest distance for each DORI level with this camera and lens. */
export function doriDistanceRows(
  state: LensFovCalculatorState,
  result: LensFovResult
): DoriDistanceRow[] {
  return result.doriDistances.map((row) => ({
    level: row.level,
    label: DORI_LEVEL_LABELS[row.level],
    density: formatDensity(row.pixelsPerMetre, state.lengthUnit),
    distance: formatLength(row.distanceM, state.lengthUnit),
    met: result.distanceM <= row.distanceM * (1 + 1e-9),
  }));
}

export interface LensRow {
  focalLengthMm: number;
  lens: string;
  fov: string;
  /** Coverage width at the distance, or the farthest distance for the target. */
  reach: string;
  density: string;
  level: string;
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
    level: describeDoriLevel(row.doriLevel),
    current: row.focalLengthMm === state.focalLengthMm,
  }));
}

/** Angles and the sensor area used: "90.3° × 58.1° (98.4° diagonal) · 5.63 × 3.17 mm active area" */
export function describeOptics(result: LensFovResult): string {
  const { sensor } = result;
  return (
    `${formatDegrees(result.horizontalFovDeg)} × ${formatDegrees(result.verticalFovDeg)} ` +
    `(${formatDegrees(result.diagonalFovDeg)} diagonal) · ` +
    `${formatNumber(sensor.widthMm, 2)} × ${formatNumber(sensor.heightMm, 2)} mm active area`
  );
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
