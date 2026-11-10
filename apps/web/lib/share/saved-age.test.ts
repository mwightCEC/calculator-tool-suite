import { describe, expect, it } from 'vitest';
import { describeSavedAge } from './saved-age';

const MINUTE = 60 * 1000;

describe('describeSavedAge', () => {
  it('says less than a minute for very recent saves, and for clock skew', () => {
    expect(describeSavedAge(0)).toBe('less than a minute ago');
    expect(describeSavedAge(59 * 1000)).toBe('less than a minute ago');
    expect(describeSavedAge(-5000)).toBe('less than a minute ago');
  });

  it('gives whole minutes under an hour', () => {
    expect(describeSavedAge(MINUTE)).toBe('1 min ago');
    expect(describeSavedAge(12.7 * MINUTE)).toBe('12 min ago');
    expect(describeSavedAge(59 * MINUTE)).toBe('59 min ago');
  });

  it('gives hours, with any leftover minutes', () => {
    expect(describeSavedAge(60 * MINUTE)).toBe('1 hr ago');
    expect(describeSavedAge(65 * MINUTE)).toBe('1 hr 5 min ago');
    expect(describeSavedAge(240 * MINUTE)).toBe('4 hr ago');
  });
});
