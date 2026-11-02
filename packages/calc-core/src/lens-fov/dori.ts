import { METRES_PER_FOOT } from '../poe/cable-loss';
import { DORI_LEVELS, type DoriLevel } from './options';

/**
 * IEC 62676-4:2014 horizontal pixel densities at the target, in pixels per
 * metre. The 2025 edition revises these classes; datasheet "DORI distances"
 * and most design tools still use the 2014 values.
 */
export const DORI_PIXELS_PER_METRE: Readonly<Record<DoriLevel, number>> = {
  detection: 25,
  observation: 62.5,
  recognition: 125,
  identification: 250,
};

/** Treats a density a hair below a level (floating-point noise) as meeting it. */
const RELATIVE_TOLERANCE = 1e-9;

/** The highest DORI level a horizontal pixel density meets; null below Detection. */
export function doriLevelFor(pixelsPerMetre: number): DoriLevel | null {
  const met = DORI_LEVELS.filter(
    (level) => pixelsPerMetre >= DORI_PIXELS_PER_METRE[level] * (1 - RELATIVE_TOLERANCE)
  );
  return met.at(-1) ?? null;
}

export function pixelsPerFoot(pixelsPerMetre: number): number {
  return pixelsPerMetre * METRES_PER_FOOT;
}

export function pixelsPerMetreFromFeet(pixelsPerFoot: number): number {
  return pixelsPerFoot / METRES_PER_FOOT;
}
