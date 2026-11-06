import { describe, expect, it } from 'vitest';
import { remainingDetail, remainingLabel } from './reserve-tile';

describe('remainingLabel', () => {
  it('says Remaining while there is room, else Short by', () => {
    expect(remainingLabel(false)).toBe('Remaining');
    expect(remainingLabel(true)).toBe('Short by');
  });
});

describe('remainingDetail', () => {
  it('names the reserve', () => {
    expect(remainingDetail(false, 20)).toBe('before the reserve');
    expect(remainingDetail(true, 20)).toBe('keeping the 20% reserve');
  });

  it('says nothing about a reserve of 0%', () => {
    expect(remainingDetail(false, 0)).toBeNull();
    expect(remainingDetail(true, 0)).toBeNull();
  });
});
