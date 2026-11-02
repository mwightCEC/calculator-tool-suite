import { z } from 'zod';
import { RESOLUTIONS } from '../options';
import { CABLE_LENGTH_UNITS } from '../poe/options';
import {
  DORI_LEVELS,
  MAX_CUSTOM_DENSITY,
  MAX_FOCAL_LENGTH_MM,
  MAX_IMAGE_PIXELS,
  MAX_SENSOR_MM,
  MAX_TARGET_DISTANCE,
  MIN_CUSTOM_DENSITY,
  MIN_FOCAL_LENGTH_MM,
  MIN_IMAGE_PIXELS,
  MIN_SENSOR_MM,
  SENSOR_FORMATS,
  SOLVE_FOR,
} from './options';

const imagePixels = z.int().min(MIN_IMAGE_PIXELS).max(MAX_IMAGE_PIXELS);
const sensorMm = z.number().min(MIN_SENSOR_MM).max(MAX_SENSOR_MM);

/** A resolution tier, or a custom image size in pixels. */
export const imageResolutionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('preset'), resolution: z.enum(RESOLUTIONS) }),
  z.object({ kind: z.literal('custom'), width: imagePixels, height: imagePixels }),
]);

/** A sensor type, or a custom sensor's width × height in mm. */
export const sensorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('format'), format: z.enum(SENSOR_FORMATS) }),
  z.object({ kind: z.literal('custom'), widthMm: sensorMm, heightMm: sensorMm }),
]);

/** The pixel density to reach: a DORI level, or a custom density per foot or metre (the length unit's). */
export const densityTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('dori'), level: z.enum(DORI_LEVELS) }),
  z.object({
    kind: z.literal('custom'),
    density: z.number().min(MIN_CUSTOM_DENSITY).max(MAX_CUSTOM_DENSITY),
  }),
]);

/** One camera aimed straight at a flat target plane. */
export const lensFovInputSchema = z.object({
  resolution: imageResolutionSchema,
  sensor: sensorSchema,
  focalLengthMm: z.number().min(MIN_FOCAL_LENGTH_MM).max(MAX_FOCAL_LENGTH_MM),
  solveFor: z.enum(SOLVE_FOR),
  /** Camera to target plane in the length unit; used when solving for coverage. */
  distance: z.number().positive().max(MAX_TARGET_DISTANCE),
  /** Used when solving for distance. */
  target: densityTargetSchema,
  lengthUnit: z.enum(CABLE_LENGTH_UNITS),
});

export type ImageResolution = z.infer<typeof imageResolutionSchema>;
export type SensorInput = z.infer<typeof sensorSchema>;
export type DensityTarget = z.infer<typeof densityTargetSchema>;
export type LensFovInput = z.infer<typeof lensFovInputSchema>;

/** Defaults: 4MP, 1/2.8", 2.8 mm, 30 ft, coverage mode; Recognition when solving for distance. */
export function createDefaultLensFovInput(): LensFovInput {
  return {
    resolution: { kind: 'preset', resolution: '4MP' },
    sensor: { kind: 'format', format: '1/2.8' },
    focalLengthMm: 2.8,
    solveFor: 'coverage',
    distance: 30,
    target: { kind: 'dori', level: 'recognition' },
    lengthUnit: 'ft',
  };
}
