import type { SensorFormat } from './options';

/**
 * Image diagonal per sensor type, in mm. The same type is sold in 4:3 and 16:9
 * versions with about the same diagonal, so the diagonal is what is stored;
 * activeSensorArea() fits the image's aspect ratio to it.
 *
 * Sources:
 * - 1/2.9", 1/2.8", 1/1.2": Sony datasheets for sensors common in CCTV
 *   (IMX323 "diagonal 6.23 mm (Type 1/2.9)"; IMX327 / IMX307 / IMX290
 *   "diagonal 6.46 mm (Type 1/2.8)"; IMX485 "Type 1/1.2": 3864 × 2176 active
 *   pixels × 2.9 µm = 11.21 × 6.31 mm, 12.86 mm diagonal).
 * - Others: the standard optical-format table, e.g. 1/3" = 6.00 mm,
 *   1/2.7" = 6.72 mm, 1/1.8" = 8.93 mm.
 */
export const SENSOR_DIAGONAL_MM: Readonly<Record<SensorFormat, number>> = {
  '1/4': 4.5,
  '1/3': 6.0,
  '1/2.9': 6.23,
  '1/2.8': 6.46,
  '1/2.7': 6.72,
  '1/2.5': 7.18,
  '1/2': 8.0,
  '1/1.8': 8.93,
  '1/1.2': 12.86,
};

export interface SensorSize {
  widthMm: number;
  heightMm: number;
}

/** A sensor given by its type (diagonal only) or by its width × height. */
export type SensorSpec = { kind: 'format'; diagonalMm: number } | ({ kind: 'custom' } & SensorSize);

export interface ActiveSensorArea extends SensorSize {
  diagonalMm: number;
  /** True when a custom sensor's shape didn't match the image and was centre-cropped to it. */
  cropped: boolean;
}

/** Custom sensors within 1% of the image's aspect ratio are used as entered. */
const ASPECT_MATCH_TOLERANCE = 0.01;

/**
 * The part of the sensor that forms the image, in the image's aspect ratio so
 * the picture is never stretched:
 * - A sensor type's active area is the rectangle with its diagonal in the
 *   image's aspect ratio (1/2.8" at 16:9: 5.63 × 3.17 mm; IMX327 is 5.57 × 3.13 mm).
 * - A custom sensor is used as entered; when its shape differs from the image,
 *   the largest centred rectangle in the image's aspect ratio is used instead.
 */
export function activeSensorArea(sensor: SensorSpec, imageAspect: number): ActiveSensorArea {
  if (sensor.kind === 'format') {
    const heightMm = sensor.diagonalMm / Math.sqrt(1 + imageAspect * imageAspect);
    return {
      widthMm: heightMm * imageAspect,
      heightMm,
      diagonalMm: sensor.diagonalMm,
      cropped: false,
    };
  }
  const sensorAspect = sensor.widthMm / sensor.heightMm;
  const cropped = Math.abs(imageAspect / sensorAspect - 1) > ASPECT_MATCH_TOLERANCE;
  let { widthMm, heightMm } = sensor;
  if (cropped && imageAspect > sensorAspect) {
    heightMm = widthMm / imageAspect;
  } else if (cropped) {
    widthMm = heightMm * imageAspect;
  }
  return { widthMm, heightMm, diagonalMm: Math.hypot(widthMm, heightMm), cropped };
}
