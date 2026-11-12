import {
  METRES_PER_FOOT,
  type BudgetStatus,
  type CableLengthUnit,
  type RunStatus,
  type VoltageDropGroupUsage,
  type VoltageDropProblem,
  type VoltageDropResult,
  type WireGauge,
} from '@cctv/calc-core';
import type { MetricTile } from '../../../../components/ResultsCard/ResultsPanel';
import { combineGroupSegments } from '../../../../components/SegmentBar/combine-group-segments';
import type { BarSegment } from '../../../../components/SegmentBar/SegmentBar';
import {
  formatAmps,
  formatNumber,
  formatPercent,
  formatVolts,
  formatWatts,
} from '../../../../lib/format';
import { remainingDetail, remainingLabel } from '../../../../lib/reserve-tile';
import type { VoltageDropCalculatorState } from '../_state/voltage-drop-calculator-state';
import { describeLoad } from './group-summary';
import { formatSupplyAmps } from './supply-units';
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

function groupLabel(state: VoltageDropCalculatorState, groupId: string): string {
  return state.deviceGroups.find((group) => group.id === groupId)?.name ?? groupId;
}

/** Label for the headline: the worst run's voltage at its device. */
export const HEADLINE_LABEL = 'Voltage at the device';

/**
 * The headline: "11.36 V", "5.3% worst voltage drop (0.64 V)", naming the group when there
 * are several. Every run shares one supply, so the worst drop is also the lowest device voltage.
 */
export function describeWorstRun(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): ResultFigure {
  const run = worstRun(result);
  const prefix = result.groups.length > 1 ? `${groupLabel(state, run.groupId)}: ` : '';
  if (run.dropFraction === null || run.dropVolts === null || run.deviceVolts === null) {
    return { value: "Can't power", detail: `${prefix}the run can't deliver the device's power` };
  }
  return {
    value: formatVolts(run.deviceVolts),
    detail: `${prefix}${formatPercent(run.dropFraction)} worst voltage drop (${formatVolts(run.dropVolts)})`,
  };
}

/** Short detail for the mobile bar: "5.3% worst drop", or null when the run can't power it. */
export function describeWorstDropPercent(result: VoltageDropResult): string | null {
  const { dropFraction } = worstRun(result);
  return dropFraction === null ? null : `${formatPercent(dropFraction)} worst drop`;
}

/** In Export (and the FAQ): the drop limit isn't the device's own limit. */
export const DEVICE_VOLTS_NOTE =
  "Within the drop limit doesn't confirm a device will run: check the voltage at the device against the minimum input voltage on its datasheet.";

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

/**
 * The answers an installer wants for a run: the thinnest wire that keeps it within
 * the limit and the longest run on the chosen wire, e.g.
 * "Passes on 22 AWG or thicker · up to 375 ft on 18 AWG". A failing run says
 * "Needs 14 AWG or thicker"; "No listed wire passes" when none does.
 */
export function describeRunLimits(
  usage: VoltageDropGroupUsage,
  gauge: WireGauge,
  unit: CableLengthUnit
): string {
  let wire = 'No listed wire passes';
  if (usage.smallestGauge !== null) {
    const verb = usage.status === 'ok' ? 'Passes on' : 'Needs';
    wire = `${verb} ${describeGauge(usage.smallestGauge)} or thicker`;
  }
  return `${wire} · up to ${formatRunLength(usage.maxLengthM, unit)} on ${describeGauge(gauge)}`;
}

/**
 * False when a run can't power its device. That run has no steady current, so
 * the supply load, output and what is left can't be worked out.
 */
export function isSupplyLoadKnown(result: VoltageDropResult): boolean {
  return result.groups.every((group) => group.status !== 'cannot-power');
}

export const SUPPLY_LOAD_UNAVAILABLE = 'Unavailable';

/** Why the supply figures are missing, shown in their place. */
export const SUPPLY_LOAD_UNAVAILABLE_NOTE =
  "Supply load unavailable: one or more runs can't deliver the requested power. Fix those runs to see the load.";

/** The problems to show: the supply checks are left out while the supply load is unavailable. */
export function visibleProblems(result: VoltageDropResult): VoltageDropProblem[] {
  return isSupplyLoadKnown(result)
    ? result.problems
    : result.problems.filter((problem) => 'groupId' in problem);
}

/** The supply figure: "2 A", "of 4 A usable" (in VA for an AC supply). */
export function describeSupplyLoad(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): ResultFigure {
  if (!isSupplyLoadKnown(result)) {
    return { value: SUPPLY_LOAD_UNAVAILABLE, detail: "a run can't be powered" };
  }
  const supply = state.powerSupply;
  return {
    value: formatSupplyAmps(supply, result.totalAmps),
    detail: `of ${formatSupplyAmps(supply, result.usableAmps)} usable`,
  };
}

/** "2 A left", or how far over the usable rating the load is (in VA for an AC supply). */
export function describeRemaining(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): string {
  if (!isSupplyLoadKnown(result)) {
    return SUPPLY_LOAD_UNAVAILABLE;
  }
  const remaining = formatSupplyAmps(state.powerSupply, Math.abs(result.remainingAmps));
  return result.remainingAmps >= 0 ? `${remaining} left` : `${remaining} over the usable rating`;
}

/** "48 W output" for DC; "2 A drawn" for AC, whose load is already shown in VA. */
function describeOutput(state: VoltageDropCalculatorState, result: VoltageDropResult): string {
  return state.powerSupply.kind === 'ac'
    ? `${formatAmps(result.totalAmps)} drawn`
    : `${formatWatts(result.totalWatts)} output`;
}

/**
 * The figures under the headline: the supply load, what's left, the rating and
 * its reserve, in amps for DC and VA for AC.
 */
export function buildMetricTiles(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): MetricTile[] {
  const supply = state.powerSupply;
  const { reservePercent } = supply;
  const over = result.remainingAmps < 0;
  const loadTiles: MetricTile[] = isSupplyLoadKnown(result)
    ? [
        {
          label: 'Supply load',
          value: formatSupplyAmps(supply, result.totalAmps),
          detail: describeOutput(state, result),
        },
        {
          label: remainingLabel(over),
          value: formatSupplyAmps(supply, Math.abs(result.remainingAmps)),
          detail: remainingDetail(over, reservePercent),
        },
      ]
    : [
        { label: 'Supply load', ...describeSupplyLoad(state, result) },
        { label: 'Remaining', value: SUPPLY_LOAD_UNAVAILABLE, detail: 'needs the supply load' },
      ];
  return [
    ...loadTiles,
    {
      label: 'Supply rating',
      value: formatSupplyAmps(supply, result.ratedAmps),
      detail:
        reservePercent === 0
          ? 'no reserve'
          : `${reservePercent}% reserve (${formatSupplyAmps(supply, result.reserveAmps)})`,
    },
  ];
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
      return `Draws ${formatSupplyAmps(state.powerSupply, result.totalAmps)}, more than the ${formatSupplyAmps(state.powerSupply, result.ratedAmps)} rating. Use a larger supply or split the devices across more than one.`;
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

/**
 * The rated current split into each group's load, the usable amps left and
 * what is left of the reserve. Over the rating, the groups fill the bar.
 */
export function supplySegments(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult,
  simplified = false
): BarSegment[] {
  const groupSegments = result.groups.map((usage) => {
    const group = state.deviceGroups.find((candidate) => candidate.id === usage.groupId);
    return {
      key: usage.groupId,
      label: groupLabel(state, usage.groupId),
      value: usage.totalAmps,
      color: `var(--group-color-${group?.colorIndex ?? 0})`,
    };
  });
  return [
    ...(simplified
      ? [combineGroupSegments(groupSegments, { key: 'devices', label: 'Devices' })]
      : groupSegments),
    {
      key: 'free',
      label: 'Free',
      value: Math.max(0, result.remainingAmps),
      color: 'var(--app-capacity-unused)',
    },
    {
      key: 'reserve',
      label: 'Reserve',
      value: Math.max(0, result.ratedAmps - Math.max(result.totalAmps, result.usableAmps)),
      color: 'var(--app-capacity-reserve)',
    },
  ];
}
