import { describe, expect, it } from 'vitest';
import { SENSOR_FORMATS } from './options';
import { activeSensorArea, SENSOR_DIAGONAL_MM } from './sensor-formats';

const FOUR_THREE_SENSOR = { kind: 'custom' as const, widthMm: 4.8, heightMm: 3.6 };

describe('SENSOR_DIAGONAL_MM', () => {
  it('has a diagonal for every format, growing with the type', () => {
    const diagonals = SENSOR_FORMATS.map((format) => SENSOR_DIAGONAL_MM[format]);
    expect(diagonals).toEqual([...diagonals].sort((a, b) => a - b));
  });
});

describe('activeSensorArea', () => {
  it("fits a sensor type's diagonal to the image's aspect ratio", () => {
    const fourThree = activeSensorArea({ kind: 'format', diagonalMm: 6.46 }, 4 / 3);
    expect(fourThree.widthMm).toBeCloseTo(5.168, 6);
    expect(fourThree.heightMm).toBeCloseTo(3.876, 6);
    expect(fourThree.cropped).toBe(false);

    // Sony IMX327 (1/2.8", 16:9) is 5.57 × 3.13 mm.
    const sixteenNine = activeSensorArea({ kind: 'format', diagonalMm: 6.46 }, 16 / 9);
    expect(sixteenNine.widthMm).toBeCloseTo(5.6304, 3);
    expect(sixteenNine.heightMm).toBeCloseTo(3.1671, 3);
    expect(sixteenNine.diagonalMm).toBe(6.46);
  });

  it('uses a custom sensor as entered when its shape matches the image', () => {
    expect(activeSensorArea(FOUR_THREE_SENSOR, 4 / 3)).toEqual({
      widthMm: 4.8,
      heightMm: 3.6,
      diagonalMm: 6,
      cropped: false,
    });
  });

  it('crops the height of a custom sensor taller than the image', () => {
    expect(activeSensorArea(FOUR_THREE_SENSOR, 16 / 9)).toMatchObject({
      widthMm: 4.8,
      heightMm: 2.7,
      cropped: true,
    });
  });

  it('crops the width of a custom sensor wider than the image', () => {
    const area = activeSensorArea({ kind: 'custom', widthMm: 5.6, heightMm: 3.15 }, 4 / 3);
    expect(area.cropped).toBe(true);
    expect(area.heightMm).toBe(3.15);
    expect(area.widthMm).toBeCloseTo(4.2, 10);
  });
});
