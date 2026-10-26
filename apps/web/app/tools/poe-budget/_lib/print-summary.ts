import type { PoeResult } from '@cctv/calc-core';
import { formatNumber, formatWatts } from '../../../../lib/format';
import type { PoeCalculatorState } from '../_state/poe-calculator-state';
import { describePower } from './group-summary';
import { PORT_STANDARD_LABELS } from './poe-labels';
import {
  BUDGET_STATUS_LABELS,
  describePorts,
  describeProblem,
  describeRemaining,
  describeUsage,
  type ResultFigure,
} from './result-summary';

/*
 * Content for the printable summary (Export). Pure, so it can be unit tested;
 * PrintSummary only renders it.
 */

export interface LabelledValue {
  label: string;
  value: string;
}

export interface GroupRow {
  /** The group id: unique even when names and settings are identical (e.g. duplicates). */
  key: string;
  name: string;
  devices: string;
  power: string;
  cable: string;
  perDevice: string;
  total: string;
}

export interface PrintSummary {
  /** "Simple mode" for Simple input, null for Advanced. */
  inputModeLabel: string | null;
  /** "Devices" in Simple mode (one setup), "Device groups" in Advanced. */
  groupsHeading: string;
  usage: ResultFigure;
  statusLabel: string;
  keyFigures: LabelledValue[];
  problems: string[];
  groups: GroupRow[];
  settings: LabelledValue[];
  notes: string[];
}

function groupRows(state: PoeCalculatorState, result: PoeResult): GroupRow[] {
  const simple = state.inputMode === 'simple';
  return state.deviceGroups.flatMap((group) => {
    const usage = result.groups.find((candidate) => candidate.groupId === group.id);
    if (!usage) {
      return [];
    }
    return [
      {
        key: group.id,
        // Simple mode's one setup has no visible group name.
        name: simple ? 'Devices' : group.name,
        devices: formatNumber(group.deviceCount, 0),
        power: group.power.input === 'class' ? describePower(group) : `${describePower(group)} max`,
        cable:
          group.cableLength === null
            ? '100 m assumed'
            : `${formatNumber(group.cableLength, 1)} ${state.cableLengthUnit}`,
        perDevice: formatWatts(usage.perDeviceWatts),
        total: formatWatts(usage.totalWatts),
      },
    ];
  });
}

function notes(state: PoeCalculatorState): string[] {
  const list = [
    'Each device takes its allocation from the budget: the full switch-side power of its PoE class, or its datasheet maximum plus an estimated cable loss.',
    'Within the budget less the reserve is OK; into the reserve is a caution; above the full budget is over budget.',
  ];
  if (state.deviceGroups.some((group) => group.power.input === 'watts')) {
    list.push(
      'Cable loss is an estimate (50 V, 12.5 Ω per 100 m of Cat5e). A switch that reserves power by PoE class may set aside more than the devices draw.'
    );
  }
  return list;
}

export function buildPrintSummary(state: PoeCalculatorState, result: PoeResult): PrintSummary {
  const simple = state.inputMode === 'simple';
  const { reservePercent } = state.powerSource;
  return {
    inputModeLabel: simple ? 'Simple mode' : null,
    groupsHeading: simple ? 'Devices' : 'Device groups',
    usage: describeUsage(result),
    statusLabel: BUDGET_STATUS_LABELS[result.budgetStatus],
    keyFigures: [
      { label: 'Remaining', value: describeRemaining(result) },
      { label: 'PoE budget', value: formatWatts(result.budgetWatts) },
      {
        label: 'Reserve',
        value: `${reservePercent}% (${formatWatts(result.reserveWatts)})`,
      },
      { label: 'Ports', value: describePorts(result) },
    ],
    problems: result.problems.map((problem) => describeProblem(problem, state, result)),
    groups: groupRows(state, result),
    settings: [
      { label: 'Port standard', value: PORT_STANDARD_LABELS[state.powerSource.portStandard] },
      { label: 'PoE ports', value: formatNumber(result.ports, 0) },
    ],
    notes: notes(state),
  };
}
