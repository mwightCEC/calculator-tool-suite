import { calculateVoltageDrop } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialVoltageDropCalculatorState,
  voltageDropCalculatorReducer,
  type VoltageDropCalculatorAction,
  type VoltageDropCalculatorState,
} from '../_state/voltage-drop-calculator-state';
import { buildPrintSummary } from './print-summary';

function stateAfter(...actions: VoltageDropCalculatorAction[]): VoltageDropCalculatorState {
  return actions.reduce(voltageDropCalculatorReducer, createInitialVoltageDropCalculatorState());
}

function summarize(state: VoltageDropCalculatorState) {
  return buildPrintSummary(state, calculateVoltageDrop(state));
}

describe('buildPrintSummary', () => {
  it('summarises the defaults', () => {
    const summary = summarize(createInitialVoltageDropCalculatorState());
    expect(summary.drop.value).toMatch(/%$/);
    expect(summary.statusLabel).toBe('Within limit');
    expect(summary.keyFigures).toEqual([
      { label: 'Supply load', value: '2 A of 4 A usable (within rating)' },
      { label: 'Remaining', value: '2 A left' },
      { label: 'Output', value: '24 W' },
      { label: 'Reserve', value: '20% (1 A)' },
    ]);
    expect(summary.problems).toEqual([]);
    expect(summary.runs).toEqual([
      expect.objectContaining({
        key: 'g1',
        name: 'Camera group 1',
        devices: '4',
        load: '0.5 A',
        wire: '18 AWG',
        run: '100 ft',
      }),
    ]);
    expect(summary.settings).toEqual([
      { label: 'Supply', value: '12 V DC, 5 A rated' },
      { label: 'Drop limit', value: '10%' },
      { label: 'Wire sizes', value: 'AWG, copper' },
    ]);
    // No AC supply and no watts loads, so those notes are left out.
    expect(summary.notes).toHaveLength(3);
  });

  it('uses group names and adds the AC and watts notes', () => {
    const summary = summarize(
      stateAfter(
        { type: 'update-supply', changes: { kind: 'ac', volts: 24 } },
        { type: 'set-load-input', id: 'g1', input: 'watts' },
        { type: 'update-group', id: 'g1', changes: { name: 'PTZ' } }
      )
    );
    expect(summary.runs[0]).toEqual(expect.objectContaining({ name: 'PTZ', load: '6 W' }));
    expect(summary.notes).toHaveLength(5);
  });

  it('lists the problems and runs no listed wire can fix', () => {
    const summary = summarize(
      stateAfter({
        type: 'update-group',
        id: 'g1',
        changes: { load: { input: 'amps', amps: 0.2 }, cableLength: 4000 },
      })
    );
    expect(summary.statusLabel).toBe('Over limit');
    expect(summary.problems).toHaveLength(1);
    expect(summary.problems[0]).toMatch(/^Camera group 1: .* over the 10% limit/);
    expect(summary.runs[0]?.smallestWire).toBe('None listed');
  });
});
