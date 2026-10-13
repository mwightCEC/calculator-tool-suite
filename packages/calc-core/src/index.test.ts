import { describe, expect, it } from 'vitest';
import { BYTES_PER_TB } from './index';

describe('calc-core scaffold', () => {
  it('uses decimal terabytes', () => {
    expect(BYTES_PER_TB).toBe(1_000_000_000_000);
  });
});
