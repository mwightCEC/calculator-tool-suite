import {
  activeSensorArea,
  createDefaultLensFovInput,
  DORI_PIXELS_PER_METRE,
  imagePixels,
  lensFovInputSchema,
  MAX_CUSTOM_DENSITY,
  MAX_SENSOR_MM,
  MAX_TARGET_DISTANCE,
  METRES_PER_FOOT,
  MIN_CUSTOM_DENSITY,
  MIN_SENSOR_MM,
  SENSOR_DIAGONAL_MM,
  type CableLengthUnit,
  type DoriLevel,
  type LensFovInput,
  type Resolution,
  type SensorFormat,
  type SolveFor,
} from '@cctv/calc-core';
import type { z } from 'zod';

/*
 * The Lens / FOV calculator's whole state: calc-core's input for one camera.
 * Validated by a schema so it can be restored from a shared link.
 */

export const lensFovCalculatorStateSchema = lensFovInputSchema;
export type LensFovCalculatorState = z.infer<typeof lensFovCalculatorStateSchema>;

/** Value of the resolution, sensor and target choices that opens their custom fields. */
export const CUSTOM = 'custom';

export type LensFovCalculatorAction =
  | { type: 'load-state'; state: LensFovCalculatorState }
  | { type: 'set-resolution'; resolution: Resolution | typeof CUSTOM }
  | { type: 'set-custom-resolution'; changes: Partial<{ width: number; height: number }> }
  | { type: 'set-sensor'; sensor: SensorFormat | typeof CUSTOM }
  | { type: 'set-custom-sensor'; changes: Partial<{ widthMm: number; heightMm: number }> }
  | { type: 'set-focal-length'; focalLengthMm: number }
  | { type: 'set-solve-for'; solveFor: SolveFor }
  | { type: 'set-distance'; distance: number }
  | { type: 'set-dori-target'; level: DoriLevel }
  | { type: 'set-custom-density'; density: number }
  | { type: 'set-length-unit'; unit: CableLengthUnit };

export function createInitialLensFovCalculatorState(): LensFovCalculatorState {
  return createDefaultLensFovInput();
}

const roundTo = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A distance entered in the other unit, converted to `unit` to one decimal and kept within range. */
export function convertDistance(distance: number, unit: CableLengthUnit): number {
  const converted = unit === 'm' ? distance * METRES_PER_FOOT : distance / METRES_PER_FOOT;
  return clamp(roundTo(converted, 1), 0.1, MAX_TARGET_DISTANCE);
}

/** A density per foot or per metre, converted to the other, to one decimal and kept within range. */
export function convertDensity(density: number, unit: CableLengthUnit): number {
  const converted = unit === 'm' ? density / METRES_PER_FOOT : density * METRES_PER_FOOT;
  return clamp(roundTo(converted, 1), MIN_CUSTOM_DENSITY, MAX_CUSTOM_DENSITY);
}

/** The target's pixel density in the state's unit: per foot for feet, per metre for metres. */
export function targetDensity(state: LensFovCalculatorState): number {
  if (state.target.kind === 'custom') {
    return state.target.density;
  }
  const perMetre = DORI_PIXELS_PER_METRE[state.target.level];
  return state.lengthUnit === 'm' ? perMetre : roundTo(perMetre * METRES_PER_FOOT, 1);
}

/** The sensor's current active area, as a custom sensor to start from. */
function customSensorFrom(state: LensFovCalculatorState): LensFovInput['sensor'] {
  if (state.sensor.kind === 'custom') {
    return state.sensor;
  }
  const { width, height } = imagePixels(state.resolution);
  const area = activeSensorArea(
    { kind: 'format', diagonalMm: SENSOR_DIAGONAL_MM[state.sensor.format] },
    width / height
  );
  const mm = (value: number) => clamp(roundTo(value, 2), MIN_SENSOR_MM, MAX_SENSOR_MM);
  return { kind: 'custom', widthMm: mm(area.widthMm), heightMm: mm(area.heightMm) };
}

export function lensFovCalculatorReducer(
  state: LensFovCalculatorState,
  action: LensFovCalculatorAction
): LensFovCalculatorState {
  switch (action.type) {
    case 'load-state':
      return action.state;

    case 'set-resolution':
      if (action.resolution !== CUSTOM) {
        return { ...state, resolution: { kind: 'preset', resolution: action.resolution } };
      }
      // Custom starts from the current image size.
      return state.resolution.kind === 'custom'
        ? state
        : { ...state, resolution: { kind: 'custom', ...imagePixels(state.resolution) } };

    case 'set-custom-resolution':
      return state.resolution.kind === 'custom'
        ? { ...state, resolution: { ...state.resolution, ...action.changes } }
        : state;

    case 'set-sensor':
      return action.sensor === CUSTOM
        ? { ...state, sensor: customSensorFrom(state) }
        : { ...state, sensor: { kind: 'format', format: action.sensor } };

    case 'set-custom-sensor':
      return state.sensor.kind === 'custom'
        ? { ...state, sensor: { ...state.sensor, ...action.changes } }
        : state;

    case 'set-focal-length':
      return { ...state, focalLengthMm: action.focalLengthMm };

    case 'set-solve-for':
      return { ...state, solveFor: action.solveFor };

    case 'set-distance':
      return { ...state, distance: action.distance };

    case 'set-dori-target':
      return { ...state, target: { kind: 'dori', level: action.level } };

    case 'set-custom-density':
      return { ...state, target: { kind: 'custom', density: action.density } };

    case 'set-length-unit':
      if (action.unit === state.lengthUnit) {
        return state;
      }
      return {
        ...state,
        lengthUnit: action.unit,
        distance: convertDistance(state.distance, action.unit),
        target:
          state.target.kind === 'custom'
            ? { kind: 'custom', density: convertDensity(state.target.density, action.unit) }
            : state.target,
      };
  }
}
