import type { VoltageDropResult } from '@cctv/calc-core';
import { formatNumber, formatVoltAmps, formatWatts } from '../../../../lib/format';
import type { VoltageDropCalculatorState } from '../_state/voltage-drop-calculator-state';
import { describeLoad } from './group-summary';
import {
  describeProblem,
  describeRemaining,
  describeRunDrop,
  describeSupplyLoad,
  describeWorstRun,
  DEVICE_VOLTS_NOTE,
  formatRunLength,
  isSupplyLoadKnown,
  RUN_STATUS_LABELS,
  SUPPLY_LOAD_UNAVAILABLE,
  SUPPLY_LOAD_UNAVAILABLE_NOTE,
  SUPPLY_STATUS_LABELS,
  visibleProblems,
  worstRun,
  type ResultFigure,
} from './result-summary';
import { formatSupplyAmps } from './supply-units';
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
  drop: ResultFigure;
  statusLabel: string;
  keyFigures: LabelledValue[];
  problems: string[];
  runs: RunRow[];
  settings: LabelledValue[];
  notes: string[];
}

function runRows(state: VoltageDropCalculatorState, result: VoltageDropResult): RunRow[] {
  return state.deviceGroups.flatMap((group) => {
    const usage = result.groups.find((candidate) => candidate.groupId === group.id);
    if (!usage) {
      return [];
    }
    return [
      {
        key: group.id,
        name: group.name,
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
    DEVICE_VOLTS_NOTE,
    'The smallest wire and longest run are the thinnest listed size and the longest length that keep the drop within the limit.',
    'Within the rating less the reserve is OK; into the reserve is a caution; above the full rating is over.',
  ];
  if (state.powerSupply.kind === 'ac') {
    list.push(
      "AC is approximated: it is treated like DC at its RMS voltage, using the wire's resistance only."
    );
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
  const supply = describeSupplyLoad(state, result);
  const loadKnown = isSupplyLoadKnown(result);
  const { kind, reservePercent } = state.powerSupply;
  // An AC transformer's output is in VA, like its rating.
  const output = kind === 'ac' ? formatVoltAmps(result.totalWatts) : formatWatts(result.totalWatts);
  return {
    drop: describeWorstRun(state, result),
    statusLabel: RUN_STATUS_LABELS[worstRun(result).status],
    keyFigures: [
      {
        label: 'Supply load',
        value: loadKnown
          ? `${supply.value} ${supply.detail} (${SUPPLY_STATUS_LABELS[result.supplyStatus].toLowerCase()})`
          : `${supply.value}: ${supply.detail}`,
      },
      { label: 'Remaining', value: describeRemaining(state, result) },
      { label: 'Output', value: loadKnown ? output : SUPPLY_LOAD_UNAVAILABLE },
      {
        label: 'Reserve',
        value: `${reservePercent}% (${formatSupplyAmps(state.powerSupply, result.reserveAmps)})`,
      },
    ],
    problems: [
      ...(loadKnown ? [] : [SUPPLY_LOAD_UNAVAILABLE_NOTE]),
      ...visibleProblems(result).map((problem) => describeProblem(problem, state, result)),
    ],
    runs: runRows(state, result),
    settings: [
      {
        label: 'Supply',
        value: `${describeSupply(state.powerSupply)}, ${formatSupplyAmps(state.powerSupply, result.ratedAmps)} rated`,
      },
      { label: 'Drop limit', value: `${state.dropLimitPercent}%` },
      { label: 'Wire sizes', value: `${WIRE_SYSTEM_LABELS[state.wireSystem]}, copper` },
    ],
    notes: notes(state),
  };
}
