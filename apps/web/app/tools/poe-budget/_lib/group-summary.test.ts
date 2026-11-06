import { calculatePoe } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialPoeCalculatorState,
  poeCalculatorReducer,
  type PoeCalculatorAction,
} from '../_state/poe-calculator-state';
import { describeAllocation } from './group-summary';

function usageAfter(...actions: PoeCalculatorAction[]) {
  const state = actions.reduce(poeCalculatorReducer, createInitialPoeCalculatorState());
  return calculatePoe(state).groups[0]!;
}

describe('describeAllocation', () => {
  it('includes the cable loss for a device given in watts', () => {
    const usage = usageAfter({
      type: 'update-group',
      id: 'g1',
      changes: { power: { input: 'watts', watts: 25.5 } },
    });
    expect(describeAllocation(usage)).toBe(
      '30 W from the budget, including 4.5 W estimated cable loss'
    );
  });

  it('names the class allocation for a device given by class', () => {
    const usage = usageAfter({
      type: 'update-group',
      id: 'g1',
      changes: { power: { input: 'class', poeClass: 4 } },
    });
    expect(describeAllocation(usage)).toBe('30 W from the budget (the class allocation)');
  });

  it('says when the cable run cannot carry the power', () => {
    const usage = usageAfter({
      type: 'update-group',
      id: 'g1',
      changes: { cableLength: 1000, power: { input: 'watts', watts: 25.5 } },
    });
    expect(describeAllocation(usage)).toBe(
      "25.5 W from the budget for the device alone: this cable run can't carry its power"
    );
  });
});
