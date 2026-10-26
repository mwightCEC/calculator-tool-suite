import {
  MAX_CABLE_RUN_M,
  METRES_PER_FOOT,
  poeClassSpec,
  type BudgetStatus,
  type PoeProblem,
  type PoeResult,
} from '@cctv/calc-core';
import { formatNumber, formatWatts } from '../../../../lib/format';
import type { PoeCalculatorState } from '../_state/poe-calculator-state';
import { PORT_STANDARD_SHORT_LABELS } from './poe-labels';

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  ok: 'Within budget',
  'into-reserve': 'Into reserve',
  'over-budget': 'Over budget',
};

export interface ResultFigure {
  value: string;
  detail: string;
}

/** The headline: "24.7 W", "of 96 W usable". */
export function describeUsage(result: PoeResult): ResultFigure {
  return {
    value: formatWatts(result.totalWatts),
    detail: `of ${formatWatts(result.usableWatts)} usable`,
  };
}

/** "71.3 W left", or how far over the usable budget the load is. */
export function describeRemaining(result: PoeResult): string {
  return result.remainingWatts >= 0
    ? `${formatWatts(result.remainingWatts)} left`
    : `${formatWatts(-result.remainingWatts)} over the usable budget`;
}

/** "120 W budget less a 20% reserve (24 W)", or just the budget with no reserve. */
export function describeBudget(state: PoeCalculatorState, result: PoeResult): string {
  const budget = `${formatWatts(result.budgetWatts)} budget`;
  const { reservePercent } = state.powerSource;
  return reservePercent === 0
    ? `${budget}, no reserve`
    : `${budget} less a ${reservePercent}% reserve (${formatWatts(result.reserveWatts)})`;
}

const plural = (count: number, noun: string) =>
  `${formatNumber(count, 0)} ${count === 1 ? noun : `${noun}s`}`;

/** "4 of 8 PoE ports used", or "10 devices for 8 PoE ports" when they don't fit. */
export function describePorts(result: PoeResult): string {
  const ports = plural(result.ports, 'PoE port');
  return result.enoughPorts
    ? `${formatNumber(result.totalDevices, 0)} of ${ports} used`
    : `${plural(result.totalDevices, 'device')} for ${ports}`;
}

/** Simple mode's one setup has no visible group name. */
function groupLabel(state: PoeCalculatorState, groupId: string): string {
  if (state.inputMode === 'simple') {
    return 'Devices';
  }
  return state.deviceGroups.find((group) => group.id === groupId)?.name ?? groupId;
}

/** What a group's devices need, e.g. "class 5 (PoE++ Type 3)". */
function describeNeed(result: PoeResult, groupId: string): string {
  const usage = result.groups.find((group) => group.groupId === groupId);
  const poeClass = usage?.requiredClass ?? null;
  if (poeClass === null) {
    return 'more power than any PoE class provides';
  }
  return `class ${poeClass} (${PORT_STANDARD_SHORT_LABELS[poeClassSpec(poeClass).standard]})`;
}

/** The 100 m limit in the input's unit: "328 ft" or "100 m". */
function cableLimit(state: PoeCalculatorState): string {
  return state.cableLengthUnit === 'm'
    ? `${MAX_CABLE_RUN_M} m`
    : `${formatNumber(MAX_CABLE_RUN_M / METRES_PER_FOOT, 0)} ft`;
}

/** One sentence per failed check, naming the group where there is one. */
export function describeProblem(
  problem: PoeProblem,
  state: PoeCalculatorState,
  result: PoeResult
): string {
  switch (problem.kind) {
    case 'over-budget':
      return `Needs ${formatWatts(result.totalWatts)}, more than the ${formatWatts(result.budgetWatts)} budget. Use a switch with a larger budget or split the devices across more than one.`;
    case 'into-reserve':
      return `Uses part of the ${state.powerSource.reservePercent}% reserve. It fits the budget, but leaves little headroom for heaters, start-up surges or more devices.`;
    case 'not-enough-ports':
      return `${plural(result.totalDevices, 'device')} but only ${plural(result.ports, 'PoE port')}.`;
    case 'port-standard': {
      const standard = PORT_STANDARD_SHORT_LABELS[state.powerSource.portStandard];
      return `${groupLabel(state, problem.groupId)}: needs ${describeNeed(result, problem.groupId)}, more than ${standard} ports supply.`;
    }
    case 'cable-too-long':
      return `${groupLabel(state, problem.groupId)}: the cable run is longer than Ethernet's ${cableLimit(state)} limit. Use a PoE extender or a switch closer to the devices.`;
  }
}

export interface BudgetSegment {
  key: string;
  label: string;
  watts: number;
  /** CSS colour for the bar segment and legend swatch. */
  color: string;
}

/**
 * The budget split into each group's load, the usable watts left and what is
 * left of the reserve. Over budget, the groups fill the bar.
 */
export function budgetSegments(state: PoeCalculatorState, result: PoeResult): BudgetSegment[] {
  const groupSegments = result.groups.map((usage) => {
    const group = state.deviceGroups.find((candidate) => candidate.id === usage.groupId);
    return {
      key: usage.groupId,
      label: groupLabel(state, usage.groupId),
      watts: usage.totalWatts,
      color: `var(--group-color-${group?.colorIndex ?? 0})`,
    };
  });
  return [
    ...groupSegments,
    {
      key: 'free',
      label: 'Free',
      watts: Math.max(0, result.remainingWatts),
      color: 'var(--app-capacity-unused)',
    },
    {
      key: 'reserve',
      label: 'Reserve',
      watts: Math.max(0, result.budgetWatts - Math.max(result.totalWatts, result.usableWatts)),
      color: 'var(--app-capacity-reserve)',
    },
  ];
}
