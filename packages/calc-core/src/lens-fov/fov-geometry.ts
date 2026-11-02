/**
 * Rectilinear (pinhole) lens geometry, camera aimed straight at a flat target
 * plane. Sensor sizes and focal lengths in mm, distances in metres:
 *   angle of view   = 2 · atan(s / 2f)
 *   coverage at D   = D · s / f   (= 2 · D · tan(angle / 2))
 *   distance for d  = (pixels / d) · f / s   (d in pixels per metre)
 * Resolution never changes the angle or coverage, only the pixel density.
 */

export function fieldOfViewDegrees(sensorMm: number, focalLengthMm: number): number {
  return (2 * Math.atan(sensorMm / (2 * focalLengthMm)) * 180) / Math.PI;
}

export function coverageAtDistance(
  sensorMm: number,
  focalLengthMm: number,
  distanceM: number
): number {
  return (distanceM * sensorMm) / focalLengthMm;
}

/** The distance at which `pixels` across `sensorMm` spread to `pixelsPerMetre`. */
export function distanceForPixelDensity(
  pixels: number,
  sensorMm: number,
  focalLengthMm: number,
  pixelsPerMetre: number
): number {
  return ((pixels / pixelsPerMetre) * focalLengthMm) / sensorMm;
}
