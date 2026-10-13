/**
 * Relative tolerance for floating-point noise. Decimal unit conversions can
 * turn an exact answer such as 18 TB into 18.000000000000004, which would
 * otherwise round to the wrong whole number of drives or days.
 */
const RELATIVE_TOLERANCE = 1e-9;

/** Math.floor that treats values a hair below an integer as that integer. */
export function floorTolerant(value: number): number {
  return Math.floor(value + Math.abs(value) * RELATIVE_TOLERANCE);
}

/** Math.ceil that treats values a hair above an integer as that integer. */
export function ceilTolerant(value: number): number {
  return Math.ceil(value - Math.abs(value) * RELATIVE_TOLERANCE);
}
