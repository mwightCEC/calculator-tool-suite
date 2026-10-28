import {
  METRES_PER_FOOT,
  type BudgetStatus,
  type CableLengthUnit,
  type RunStatus,
  type VoltageDropGroupUsage,
  type VoltageDropProblem,
  type VoltageDropResult,
} from '@cctv/calc-core';
import {
  formatAmps,
  formatNumber,
  formatPercent,
  formatVolts,
  formatWatts,
} from '../../../../lib/format';
import type { VoltageDropCalculatorState } from '../_state/voltage-drop-calculator-state';
import { describeLoad } from './group-summary';
import { describeGauge, describeSupply } from './voltage-drop-labels';

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  ok: 'Within limit',
  'over-limit': 'Over limit',
  'cannot-power': "Can't power",
};

export const SUPPLY_STATUS_LABELS: Record<BudgetStatus, string> = {
  ok: 'Within rating',
  'into-reserve': 'Into reserve',
  'over-budget': 'Over rating',
};

/** Worst first: a run that can't power its device, then the largest drop. */
const STATUS_ORDER: Record<RunStatus, number> = { 'cannot-power': 0, 'over-limit': 1, ok: 2 };

/** The run that decides the headline. calculateVoltageDrop always returns at least one group. */
export function worstRun(result: VoltageDropResult): VoltageDropGroupUsage {
  return result.groups.reduce((worst, group) => {
    const order = STATUS_ORDER[group.status] - STATUS_ORDER[worst.status];
    if (order !== 0) {
      return order < 0 ? group : worst;
    }
    return (group.dropFraction ?? 0) > (worst.dropFraction ?? 0) ? group : worst;
  });
}

export interface ResultFigure {
  value: string;
  detail: string;
}

/** Simple mode's one setup has no visible group name. */
function groupLabel(state: VoltageDropCalculatorState, groupId: string): string {
  if (state.inputMode === 'simple') {
    return 'Devices';
  }
  return state.deviceGroups.find((group) => group.id === groupId)?.name ?? groupId;
}

/** The headline: "5.3%", "0.64 V drop · 11.36 V at the device", naming the group in Advanced. */
export function describeWorstDrop(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): ResultFigure {
  const run = worstRun(result);
  const prefix =
    state.inputMode === 'advanced' && result.groups.length > 1
      ? `${groupLabel(state, run.groupId)}: `
      : '';
  if (run.dropFraction === null || run.dropVolts === null || run.deviceVolts === null) {
    return { value: "Can't power", detail: `${prefix}the run can't deliver the device's power` };
  }
  return {
    value: formatPercent(run.dropFraction),
    detail: `${prefix}${formatVolts(run.dropVolts)} drop · ${formatVolts(run.deviceVolts)} at the device`,
  };
}

/** "12 V DC supply, 10% drop limit" */
export function describeLimit(state: VoltageDropCalculatorState): string {
  return `${describeSupply(state.powerSupply)} supply, ${state.dropLimitPercent}% drop limit`;
}

/** A length in metres in the input's unit, rounded down so it stays within the limit. */
export function formatRunLength(lengthM: number, unit: CableLengthUnit): string {
  const length = unit === 'm' ? lengthM : lengthM / METRES_PER_FOOT;
  return `${formatNumber(Math.floor(length), 0)} ${unit}`;
}

/** "5.3% · 11.36 V", or "Can't power". */
export function describeRunDrop(usage: VoltageDropGroupUsage): string {
  if (usage.dropFraction === null || usage.deviceVolts === null) {
    return "Can't power";
  }
  return `${formatPercent(usage.dropFraction)} · ${formatVolts(usage.deviceVolts)}`;
}

/** "Smallest wire 20 AWG · longest run 188 ft", or "No listed wire fits · …" when none does. */
export function describeRunLimits(usage: VoltageDropGroupUsage, unit: CableLengthUnit): string {
  const wire =
    usage.smallestGauge === null
      ? 'No listed wire fits'
      : `Smallest wire ${describeGauge(usage.smallestGauge)}`;
  return `${wire} · longest run ${formatRunLength(usage.maxLengthM, unit)}`;
}

/** The supply figure: "2 A", "of 4 A usable". */
export function describeSupplyLoad(result: VoltageDropResult): ResultFigure {
  return {
    value: formatAmps(result.totalAmps),
    detail: `of ${formatAmps(result.usableAmps)} usable`,
  };
}

/** "2 A left", or how far over the usable rating the load is. */
export function describeRemaining(result: VoltageDropResult): string {
  return result.remainingAmps >= 0
    ? `${formatAmps(result.remainingAmps)} left`
    : `${formatAmps(-result.remainingAmps)} over the usable rating`;
}

/** "5 A rated less a 20% reserve (1 A) · 24 W output", or no reserve. */
export function describeRating(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): string {
  const rated = `${formatAmps(result.ratedAmps)} rated`;
  const { reservePercent } = state.powerSupply;
  const reserve =
    reservePercent === 0
      ? `${rated}, no reserve`
      : `${rated} less a ${reservePercent}% reserve (${formatAmps(result.reserveAmps)})`;
  return `${reserve} · ${formatWatts(result.totalWatts)} output`;
}

/** What would fix a run: a thicker wire and/or a shorter run. */
function describeFix(usage: VoltageDropGroupUsage, unit: CableLengthUnit): string {
  const shorter = `keep runs under ${formatRunLength(usage.maxLengthM, unit)}`;
  return usage.smallestGauge === null
    ? `No listed wire size is enough at this length: ${shorter} or use a higher-voltage supply.`
    : `Use ${describeGauge(usage.smallestGauge)} or thicker, or ${shorter}.`;
}

/** One sentence per failed check, naming the group where there is one. */
export function describeProblem(
  problem: VoltageDropProblem,
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): string {
  switch (problem.kind) {
    case 'over-budget':
      return `Draws ${formatAmps(result.totalAmps)}, more than the ${formatAmps(result.ratedAmps)} rating. Use a larger supply or split the devices across more than one.`;
    case 'into-reserve':
      return `Uses part of the ${state.powerSupply.reservePercent}% reserve. It fits the rating, but leaves little headroom for heaters, start-up surges or more devices.`;
    case 'over-limit':
    case 'cannot-power': {
      const usage = result.groups.find((group) => group.groupId === problem.groupId);
      const group = state.deviceGroups.find((candidate) => candidate.id === problem.groupId);
      if (!usage || !group) {
        return '';
      }
      const label = groupLabel(state, problem.groupId);
      const fix = describeFix(usage, state.cableLengthUnit);
      return problem.kind === 'over-limit'
        ? `${label}: ${formatPercent(usage.dropFraction ?? 0)} drop, over the ${state.dropLimitPercent}% limit. ${fix}`
        : `${label}: the run can't deliver ${describeLoad(group)} at ${describeSupply(state.powerSupply)}. ${fix}`;
    }
  }
}

export interface SupplySegment {
  key: string;
  label: string;
  amps: number;
  /** CSS colour for the bar segment and legend swatch. */
  color: string;
}

/**
 * The rated current split into each group's load, the usable amps left and
 * what is left of the reserve. Over the rating, the groups fill the bar.
 */
export function supplySegments(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): SupplySegment[] {
  const groupSegments = result.groups.map((usage) => {
    const group = state.deviceGroups.find((candidate) => candidate.id === usage.groupId);
    return {
      key: usage.groupId,
      label: groupLabel(state, usage.groupId),
      amps: usage.totalAmps,
      color: `var(--group-color-${group?.colorIndex ?? 0})`,
    };
  });
  return [
    ...groupSegments,
    {
      key: 'free',
      label: 'Free',
      amps: Math.max(0, result.remainingAmps),
      color: 'var(--app-capacity-unused)',
    },
    {
      key: 'reserve',
      label: 'Reserve',
      amps: Math.max(0, result.ratedAmps - Math.max(result.totalAmps, result.usableAmps)),
      color: 'var(--app-capacity-reserve)',
    },
  ];
}
