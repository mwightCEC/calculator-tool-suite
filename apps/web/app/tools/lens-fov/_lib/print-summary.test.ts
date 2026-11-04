import { calculateLensFov } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialLensFovCalculatorState,
  lensFovCalculatorReducer,
  type LensFovCalculatorAction,
  type LensFovCalculatorState,
} from '../_state/lens-fov-calculator-state';
import { buildPrintSummary } from './print-summary';

function stateAfter(...actions: LensFovCalculatorAction[]): LensFovCalculatorState {
  return actions.reduce(lensFovCalculatorReducer, createInitialLensFovCalculatorState());
}

function summarize(state: LensFovCalculatorState) {
  return buildPrintSummary(state, calculateLensFov(state));
}

describe('buildPrintSummary', () => {
  it('summarises the defaults', () => {
    const summary = summarize(createInitialLensFovCalculatorState());
    expect(summary.headline.value).toBe('60.3 × 33.9 ft');
    expect(summary.keyFigures).toEqual([
      { label: 'Pixel density', value: '42.4 PPF (139 PPM)' },
      { label: 'Field of view', value: '90.3° × 59° (98.2° diagonal)' },
      { label: '6 ft person', value: '255 px tall' },
    ]);
    expect(summary.warnings).toEqual([]);
    expect(summary.guidanceRows.map((row) => row.label)).toEqual([
      'Detection',
      'Observation',
      'Recognition',
      'Identification',
    ]);
    expect(summary.lensRows).toHaveLength(6);
    expect(summary.solvingDistance).toBe(false);
    expect(summary.settings).toEqual([
      { label: 'Resolution', value: '4MP (1440p), 2560 × 1440 px' },
      { label: 'Sensor', value: '1/2.8", 5.63 × 3.17 mm active area' },
      { label: 'Lens', value: '2.8 mm' },
      { label: 'Distance', value: '30 ft' },
    ]);
    expect(summary.notes.some((note) => note.includes('IEC 62676-4:2014'))).toBe(true);
  });

  it('names custom sizes and the target when solving for distance in metres', () => {
    const summary = summarize(
      stateAfter(
        { type: 'set-resolution', resolution: 'custom' },
        { type: 'set-sensor', sensor: 'custom' },
        { type: 'set-solve-for', solveFor: 'distance' },
        { type: 'set-length-unit', unit: 'm' }
      )
    );
    expect(summary.keyFigures[0]?.value).toBe('125 PPM (38.1 PPF)');
    expect(summary.solvingDistance).toBe(true);
    expect(summary.settings).toEqual([
      { label: 'Resolution', value: 'Custom, 2560 × 1440 px' },
      { label: 'Sensor', value: 'Custom, 5.63 × 3.17 mm active area' },
      { label: 'Lens', value: '2.8 mm' },
      { label: 'Target', value: '125 PPM' },
    ]);
  });

  it('carries the warnings', () => {
    const summary = summarize(
      stateAfter(
        { type: 'set-focal-length', focalLengthMm: 50 },
        { type: 'set-distance', distance: 10 }
      )
    );
    expect(summary.warnings).toHaveLength(1);
    expect(summary.warnings[0]).toMatch(/taller than/);
  });
});
