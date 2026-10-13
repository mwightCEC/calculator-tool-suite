import { describe, expect, it } from 'vitest';
import { ceilTolerant, floorTolerant } from './rounding';

describe('floorTolerant', () => {
  it('floors ordinary values', () => {
    expect(floorTolerant(87.5)).toBe(87);
    expect(floorTolerant(0)).toBe(0);
  });

  it('treats values a hair below an integer as that integer', () => {
    expect(floorTolerant(4999.999999999999)).toBe(5000);
    expect(floorTolerant(123_456_789.99999999)).toBe(123_456_790);
  });

  it('does not round up values meaningfully below an integer', () => {
    expect(floorTolerant(29.999)).toBe(29);
  });
});

describe('ceilTolerant', () => {
  it('ceils ordinary values', () => {
    expect(ceilTolerant(2.1)).toBe(3);
    expect(ceilTolerant(0)).toBe(0);
  });

  it('treats values a hair above an integer as that integer', () => {
    expect(ceilTolerant(3.0000000000000004)).toBe(3);
  });

  it('does not round down values meaningfully above an integer', () => {
    expect(ceilTolerant(3.001)).toBe(4);
  });
});
