import { describe, expect, it } from 'vitest';
import { densityGuidanceRows } from './density-guidance';

describe('densityGuidanceRows', () => {
  it('lists the four levels, lowest density first, in PPM and PPF', () => {
    expect(densityGuidanceRows()).toEqual([
      { label: 'Detection', ppm: '25', ppf: '7.6' },
      { label: 'Observation', ppm: '62.5', ppf: '19.1' },
      { label: 'Recognition', ppm: '125', ppf: '38.1' },
      { label: 'Identification', ppm: '250', ppf: '76.2' },
    ]);
  });
});
