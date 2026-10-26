import type { CableLengthUnit, PortStandard, PowerInput } from '@cctv/calc-core';
import { z } from 'zod';
import type { InputMode } from '../../../../lib/input-mode';
import type { PoeCalculatorState } from './poe-calculator-state';

/*
 * PoE budget share link format v1: a compact positional JSON array.
 *
 *   [switch, cableLengthUnit, groups, inputMode?]
 *   switch = [budgetWatts, ports, portStandard, reservePercent]
 *   group  = [name, deviceCount, powerInput, power, cableLength, colorIndex]
 *            power is the PoE class (0–8) or the watts, depending on powerInput;
 *            cableLength is 0 when not given (100 m assumed).
 *
 * Choices are stored as indexes into the tables below. Those tables ARE the
 * format: only ever append to them. Reordering or removing an entry would make
 * existing links decode to the wrong value; a change like that needs a new
 * format version. Group ids are not stored and are re-created as g1, g2, … .
 *
 * inputMode is an optional last item, as in the other calculators' links;
 * links without it open in Advanced.
 */

export const V1_PORT_STANDARDS = [
  'af',
  'at',
  'bt-type3',
  'bt-type4',
] as const satisfies readonly PortStandard[];
export const V1_POWER_INPUTS = ['watts', 'class'] as const satisfies readonly PowerInput[];
export const V1_CABLE_LENGTH_UNITS = ['ft', 'm'] as const satisfies readonly CableLengthUnit[];
export const V1_INPUT_MODES = ['advanced', 'simple'] as const satisfies readonly InputMode[];

const index = z.int().nonnegative();

/** Shape check only; value ranges are validated afterwards by the state schema. */
const payloadSchema = z.tuple([
  z.tuple([z.number(), z.number(), index, z.number()]),
  index,
  z.array(z.tuple([z.string(), z.number(), index, z.number(), z.number(), z.number()])),
  index.optional(),
]);

type Payload = z.infer<typeof payloadSchema>;

/** Cable lengths are positive when given, so 0 stands for "not given". */
const NOT_GIVEN = 0;

export function stateToV1Payload(state: PoeCalculatorState): Payload {
  const { budgetWatts, ports, portStandard, reservePercent } = state.powerSource;
  return [
    [budgetWatts, ports, V1_PORT_STANDARDS.indexOf(portStandard), reservePercent],
    V1_CABLE_LENGTH_UNITS.indexOf(state.cableLengthUnit),
    state.deviceGroups.map((group) => [
      group.name,
      group.deviceCount,
      V1_POWER_INPUTS.indexOf(group.power.input),
      group.power.input === 'class' ? group.power.poeClass : group.power.watts,
      group.cableLength ?? NOT_GIVEN,
      group.colorIndex,
    ]),
    V1_INPUT_MODES.indexOf(state.inputMode),
  ];
}

/**
 * Turns a decoded v1 payload back into a state-shaped object, or null when the
 * shape is wrong. An out-of-range index becomes undefined, so the caller's
 * poeCalculatorStateSchema check (which also covers counts, ranges and limits)
 * rejects it.
 */
export function v1PayloadToState(raw: unknown): unknown {
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const [powerSource, unitIndex, groups, inputModeIndex] = parsed.data;
  const [budgetWatts, ports, standardIndex, reservePercent] = powerSource;

  return {
    inputMode: inputModeIndex === undefined ? 'advanced' : V1_INPUT_MODES[inputModeIndex],
    powerSource: {
      budgetWatts,
      ports,
      portStandard: V1_PORT_STANDARDS[standardIndex],
      reservePercent,
    },
    cableLengthUnit: V1_CABLE_LENGTH_UNITS[unitIndex],
    deviceGroups: groups.map((group, position) => {
      const [name, deviceCount, inputIndex, power, cableLength, colorIndex] = group;
      const input = V1_POWER_INPUTS[inputIndex];
      return {
        id: `g${position + 1}`,
        name,
        deviceCount,
        power: input === 'class' ? { input, poeClass: power } : { input, watts: power },
        cableLength: cableLength === NOT_GIVEN ? null : cableLength,
        colorIndex,
      };
    }),
  };
}
