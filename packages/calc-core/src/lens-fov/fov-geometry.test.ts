import { describe, expect, it } from 'vitest';
import { coverageAtDistance, distanceForPixelDensity, fieldOfViewDegrees } from './fov-geometry';

describe('fieldOfViewDegrees', () => {
  it('is 2 · atan(s / 2f)', () => {
    expect(fieldOfViewDegrees(4.8, 4)).toBeCloseTo(61.9275, 3);
    expect(fieldOfViewDegrees(4.8, 12)).toBeCloseTo(22.6199, 3);
    expect(fieldOfViewDegrees(3.6, 4)).toBeCloseTo(48.4555, 3);
  });

  it('is exactly 90° when the focal length is half the sensor size', () => {
    expect(fieldOfViewDegrees(6, 3)).toBeCloseTo(90, 10);
  });
});

describe('coverageAtDistance', () => {
  it('is D · s / f', () => {
    expect(coverageAtDistance(4.8, 4, 10)).toBeCloseTo(12, 10);
    expect(coverageAtDistance(3.6, 4, 10)).toBeCloseTo(9, 10);
  });

  it('agrees with 2 · D · tan(angle / 2)', () => {
    const halfAngle = (fieldOfViewDegrees(5.168, 2.8) * Math.PI) / 360;
    expect(coverageAtDistance(5.168, 2.8, 7.62)).toBeCloseTo(2 * 7.62 * Math.tan(halfAngle), 10);
  });
});

describe('distanceForPixelDensity', () => {
  it('is (pixels / density) · f / s', () => {
    expect(distanceForPixelDensity(1920, 4.8, 4, 160)).toBeCloseTo(10, 10);
  });

  it('gives back the density it was asked for', () => {
    const distance = distanceForPixelDensity(2592, 5.168, 2.8, 250);
    expect(2592 / coverageAtDistance(5.168, 2.8, distance)).toBeCloseTo(250, 8);
  });
});
