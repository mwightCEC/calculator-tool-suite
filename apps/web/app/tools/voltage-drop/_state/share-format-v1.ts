import type {
  CableLengthUnit,
  LoadInput,
  SupplyKind,
  WireGauge,
  WireSystem,
} from '@cctv/calc-core';
import { z } from 'zod';
import type { InputMode } from '../../../../lib/input-mode';
import type { VoltageDropCalculatorState } from './voltage-drop-calculator-state';

/*
 * Voltage drop share link format v1: a compact positional JSON array.
 *
 *   [inputMode, supply, dropLimitPercent, wireSystem, cableLengthUnit, groups]
 *   supply = [supplyKind, volts, ratedAmps, reservePercent]
 *   group  = [name, deviceCount, loadInput, load, gauge, cableLength, colorIndex]
 *            load is the amps or the watts per device, depending on loadInput.
 *
 * Choices are stored as indexes into the tables below. Those tables ARE the
 * format: only ever append to them. Reordering or removing an entry would make
 * existing links decode to the wrong value; a change like that needs a new
 * format version. Group ids are not stored and are re-created as g1, g2, … .
 * The input mode is always stored, so every link opens in the mode it was made in.
 */

export const V1_INPUT_MODES = ['advanced', 'simple'] as const satisfies readonly InputMode[];
export const V1_SUPPLY_KINDS = ['dc', 'ac'] as const satisfies readonly SupplyKind[];
export const V1_WIRE_SYSTEMS = ['awg', 'mm2'] as const satisfies readonly WireSystem[];
export const V1_CABLE_LENGTH_UNITS = ['ft', 'm'] as const satisfies readonly CableLengthUnit[];
export const V1_LOAD_INPUTS = ['amps', 'watts'] as const satisfies readonly LoadInput[];
export const V1_WIRE_GAUGES = [
  'awg-24',
  'awg-22',
  'awg-20',
  'awg-18',
  'awg-16',
  'awg-14',
  'awg-12',
  'awg-10',
  'mm2-0.5',
  'mm2-0.75',
  'mm2-1',
  'mm2-1.5',
  'mm2-2.5',
  'mm2-4',
  'mm2-6',
] as const satisfies readonly WireGauge[];

const index = z.int().nonnegative();

/** Shape check only; value ranges are validated afterwards by the state schema. */
const payloadSchema = z.tuple([
  index,
  z.tuple([index, z.number(), z.number(), z.number()]),
  z.number(),
  index,
  index,
  z.array(z.tuple([z.string(), z.number(), index, z.number(), index, z.number(), z.number()])),
]);

type Payload = z.infer<typeof payloadSchema>;

export function stateToV1Payload(state: VoltageDropCalculatorState): Payload {
  const { kind, volts, ratedAmps, reservePercent } = state.powerSupply;
  return [
    V1_INPUT_MODES.indexOf(state.inputMode),
    [V1_SUPPLY_KINDS.indexOf(kind), volts, ratedAmps, reservePercent],
    state.dropLimitPercent,
    V1_WIRE_SYSTEMS.indexOf(state.wireSystem),
    V1_CABLE_LENGTH_UNITS.indexOf(state.cableLengthUnit),
    state.deviceGroups.map((group) => [
      group.name,
      group.deviceCount,
      V1_LOAD_INPUTS.indexOf(group.load.input),
      group.load.input === 'amps' ? group.load.amps : group.load.watts,
      V1_WIRE_GAUGES.indexOf(group.gauge),
      group.cableLength,
      group.colorIndex,
    ]),
  ];
}

/**
 * Turns a decoded v1 payload back into a state-shaped object, or null when the
 * shape is wrong. An out-of-range index becomes undefined, so the caller's
 * voltageDropCalculatorStateSchema check (which also covers counts, ranges and
 * Simple mode's rules) rejects it.
 */
export function v1PayloadToState(raw: unknown): unknown {
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const [inputModeIndex, supply, dropLimitPercent, systemIndex, unitIndex, groups] = parsed.data;
  const [kindIndex, volts, ratedAmps, reservePercent] = supply;

  return {
    inputMode: V1_INPUT_MODES[inputModeIndex],
    powerSupply: { kind: V1_SUPPLY_KINDS[kindIndex], volts, ratedAmps, reservePercent },
    dropLimitPercent,
    wireSystem: V1_WIRE_SYSTEMS[systemIndex],
    cableLengthUnit: V1_CABLE_LENGTH_UNITS[unitIndex],
    deviceGroups: groups.map((group, position) => {
      const [name, deviceCount, inputIndex, load, gaugeIndex, cableLength, colorIndex] = group;
      const input = V1_LOAD_INPUTS[inputIndex];
      return {
        id: `g${position + 1}`,
        name,
        deviceCount,
        load: input === 'watts' ? { input, watts: load } : { input, amps: load },
        gauge: V1_WIRE_GAUGES[gaugeIndex],
        cableLength,
        colorIndex,
      };
    }),
  };
}
