import {
  CABLE_LENGTH_UNITS,
  COMMON_FOCAL_LENGTHS_MM,
  METRES_PER_FOOT,
  SENSOR_FORMATS,
  SOLVE_FOR,
  type CableLengthUnit,
  type DoriLevel,
  type SensorFormat,
  type SolveFor,
} from '@cctv/calc-core';
import { RESOLUTION_SELECT_DATA, toOptions } from '../../../../lib/camera-labels';
import { formatNumber } from '../../../../lib/format';
import { CUSTOM } from '../_state/lens-fov-calculator-state';

// Display labels and formatting for the Lens / FOV calculator.

export const SENSOR_LABELS: Record<SensorFormat, string> = {
  '1/4': '1/4"',
  '1/3': '1/3"',
  '1/2.9': '1/2.9"',
  '1/2.8': '1/2.8"',
  '1/2.7': '1/2.7"',
  '1/2.5': '1/2.5"',
  '1/2': '1/2"',
  '1/1.8': '1/1.8"',
  '1/1.2': '1/1.2"',
};

export const SOLVE_FOR_LABELS: Record<SolveFor, string> = {
  coverage: 'Coverage',
  distance: 'Farthest distance',
};

export const DORI_LEVEL_LABELS: Record<DoriLevel, string> = {
  detection: 'Detection',
  observation: 'Observation',
  recognition: 'Recognition',
  identification: 'Identification',
};

const CUSTOM_OPTION = { value: CUSTOM, label: 'Custom' };

export const RESOLUTION_OPTIONS = [...RESOLUTION_SELECT_DATA, CUSTOM_OPTION];
export const SENSOR_OPTIONS = [...toOptions(SENSOR_FORMATS, SENSOR_LABELS), CUSTOM_OPTION];
export const LENS_OPTIONS = [
  ...COMMON_FOCAL_LENGTHS_MM.map((mm) => ({ value: String(mm), label: `${mm} mm` })),
  CUSTOM_OPTION,
];
export const SOLVE_FOR_OPTIONS = toOptions(SOLVE_FOR, SOLVE_FOR_LABELS);

export const LENGTH_UNIT_OPTIONS = toOptions(CABLE_LENGTH_UNITS, { ft: 'ft', m: 'm' });
/** Pixel density units, keyed by the length unit they go with. */
export const DENSITY_UNIT_LABELS: Record<CableLengthUnit, string> = { ft: 'PPF', m: 'PPM' };
export const DENSITY_UNIT_OPTIONS = toOptions(CABLE_LENGTH_UNITS, DENSITY_UNIT_LABELS);

/** A length in metres, in feet or metres. */
export function lengthIn(metres: number, unit: CableLengthUnit): number {
  return unit === 'm' ? metres : metres / METRES_PER_FOOT;
}

/** "60.3 ft" or "18.4 m", from metres. */
export function formatLength(metres: number, unit: CableLengthUnit): string {
  return `${formatNumber(lengthIn(metres, unit))} ${unit}`;
}

/** A pixel density per metre, per foot or per metre. */
export function densityIn(pixelsPerMetre: number, unit: CableLengthUnit): number {
  return unit === 'm' ? pixelsPerMetre : pixelsPerMetre * METRES_PER_FOOT;
}

/** "42.4 PPF" or "139 PPM", from pixels per metre. */
export function formatDensity(pixelsPerMetre: number, unit: CableLengthUnit): string {
  return `${formatNumber(densityIn(pixelsPerMetre, unit))} ${DENSITY_UNIT_LABELS[unit]}`;
}

export const formatDegrees = (degrees: number) => `${formatNumber(degrees, 1)}°`;
