import { z } from 'zod';

/*
 * Simple or Advanced input, per calculator. Simple is one camera setup with
 * fewer settings, each hidden setting fixed at a known value; Advanced is the
 * full page with camera groups. Kept apart from Storage's calculation mode.
 */

export const INPUT_MODES = ['simple', 'advanced'] as const;
export type InputMode = (typeof INPUT_MODES)[number];

export const inputModeSchema = z.enum(INPUT_MODES);

export const INPUT_MODE_OPTIONS: { value: InputMode; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'advanced', label: 'Advanced' },
];

/** Simple mode keeps only the first camera group; the same array when there is just one. */
export function firstGroupOnly<T>(groups: T[]): T[] {
  return groups.length <= 1 ? groups : groups.slice(0, 1);
}
