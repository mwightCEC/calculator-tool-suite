import { calculateVoltageDrop } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { createInitialVoltageDropCalculatorState } from '../_state/voltage-drop-calculator-state';
import { describeDrop, describeLoad, describeRun, summarizeGroup } from './group-summary';

const state = createInitialVoltageDropCalculatorState();
const group = state.deviceGroups[0]!;
const usage = calculateVoltageDrop(state).groups[0]!;
const wattsGroup = { ...group, load: { input: 'watts', watts: 60 } as const, cableLength: 1000 };
const cannotPower = calculateVoltageDrop({ ...state, deviceGroups: [wattsGroup] }).groups[0]!;

describe('group summary text', () => {
  it('describes the load', () => {
    expect(describeLoad(group)).toBe('0.5 A');
    expect(describeLoad(wattsGroup)).toBe('60 W');
  });

  it('summarizes a collapsed group', () => {
    expect(summarizeGroup(group, 'ft')).toBe('4 × 0.5 A · 18 AWG · 100 ft');
  });

  it('describes the drop and the run', () => {
    expect(describeDrop(usage)).toBe('0.64 V (5.3%)');
    expect(describeRun(usage)).toBe('0.64 V (5.3%) drop · 11.36 V at the device');
  });

  it('says when a run cannot power its device', () => {
    expect(describeDrop(cannotPower)).toBe("Can't power the device");
    expect(describeRun(cannotPower)).toBe("This run can't deliver the device's power");
  });
});
