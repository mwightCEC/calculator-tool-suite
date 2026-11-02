// Allowed values for Lens / FOV calculator inputs. Display labels live in the UI.

/**
 * CCTV sensor formats by their fractional-inch type. The type is a legacy
 * optical-format name, not the sensor's width; diagonals are in sensor-formats.ts.
 */
export const SENSOR_FORMATS = [
  '1/4',
  '1/3',
  '1/2.9',
  '1/2.8',
  '1/2.7',
  '1/2.5',
  '1/2',
  '1/1.8',
  '1/1.2',
] as const;
export type SensorFormat = (typeof SENSOR_FORMATS)[number];

/**
 * What the calculator solves for:
 * - `coverage`: coverage and pixel density at an entered distance.
 * - `distance`: the farthest distance that still reaches a target pixel density.
 */
export const SOLVE_FOR = ['coverage', 'distance'] as const;
export type SolveFor = (typeof SOLVE_FOR)[number];

/** IEC 62676-4 DORI levels, lowest density first; pixel densities in dori.ts. */
export const DORI_LEVELS = ['detection', 'observation', 'recognition', 'identification'] as const;
export type DoriLevel = (typeof DORI_LEVELS)[number];

/** Focal lengths offered in the lens picker, in mm. */
export const COMMON_FOCAL_LENGTHS_MM = [2.1, 2.8, 3.6, 4, 6, 8, 12, 16, 25, 50] as const;

/** Focal lengths compared in the results breakdown, in mm. */
export const LENS_COMPARISON_MM = [2.8, 4, 6, 8, 12, 25] as const;

export const MIN_FOCAL_LENGTH_MM = 0.8;
export const MAX_FOCAL_LENGTH_MM = 300;
export const MIN_SENSOR_MM = 1;
export const MAX_SENSOR_MM = 50;
export const MIN_IMAGE_PIXELS = 160;
export const MAX_IMAGE_PIXELS = 16_384;
/** Upper bound for a distance the user types, in either length unit. */
export const MAX_TARGET_DISTANCE = 5000;
/** Bounds for a custom pixel density, per foot or per metre to match the length unit. */
export const MIN_CUSTOM_DENSITY = 1;
export const MAX_CUSTOM_DENSITY = 10_000;
