import { describe, expect, it } from 'vitest';
import { pointRange } from '../range';
import { checkLink, LINK_CAUTION_ABOVE, LINK_OVER_CAPACITY_ABOVE, linkStatus } from './link-checks';

describe('linkStatus', () => {
  it.each([
    [0, 'ok'],
    [0.5, 'ok'],
    [0.7, 'ok'],
    [0.7001, 'caution'],
    [0.9, 'caution'],
    [0.9001, 'over-capacity'],
    [1.5, 'over-capacity'],
  ] as const)('utilisation %d is %s', (utilisation, status) => {
    expect(linkStatus(utilisation)).toBe(status);
  });

  it('uses the spec thresholds of 70% and 90%', () => {
    expect([LINK_CAUTION_ABOVE, LINK_OVER_CAPACITY_ABOVE]).toEqual([0.7, 0.9]);
  });
});

describe('checkLink', () => {
  it('judges utilisation on the high estimate', () => {
    const check = checkLink('recorder-limit', 100, { low: 40, typical: 60, high: 80 });
    expect(check).toEqual({
      link: 'recorder-limit',
      capacityMbps: 100,
      loadMbps: { low: 40, typical: 60, high: 80 },
      utilisation: 0.8,
      status: 'caution',
    });
  });

  it('reports a link that is exactly full as over capacity', () => {
    expect(checkLink('uplink', 100, pointRange(100)).status).toBe('over-capacity');
  });
});
