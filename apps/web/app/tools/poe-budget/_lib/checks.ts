import type { PoeResult } from '@cctv/calc-core';
import { formatWatts } from '../../../../lib/format';
import type { PoeCalculatorState } from '../_state/poe-calculator-state';
import { PORT_STANDARD_SHORT_LABELS } from './poe-labels';
import { BUDGET_STATUS_LABELS, cableLimit, describePorts, groupLabel } from './result-summary';

/*
 * The four PoE checks shown side by side, so a passing power budget can't hide
 * a port or cable problem. Built from calculatePoe's result; no new maths.
 */

export type CheckLevel = 'ok' | 'caution' | 'fail';

export interface PoeCheck {
  key: 'budget' | 'ports' | 'standard' | 'cable';
  label: string;
  level: CheckLevel;
  /** The check's badge: "OK", "Within budget", "Too long". */
  status: string;
  /** The card badge when this is the only check that isn't OK: "Cable too long". */
  headline: string;
  detail: string;
}

function names(state: PoeCalculatorState, groupIds: string[]): string {
  return groupIds.map((id) => groupLabel(state, id)).join(', ');
}

function budgetCheck(result: PoeResult): PoeCheck {
  const levels = { ok: 'ok', 'into-reserve': 'caution', 'over-budget': 'fail' } as const;
  const status = BUDGET_STATUS_LABELS[result.budgetStatus];
  return {
    key: 'budget',
    label: 'Power budget',
    level: levels[result.budgetStatus],
    status,
    headline: status,
    detail: `${formatWatts(result.totalWatts)} of ${formatWatts(result.usableWatts)} usable`,
  };
}

function portsCheck(result: PoeResult): PoeCheck {
  return {
    key: 'ports',
    label: 'PoE ports',
    level: result.enoughPorts ? 'ok' : 'fail',
    status: result.enoughPorts ? 'OK' : 'Not enough',
    headline: 'Not enough ports',
    detail: describePorts(result),
  };
}

function standardCheck(state: PoeCalculatorState, result: PoeResult): PoeCheck {
  const standard = PORT_STANDARD_SHORT_LABELS[state.powerSource.portStandard];
  const failing = result.groups
    .filter((group) => !group.fitsPortStandard)
    .map((group) => group.groupId);
  return {
    key: 'standard',
    label: 'Port standard',
    level: failing.length === 0 ? 'ok' : 'fail',
    status: failing.length === 0 ? 'OK' : 'Too low',
    headline: 'Port standard too low',
    detail:
      failing.length === 0
        ? `Every group fits ${standard} ports`
        : `Needs more than ${standard}: ${names(state, failing)}`,
  };
}

function cableCheck(state: PoeCalculatorState, result: PoeResult): PoeCheck {
  const limit = cableLimit(state);
  const failing = result.groups.filter((group) => group.cableTooLong).map((group) => group.groupId);
  return {
    key: 'cable',
    label: 'Cable length',
    level: failing.length === 0 ? 'ok' : 'fail',
    status: failing.length === 0 ? 'OK' : 'Too long',
    headline: 'Cable too long',
    detail:
      failing.length === 0
        ? `Every run within ${limit}`
        : `Over ${limit}: ${names(state, failing)}`,
  };
}

/** Power budget, ports, port standard and cable length, in that order. */
export function buildChecks(state: PoeCalculatorState, result: PoeResult): PoeCheck[] {
  return [
    budgetCheck(result),
    portsCheck(result),
    standardCheck(state, result),
    cableCheck(state, result),
  ];
}

export interface OverallStatus {
  level: CheckLevel;
  label: string;
}

const LEVEL_ORDER: Record<CheckLevel, number> = { ok: 0, caution: 1, fail: 2 };

/**
 * The card badge: the worst check. One check that isn't OK names itself
 * ("Cable too long"); several failing say how many.
 */
export function describeOverallStatus(checks: PoeCheck[]): OverallStatus {
  const worst = Math.max(...checks.map((check) => LEVEL_ORDER[check.level]));
  if (worst === 0) {
    return { level: 'ok', label: 'All checks pass' };
  }
  const level = worst === 2 ? 'fail' : 'caution';
  const [first, ...others] = checks.filter((check) => check.level === level);
  return {
    level,
    label: first && others.length === 0 ? first.headline : `${others.length + 1} checks fail`,
  };
}

/** The mobile bar's detail, naming the badge when a check isn't OK: "of 96 W usable · Cable too long". */
export function describeMobileDetail(detail: string, overall: OverallStatus): string {
  return overall.level === 'ok' ? detail : `${detail} · ${overall.label}`;
}
