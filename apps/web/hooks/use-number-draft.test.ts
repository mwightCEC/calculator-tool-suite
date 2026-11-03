import { describe, expect, it } from 'vitest';
import { describeCorrection, describeOverMaximum } from './use-number-draft';

const hours = { min: 1, max: 24, format: (value: number) => `${value} hours` };

describe('describeOverMaximum', () => {
  it('flags a typed number over the maximum', () => {
    expect(describeOverMaximum(25, hours)).toBe('Maximum 24 hours');
  });

  it('waits for more digits below the minimum, and ignores empty fields', () => {
    expect(describeOverMaximum(0, hours)).toBeNull();
    expect(describeOverMaximum(12, hours)).toBeNull();
    expect(describeOverMaximum('', hours)).toBeNull();
  });
});

describe('describeCorrection', () => {
  it('says nothing when the typed number was kept', () => {
    expect(describeCorrection(12, 12, hours)).toBeNull();
  });

  it('names the limit a number was changed to', () => {
    expect(describeCorrection(25, 24, hours)).toBe('Changed to 24 hours, the maximum.');
    expect(describeCorrection(1, 3, { min: 3, max: 64 })).toBe('Changed to 3, the minimum.');
  });

  it('explains rounding and steps inside the range', () => {
    expect(describeCorrection(5, 6, { min: 4, max: 64 })).toBe(
      'Changed to 6, the nearest allowed value.'
    );
  });
});
