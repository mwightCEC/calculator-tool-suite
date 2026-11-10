import { calculatePoe } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialPoeCalculatorState,
  poeCalculatorReducer,
  type PoeCalculatorAction,
  type PoeCalculatorState,
} from '../_state/poe-calculator-state';
import { buildChecks, describeMobileDetail, describeOverallStatus } from './checks';

function stateAfter(...actions: PoeCalculatorAction[]): PoeCalculatorState {
  return actions.reduce(poeCalculatorReducer, createInitialPoeCalculatorState());
}

function checksAfter(...actions: PoeCalculatorAction[]) {
  const state = stateAfter(...actions);
  return buildChecks(state, calculatePoe(state));
}

/** 400 ft: past Ethernet's 328 ft limit. */
const LONG_CABLE: PoeCalculatorAction = {
  type: 'update-group',
  id: 'g1',
  changes: { cableLength: 400 },
};

/** A 30 W device needs class 5, more than PoE+ ports supply. */
const HIGH_POWER: PoeCalculatorAction = {
  type: 'update-group',
  id: 'g1',
  changes: { deviceCount: 1, power: { input: 'watts', watts: 30 } },
};

describe('buildChecks', () => {
  it('passes every check for the defaults', () => {
    const checks = checksAfter();
    expect(checks.map((check) => [check.label, check.level, check.status])).toEqual([
      ['Power budget', 'ok', 'Within budget'],
      ['PoE ports', 'ok', 'OK'],
      ['Port standard', 'ok', 'OK'],
      ['Cable length', 'ok', 'OK'],
    ]);
  });

  it('flags a long cable while the budget still passes', () => {
    const checks = checksAfter(LONG_CABLE);
    expect(checks[0]).toEqual(expect.objectContaining({ level: 'ok', status: 'Within budget' }));
    expect(checks[3]).toEqual(
      expect.objectContaining({
        level: 'fail',
        status: 'Too long',
        detail: 'Over 328 ft: Device group 1',
      })
    );
  });

  it('fails the cable check when a run cannot carry the device power', () => {
    // 80 W on four pairs over 100 m needs more than 44 V PoE (af) ports can push.
    const checks = checksAfter(
      { type: 'update-switch', changes: { portStandard: 'af' } },
      {
        type: 'update-group',
        id: 'g1',
        changes: { deviceCount: 1, power: { input: 'watts', watts: 80 } },
      }
    );
    expect(checks[3]).toEqual(
      expect.objectContaining({
        level: 'fail',
        status: "Can't power",
        headline: "Cable can't power device",
        detail: "Can't carry the power: Device group 1",
      })
    );
  });

  it('lists a run that is both too long and unable to carry the power', () => {
    const checks = checksAfter({
      type: 'update-group',
      id: 'g1',
      changes: { cableLength: 1000, power: { input: 'watts', watts: 25.5 } },
    });
    expect(checks[3]).toEqual(
      expect.objectContaining({
        status: 'Too long',
        headline: 'Cable too long',
        detail: "Over 328 ft: Device group 1 · Can't carry the power: Device group 1",
      })
    );
  });

  it('names the groups a port standard is too low for', () => {
    expect(checksAfter(HIGH_POWER)[2]).toEqual(
      expect.objectContaining({
        level: 'fail',
        status: 'Too low',
        detail: 'Needs more than PoE+: Device group 1',
      })
    );
  });

  it('marks into the reserve as a caution and too few ports as a failure', () => {
    const checks = checksAfter(
      { type: 'update-group', id: 'g1', changes: { deviceCount: 16 } },
      { type: 'update-switch', changes: { ports: 8 } }
    );
    expect(checks[0]).toEqual(
      expect.objectContaining({ level: 'caution', status: 'Into reserve' })
    );
    expect(checks[1]).toEqual(
      expect.objectContaining({
        level: 'fail',
        status: 'Not enough',
        detail: '16 devices for 8 PoE ports',
      })
    );
  });
});

describe('describeOverallStatus', () => {
  it('passes only when every check does', () => {
    expect(describeOverallStatus(checksAfter())).toEqual({ level: 'ok', label: 'All checks pass' });
  });

  it('names the one check that fails, even with the budget passing', () => {
    expect(describeOverallStatus(checksAfter(LONG_CABLE))).toEqual({
      level: 'fail',
      label: 'Cable too long',
    });
  });

  it('counts several failing checks, ahead of a caution', () => {
    expect(describeOverallStatus(checksAfter(HIGH_POWER, LONG_CABLE))).toEqual({
      level: 'fail',
      label: '2 checks fail',
    });
    expect(
      describeOverallStatus(
        checksAfter(
          { type: 'update-group', id: 'g1', changes: { deviceCount: 16 } },
          {
            type: 'update-switch',
            changes: { ports: 24 },
          }
        )
      )
    ).toEqual({ level: 'caution', label: 'Into reserve' });
  });
});

describe('describeMobileDetail', () => {
  it('adds the badge only when a check is not OK', () => {
    expect(
      describeMobileDetail('of 96 W available', { level: 'ok', label: 'All checks pass' })
    ).toBe('of 96 W available');
    expect(
      describeMobileDetail('of 96 W available', { level: 'fail', label: 'Cable too long' })
    ).toBe('of 96 W available · Cable too long');
  });
});
