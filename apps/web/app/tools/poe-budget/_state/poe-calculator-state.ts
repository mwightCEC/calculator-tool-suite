import {
  createDefaultPoeInput,
  createPoeDeviceGroup,
  DEFAULT_DEVICE_WATTS,
  DEFAULT_POE_CLASS,
  MAX_CABLE_LENGTH,
  METRES_PER_FOOT,
  poeDeviceGroupSchema,
  poeInputSchema,
  type CableLengthUnit,
  type DevicePower,
  type PoeSwitch,
  type PowerInput,
} from '@cctv/calc-core';
import { z } from 'zod';
import { repairGroupColors } from '../../../../lib/camera-groups/group-colors';
import {
  addGroup,
  colorIndexSchema,
  duplicateGroup,
  groupListSchema,
  removeGroup,
  restoreGroup,
  updateGroup,
} from '../../../../lib/camera-groups/group-list';
import { groupColors } from '../../../../theme/palettes';

/*
 * The PoE budget calculator's whole state: calc-core's PoE input plus UI-only
 * data (each group's palette colour). Validated by a schema so it can be
 * restored from a shared link.
 */

export const poeGroupStateSchema = poeDeviceGroupSchema.extend({
  colorIndex: colorIndexSchema,
});

export const poeCalculatorStateSchema = poeInputSchema.extend({
  deviceGroups: groupListSchema(poeGroupStateSchema),
});

export type PoeGroupState = z.infer<typeof poeGroupStateSchema>;
export type PoeCalculatorState = z.infer<typeof poeCalculatorStateSchema>;

/** Group fields a user edits directly. Power input changes go through set-power-input. */
export type PoeGroupChanges = Partial<Omit<PoeGroupState, 'id' | 'colorIndex'>>;

export type PoeCalculatorAction =
  | { type: 'load-state'; state: PoeCalculatorState }
  | { type: 'update-group'; id: string; changes: PoeGroupChanges }
  | { type: 'set-power-input'; id: string; input: PowerInput }
  | { type: 'add-group' }
  | { type: 'duplicate-group'; id: string }
  | { type: 'remove-group'; id: string }
  | { type: 'restore-group'; group: PoeGroupState; index: number }
  | { type: 'clear-groups' }
  | { type: 'restore-groups'; groups: PoeGroupState[] }
  | { type: 'update-switch'; changes: Partial<PoeSwitch> }
  | { type: 'set-cable-length-unit'; unit: CableLengthUnit };

export function createInitialPoeCalculatorState(): PoeCalculatorState {
  const input = createDefaultPoeInput();
  return {
    ...input,
    deviceGroups: input.deviceGroups.map((group, index) => ({
      ...group,
      colorIndex: index % groupColors.length,
    })),
  };
}

/** Power for a new input choice: the defaults, since a class and a wattage don't convert. */
function powerFor(input: PowerInput): DevicePower {
  return input === 'class'
    ? { input, poeClass: DEFAULT_POE_CLASS }
    : { input, watts: DEFAULT_DEVICE_WATTS };
}

/** A length entered in the other unit, converted to `unit` to one decimal and kept within range. */
export function convertCableLength(length: number | null, unit: CableLengthUnit): number | null {
  if (length === null) {
    return null;
  }
  const converted = unit === 'm' ? length * METRES_PER_FOOT : length / METRES_PER_FOOT;
  return Math.min(MAX_CABLE_LENGTH, Math.max(0.1, Math.round(converted * 10) / 10));
}

/** Swaps in a new group list, keeping the same state object when the list is unchanged. */
function withGroups(state: PoeCalculatorState, deviceGroups: PoeGroupState[]): PoeCalculatorState {
  return deviceGroups === state.deviceGroups ? state : { ...state, deviceGroups };
}

export function poeCalculatorReducer(
  state: PoeCalculatorState,
  action: PoeCalculatorAction
): PoeCalculatorState {
  const groups = state.deviceGroups;

  switch (action.type) {
    case 'load-state':
      // Restored state is already schema-valid; fix any neighbouring groups that share a colour.
      return { ...action.state, deviceGroups: repairGroupColors(action.state.deviceGroups) };

    case 'update-group':
      return withGroups(
        state,
        updateGroup(groups, action.id, (group) => ({ ...group, ...action.changes }))
      );

    case 'set-power-input':
      return withGroups(
        state,
        updateGroup(groups, action.id, (group) =>
          group.power.input === action.input ? group : { ...group, power: powerFor(action.input) }
        )
      );

    case 'add-group':
      // New groups go at the top, where the page has just collapsed the others.
      return withGroups(
        state,
        addGroup(
          groups,
          ({ id, name, colorIndex }) => ({ ...createPoeDeviceGroup(id, name), colorIndex }),
          'start'
        )
      );

    case 'duplicate-group':
      return withGroups(state, duplicateGroup(groups, action.id));

    case 'remove-group':
      return withGroups(state, removeGroup(groups, action.id));

    case 'restore-group':
      return withGroups(state, restoreGroup(groups, action.group, action.index));

    case 'clear-groups':
      // Back to the single default group; the switch settings are kept.
      return { ...state, deviceGroups: createInitialPoeCalculatorState().deviceGroups };

    case 'restore-groups':
      return withGroups(state, action.groups);

    case 'update-switch':
      return { ...state, powerSource: { ...state.powerSource, ...action.changes } };

    case 'set-cable-length-unit':
      return action.unit === state.cableLengthUnit
        ? state
        : {
            ...state,
            cableLengthUnit: action.unit,
            deviceGroups: groups.map((group) => ({
              ...group,
              cableLength: convertCableLength(group.cableLength, action.unit),
            })),
          };
  }
}
