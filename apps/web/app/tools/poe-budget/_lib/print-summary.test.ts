import { calculatePoe } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialPoeCalculatorState,
  poeCalculatorReducer,
  type PoeCalculatorAction,
  type PoeCalculatorState,
} from '../_state/poe-calculator-state';
import { buildPrintSummary } from './print-summary';

function stateAfter(...actions: PoeCalculatorAction[]): PoeCalculatorState {
  return actions.reduce(poeCalculatorReducer, createInitialPoeCalculatorState());
}

function summarize(state: PoeCalculatorState) {
  return buildPrintSummary(state, calculatePoe(state));
}

describe('buildPrintSummary', () => {
  it('summarises the defaults', () => {
    const summary = summarize(createInitialPoeCalculatorState());
    expect(summary.usage).toEqual({ value: '24.7 W', detail: 'of 96 W usable' });
    expect(summary.statusLabel).toBe('Within budget');
    expect(summary.keyFigures).toEqual([
      { label: 'Remaining', value: '71.3 W left' },
      { label: 'PoE budget', value: '120 W' },
      { label: 'Reserve', value: '20% (24 W)' },
      { label: 'Ports', value: '4 of 8 PoE ports used' },
    ]);
    expect(summary.problems).toEqual([]);
    expect(summary.groups).toEqual([
      {
        key: 'g1',
        name: 'Camera group 1',
        devices: '4',
        power: '6 W max',
        cable: '100 m assumed',
        perDevice: '6.2 W',
        total: '24.7 W',
      },
    ]);
    expect(summary.settings).toContainEqual({
      label: 'Port standard',
      value: 'PoE+ (802.3at, 30 W)',
    });
    expect(summary.notes).toHaveLength(3);
  });

  it('uses group names, classes and cable lengths', () => {
    const summary = summarize(
      stateAfter(
        { type: 'set-power-input', id: 'g1', input: 'class' },
        { type: 'update-group', id: 'g1', changes: { name: 'PTZ', cableLength: 150 } }
      )
    );
    expect(summary.groups[0]).toEqual(
      expect.objectContaining({
        name: 'PTZ',
        power: 'Class 3',
        cable: '150 ft',
        perDevice: '15.4 W',
      })
    );
    // No group is entered by watts, so the cable-loss note is left out.
    expect(summary.notes).toHaveLength(2);
  });

  it('lists the problems', () => {
    const summary = summarize(stateAfter({ type: 'update-switch', changes: { ports: 2 } }));
    expect(summary.problems).toEqual(['4 devices but only 2 PoE ports.']);
  });
});
