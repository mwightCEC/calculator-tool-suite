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
import { firstGroupOnly, inputModeSchema, type InputMode } from '../../../../lib/input-mode';
import { groupColors } from '../../../../theme/palettes';

/*
 * The PoE budget calculator's whole state: calc-core's PoE input plus UI-only
 * data (Simple or Advanced input, each group's palette colour). Validated by a
 * schema so it can be restored from a shared link.
 */

export const poeGroupStateSchema = poeDeviceGroupSchema.extend({
  colorIndex: colorIndexSchema,
});

/** What Simple mode fixes: a 20% reserve and no cable lengths (100 m assumed). */
export const SIMPLE_POE_SETTINGS = {
  reservePercent: 20,
  cableLength: null,
} as const;

const poeStateShape = poeInputSchema.extend({
  inputMode: inputModeSchema,
  deviceGroups: groupListSchema(poeGroupStateSchema),
});

/** True when the state is Advanced, or a Simple state within Simple's rules. */
function followsSimpleRules(state: z.infer<typeof poeStateShape>): boolean {
  const fixed = SIMPLE_POE_SETTINGS;
  return (
    state.inputMode === 'advanced' ||
    (state.deviceGroups.length === 1 &&
      state.deviceGroups[0]?.cableLength === fixed.cableLength &&
      state.powerSource.reservePercent === fixed.reservePercent)
  );
}

export const poeCalculatorStateSchema = poeStateShape.refine(followsSimpleRules, {
  message: 'Simple mode has one device group and uses the fixed Simple settings',
});

export type PoeGroupState = z.infer<typeof poeGroupStateSchema>;
export type PoeCalculatorState = z.infer<typeof poeCalculatorStateSchema>;

/** Group fields a user edits directly. Power input changes go through set-power-input. */
export type PoeGroupChanges = Partial<Omit<PoeGroupState, 'id' | 'colorIndex'>>;

export type PoeCalculatorAction =
  | { type: 'load-state'; state: PoeCalculatorState }
  | { type: 'set-input-mode'; inputMode: InputMode }
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
    inputMode: 'simple',
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

/**
 * Simple mode calculates with exactly what it shows: one device group, the
 * fixed reserve and no cable length. Returns the same state when it already fits.
 */
function applySimpleRules(state: PoeCalculatorState): PoeCalculatorState {
  if (followsSimpleRules(state)) {
    return state;
  }
  const fixed = SIMPLE_POE_SETTINGS;
  return {
    ...state,
    deviceGroups: firstGroupOnly(state.deviceGroups).map((group) => ({
      ...group,
      cableLength: fixed.cableLength,
    })),
    powerSource: { ...state.powerSource, reservePercent: fixed.reservePercent },
  };
}

/** What switching to Simple would change, for the Undo message; empty when nothing would. */
export function describeSwitchToSimple(state: PoeCalculatorState): string[] {
  if (state.inputMode === 'simple') {
    return [];
  }
  const fixed = SIMPLE_POE_SETTINGS;
  const removed = state.deviceGroups.length - 1;
  return [
    removed > 0 && `removed ${removed} device group${removed === 1 ? '' : 's'}`,
    state.deviceGroups[0]?.cableLength !== fixed.cableLength && 'cable length cleared',
    state.powerSource.reservePercent !== fixed.reservePercent && 'reserve set to 20%',
  ].filter((change) => change !== false);
}

export function poeCalculatorReducer(
  state: PoeCalculatorState,
  action: PoeCalculatorAction
): PoeCalculatorState {
  // Every action, including undos, keeps Simple mode within its rules.
  return applySimpleRules(reduce(state, action));
}

function reduce(state: PoeCalculatorState, action: PoeCalculatorAction): PoeCalculatorState {
  const groups = state.deviceGroups;

  switch (action.type) {
    case 'load-state':
      // Restored state is already schema-valid; fix any neighbouring groups that share a colour.
      return { ...action.state, deviceGroups: repairGroupColors(action.state.deviceGroups) };

    case 'set-input-mode':
      return action.inputMode === state.inputMode
        ? state
        : { ...state, inputMode: action.inputMode };

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
      return withGroups(
        state,
        addGroup(groups, ({ id, name, colorIndex }) => ({
          ...createPoeDeviceGroup(id, name),
          colorIndex,
        }))
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
