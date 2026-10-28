import type { VoltageDropResult } from '@cctv/calc-core';
import { formatAmps, formatNumber, formatWatts } from '../../../../lib/format';
import type { VoltageDropCalculatorState } from '../_state/voltage-drop-calculator-state';
import { describeLoad } from './group-summary';
import {
  describeProblem,
  describeRemaining,
  describeRunDrop,
  describeSupplyLoad,
  describeWorstDrop,
  formatRunLength,
  RUN_STATUS_LABELS,
  SUPPLY_STATUS_LABELS,
  worstRun,
  type ResultFigure,
} from './result-summary';
import { describeGauge, describeSupply, WIRE_SYSTEM_LABELS } from './voltage-drop-labels';

/*
 * Content for the printable summary (Export). Pure, so it can be unit tested;
 * PrintSummary only renders it.
 */

export interface LabelledValue {
  label: string;
  value: string;
}

export interface RunRow {
  /** The group id: unique even when names and settings are identical (e.g. duplicates). */
  key: string;
  name: string;
  devices: string;
  load: string;
  wire: string;
  run: string;
  /** "5.3% · 11.36 V", or "Can't power". */
  drop: string;
  smallestWire: string;
  longestRun: string;
}

export interface PrintSummary {
  /** "Simple mode" for Simple input, null for Advanced. */
  inputModeLabel: string | null;
  /** "Devices" in Simple mode (one setup), "Device groups" in Advanced. */
  groupsHeading: string;
  drop: ResultFigure;
  statusLabel: string;
  keyFigures: LabelledValue[];
  problems: string[];
  runs: RunRow[];
  settings: LabelledValue[];
  notes: string[];
}

function runRows(state: VoltageDropCalculatorState, result: VoltageDropResult): RunRow[] {
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
        load: describeLoad(group),
        wire: describeGauge(group.gauge),
        run: `${formatNumber(group.cableLength, 1)} ${state.cableLengthUnit}`,
        drop: describeRunDrop(usage),
        smallestWire:
          usage.smallestGauge === null ? 'None listed' : describeGauge(usage.smallestGauge),
        longestRun: formatRunLength(usage.maxLengthM, state.cableLengthUnit),
      },
    ];
  });
}

function notes(state: VoltageDropCalculatorState): string[] {
  const list = [
    'Each device has its own run from the supply. The drop is the current times the resistance of both conductors, for copper at 20 °C; warm cable and copper-clad aluminium (CCA) drop more.',
    'The smallest wire and longest run are the thinnest listed size and the longest length that keep the drop within the limit.',
    'Within the rating less the reserve is OK; into the reserve is a caution; above the full rating is over.',
  ];
  if (state.powerSupply.kind === 'ac') {
    list.push("AC is treated like DC at its RMS voltage, using the wire's resistance only.");
  }
  if (state.deviceGroups.some((group) => group.load.input === 'watts')) {
    list.push(
      'Loads given in watts draw more current as the voltage falls; the amps shown include this.'
    );
  }
  return list;
}

export function buildPrintSummary(
  state: VoltageDropCalculatorState,
  result: VoltageDropResult
): PrintSummary {
  const simple = state.inputMode === 'simple';
  const supply = describeSupplyLoad(result);
  const { reservePercent } = state.powerSupply;
  return {
    inputModeLabel: simple ? 'Simple mode' : null,
    groupsHeading: simple ? 'Devices' : 'Device groups',
    drop: describeWorstDrop(state, result),
    statusLabel: RUN_STATUS_LABELS[worstRun(result).status],
    keyFigures: [
      {
        label: 'Supply load',
        value: `${supply.value} ${supply.detail} (${SUPPLY_STATUS_LABELS[result.supplyStatus].toLowerCase()})`,
      },
      { label: 'Remaining', value: describeRemaining(result) },
      { label: 'Output', value: formatWatts(result.totalWatts) },
      { label: 'Reserve', value: `${reservePercent}% (${formatAmps(result.reserveAmps)})` },
    ],
    problems: result.problems.map((problem) => describeProblem(problem, state, result)),
    runs: runRows(state, result),
    settings: [
      {
        label: 'Supply',
        value: `${describeSupply(state.powerSupply)}, ${formatAmps(result.ratedAmps)} rated`,
      },
      { label: 'Drop limit', value: `${state.dropLimitPercent}%` },
      { label: 'Wire sizes', value: `${WIRE_SYSTEM_LABELS[state.wireSystem]}, copper` },
    ],
    notes: notes(state),
  };
}
