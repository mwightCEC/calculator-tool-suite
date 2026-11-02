import { RESOLUTION_PIXELS } from '../options';
import { cableLengthInMetres, METRES_PER_FOOT } from '../poe/cable-loss';
import { DORI_PIXELS_PER_METRE, doriLevelFor, pixelsPerMetreFromFeet } from './dori';
import { coverageAtDistance, distanceForPixelDensity, fieldOfViewDegrees } from './fov-geometry';
import { DORI_LEVELS, LENS_COMPARISON_MM, type DoriLevel } from './options';
import type { DensityTarget, ImageResolution, LensFovInput, SensorInput } from './schema';
import {
  activeSensorArea,
  SENSOR_DIAGONAL_MM,
  type ActiveSensorArea,
  type SensorSpec,
} from './sensor-formats';

/** Reference person for scale and pixels-on-target: 6 ft. */
export const REFERENCE_PERSON_M = 6 * METRES_PER_FOOT;

/** Wider than this, real lenses usually have strong barrel distortion the model ignores. */
export const WIDE_ANGLE_NOTE_DEG = 110;

export type LensFovNote = 'wide-angle' | 'person-taller-than-frame' | 'sensor-cropped';

export interface DoriDistance {
  level: DoriLevel;
  pixelsPerMetre: number;
  /** Farthest distance that still meets the level, in metres. */
  distanceM: number;
}

export interface LensComparisonRow {
  focalLengthMm: number;
  horizontalFovDeg: number;
  /** Width covered at the result's distance, in metres. */
  horizontalCoverageM: number;
  pixelsPerMetre: number;
  doriLevel: DoriLevel | null;
  /** Farthest distance for the target density, in metres; null when solving for coverage. */
  targetDistanceM: number | null;
}

export interface LensFovResult {
  imageWidthPx: number;
  imageHeightPx: number;
  imageAspect: number;
  sensor: ActiveSensorArea;
  horizontalFovDeg: number;
  verticalFovDeg: number;
  diagonalFovDeg: number;
  /** The entered distance, or the solved one, in metres. */
  distanceM: number;
  horizontalCoverageM: number;
  verticalCoverageM: number;
  /** Horizontal pixels per metre at the target plane: the DORI figure. */
  pixelsPerMetre: number;
  verticalPixelsPerMetre: number;
  /** The highest DORI level met; null below Detection. */
  doriLevel: DoriLevel | null;
  /** The target density in pixels per metre; null when solving for coverage. */
  targetPixelsPerMetre: number | null;
  doriDistances: DoriDistance[];
  /** Pixels across the height of a 6 ft person at the distance. */
  personHeightPx: number;
  personFitsInFrame: boolean;
  lensComparison: LensComparisonRow[];
  notes: LensFovNote[];
}

export function imagePixels(resolution: ImageResolution): { width: number; height: number } {
  return resolution.kind === 'preset' ? RESOLUTION_PIXELS[resolution.resolution] : resolution;
}

function sensorSpec(sensor: SensorInput): SensorSpec {
  return sensor.kind === 'format'
    ? { kind: 'format', diagonalMm: SENSOR_DIAGONAL_MM[sensor.format] }
    : sensor;
}

/** A target density in pixels per metre; a custom one is per foot when lengths are in feet. */
export function targetPixelsPerMetre(
  target: DensityTarget,
  lengthUnit: LensFovInput['lengthUnit']
): number {
  if (target.kind === 'dori') {
    return DORI_PIXELS_PER_METRE[target.level];
  }
  return lengthUnit === 'ft' ? pixelsPerMetreFromFeet(target.density) : target.density;
}

function notesFor(
  horizontalFovDeg: number,
  personFits: boolean,
  sensor: ActiveSensorArea
): LensFovNote[] {
  const notes: LensFovNote[] = [];
  if (horizontalFovDeg > WIDE_ANGLE_NOTE_DEG) {
    notes.push('wide-angle');
  }
  if (!personFits) {
    notes.push('person-taller-than-frame');
  }
  if (sensor.cropped) {
    notes.push('sensor-cropped');
  }
  return notes;
}

export function calculateLensFov(input: LensFovInput): LensFovResult {
  const { width, height } = imagePixels(input.resolution);
  const imageAspect = width / height;
  const sensor = activeSensorArea(sensorSpec(input.sensor), imageAspect);
  const focal = input.focalLengthMm;
  const targetPpm =
    input.solveFor === 'distance' ? targetPixelsPerMetre(input.target, input.lengthUnit) : null;

  const distanceM =
    targetPpm === null
      ? cableLengthInMetres(input.distance, input.lengthUnit)
      : distanceForPixelDensity(width, sensor.widthMm, focal, targetPpm);
  const horizontalCoverageM = coverageAtDistance(sensor.widthMm, focal, distanceM);
  const verticalCoverageM = coverageAtDistance(sensor.heightMm, focal, distanceM);
  const pixelsPerMetre = width / horizontalCoverageM;
  const horizontalFovDeg = fieldOfViewDegrees(sensor.widthMm, focal);
  const personFitsInFrame = REFERENCE_PERSON_M <= verticalCoverageM;

  const lensComparison = LENS_COMPARISON_MM.map((focalLengthMm): LensComparisonRow => {
    const coverageM = coverageAtDistance(sensor.widthMm, focalLengthMm, distanceM);
    return {
      focalLengthMm,
      horizontalFovDeg: fieldOfViewDegrees(sensor.widthMm, focalLengthMm),
      horizontalCoverageM: coverageM,
      pixelsPerMetre: width / coverageM,
      doriLevel: doriLevelFor(width / coverageM),
      targetDistanceM:
        targetPpm === null
          ? null
          : distanceForPixelDensity(width, sensor.widthMm, focalLengthMm, targetPpm),
    };
  });

  return {
    imageWidthPx: width,
    imageHeightPx: height,
    imageAspect,
    sensor,
    horizontalFovDeg,
    verticalFovDeg: fieldOfViewDegrees(sensor.heightMm, focal),
    diagonalFovDeg: fieldOfViewDegrees(sensor.diagonalMm, focal),
    distanceM,
    horizontalCoverageM,
    verticalCoverageM,
    pixelsPerMetre,
    verticalPixelsPerMetre: height / verticalCoverageM,
    doriLevel: doriLevelFor(pixelsPerMetre),
    targetPixelsPerMetre: targetPpm,
    doriDistances: DORI_LEVELS.map((level) => ({
      level,
      pixelsPerMetre: DORI_PIXELS_PER_METRE[level],
      distanceM: distanceForPixelDensity(
        width,
        sensor.widthMm,
        focal,
        DORI_PIXELS_PER_METRE[level]
      ),
    })),
    personHeightPx: (REFERENCE_PERSON_M / verticalCoverageM) * height,
    personFitsInFrame,
    lensComparison,
    notes: notesFor(horizontalFovDeg, personFitsInFrame, sensor),
  };
}
