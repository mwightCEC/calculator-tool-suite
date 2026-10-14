import { describe, expect, it } from 'vitest';
import { isPointRange, pointRange, scaleRange, sumRanges } from './range';

describe('ValueRange helpers', () => {
  it('creates a point range', () => {
    expect(pointRange(5)).toEqual({ low: 5, typical: 5, high: 5 });
  });

  it('detects whether a range has collapsed to one value', () => {
    expect(isPointRange(pointRange(5))).toBe(true);
    expect(isPointRange({ low: 4, typical: 5, high: 6 })).toBe(false);
  });

  it('scales every bound', () => {
    expect(scaleRange({ low: 1, typical: 2, high: 3 }, 10)).toEqual({
      low: 10,
      typical: 20,
      high: 30,
    });
  });

  it('sums bounds independently', () => {
    expect(sumRanges([{ low: 1, typical: 2, high: 3 }, pointRange(10)])).toEqual({
      low: 11,
      typical: 12,
      high: 13,
    });
  });

  it('sums an empty list to zero', () => {
    expect(sumRanges([])).toEqual(pointRange(0));
  });
});
