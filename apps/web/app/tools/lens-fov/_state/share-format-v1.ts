import type {
  CableLengthUnit,
  DoriLevel,
  Resolution,
  SensorFormat,
  SolveFor,
} from '@cctv/calc-core';
import { z } from 'zod';
import { levelDensity, type LensFovCalculatorState } from './lens-fov-calculator-state';

/*
 * Lens / FOV share link format v1: a compact positional JSON array.
 *
 *   [resolution, sensor, focalLengthMm, solveFor, distance, target, lengthUnit]
 *   resolution = tier index, or [width, height] in pixels for a custom size
 *   sensor     = sensor type index, or [widthMm, heightMm] for a custom sensor
 *   target     = [density] per foot or metre; older links may hold a published level's
 *                index instead, which opens as that level's density
 *
 * Choices are stored as indexes into the tables below. Those tables ARE the
 * format: only ever append to them. Reordering or removing an entry would make
 * existing links decode to the wrong value; a change like that needs a new
 * format version. The camera view / coverage choice and the pixel grid are
 * page settings and are not stored.
 */

export const V1_RESOLUTIONS = [
  'nHD',
  '960H',
  '1MP',
  '2MP',
  '3MP',
  '4MP',
  '5MP',
  '6MP',
  '8MP',
  '12MP',
] as const satisfies readonly Resolution[];
export const V1_SENSOR_FORMATS = [
  '1/4',
  '1/3',
  '1/2.9',
  '1/2.8',
  '1/2.7',
  '1/2.5',
  '1/2',
  '1/1.8',
  '1/1.2',
] as const satisfies readonly SensorFormat[];
export const V1_SOLVE_FOR = ['coverage', 'distance'] as const satisfies readonly SolveFor[];
/** Published levels that older links stored as the target; read, no longer written. */
export const V1_DORI_LEVELS = [
  'detection',
  'observation',
  'recognition',
  'identification',
] as const satisfies readonly DoriLevel[];
export const V1_LENGTH_UNITS = ['ft', 'm'] as const satisfies readonly CableLengthUnit[];

const index = z.int().nonnegative();
const pair = z.tuple([z.number(), z.number()]);

/** Shape check only; value ranges are validated afterwards by the state schema. */
const payloadSchema = z.tuple([
  z.union([index, pair]),
  z.union([index, pair]),
  z.number(),
  index,
  z.number(),
  z.union([index, z.tuple([z.number()])]),
  index,
]);

type Payload = z.infer<typeof payloadSchema>;

export function stateToV1Payload(state: LensFovCalculatorState): Payload {
  const { resolution, sensor, target } = state;
  return [
    resolution.kind === 'preset'
      ? V1_RESOLUTIONS.indexOf(resolution.resolution)
      : [resolution.width, resolution.height],
    sensor.kind === 'format'
      ? V1_SENSOR_FORMATS.indexOf(sensor.format)
      : [sensor.widthMm, sensor.heightMm],
    state.focalLengthMm,
    V1_SOLVE_FOR.indexOf(state.solveFor),
    state.distance,
    [target.density],
    V1_LENGTH_UNITS.indexOf(state.lengthUnit),
  ];
}

/**
 * Turns a decoded v1 payload back into a state-shaped object, or null when the
 * shape is wrong. An out-of-range index becomes undefined, so the caller's
 * lensFovCalculatorStateSchema check (which also covers value ranges) rejects it.
 */
export function v1PayloadToState(raw: unknown): unknown {
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const [resolution, sensor, focalLengthMm, solveForIndex, distance, target, unitIndex] =
    parsed.data;

  const lengthUnit = V1_LENGTH_UNITS[unitIndex];
  const level = typeof target === 'number' ? V1_DORI_LEVELS[target] : undefined;
  // An out-of-range level or unit leaves the density undefined, for the schema to reject.
  const levelValue = level && lengthUnit ? levelDensity(level, lengthUnit) : undefined;
  const density = typeof target === 'number' ? levelValue : target[0];

  return {
    resolution:
      typeof resolution === 'number'
        ? { kind: 'preset', resolution: V1_RESOLUTIONS[resolution] }
        : { kind: 'custom', width: resolution[0], height: resolution[1] },
    sensor:
      typeof sensor === 'number'
        ? { kind: 'format', format: V1_SENSOR_FORMATS[sensor] }
        : { kind: 'custom', widthMm: sensor[0], heightMm: sensor[1] },
    focalLengthMm,
    solveFor: V1_SOLVE_FOR[solveForIndex],
    distance,
    target: { kind: 'custom', density },
    lengthUnit,
  };
}
