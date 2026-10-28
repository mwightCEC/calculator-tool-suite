import {
  createDefaultVoltageDropInput,
  createVoltageDropGroup,
  DEFAULT_LOAD_AMPS,
  DEFAULT_LOAD_WATTS,
  equivalentGauge,
  groupsMatchWireSystem,
  MAX_RUN_LENGTH,
  METRES_PER_FOOT,
  voltageDropGroupSchema,
  voltageDropInputShape,
  WIRE_SYSTEM_MISMATCH,
  type CableLengthUnit,
  type DeviceLoad,
  type DropLimitPercent,
  type LoadInput,
  type PowerSupply,
  type WireSystem,
} from '@cctv/calc-core';
import { z } from 'zod';
import { repairGroupColors } from '../../../../lib/camera-groups/group-colors';
import {
  addGroup,
  colorIndexSchema,
  duplicateGroup,
  groupListSchema,
  removeGroup,
  type ListedGroup,
  restoreGroup,
  updateGroup,
} from '../../../../lib/camera-groups/group-list';
import { firstGroupOnly, inputModeSchema, type InputMode } from '../../../../lib/input-mode';
import { groupColors } from '../../../../theme/palettes';

/*
 * The voltage drop calculator's whole state: calc-core's voltage drop input
 * plus UI-only data (Simple or Advanced input, each group's palette colour).
 * Validated by a schema so it can be restored from a shared link.
 */

export const voltageDropGroupStateSchema = voltageDropGroupSchema.extend({
  colorIndex: colorIndexSchema,
});

/** The supplies offered as one choice; Advanced can also set any other voltage. */
export const SUPPLY_PRESETS: readonly Pick<PowerSupply, 'kind' | 'volts'>[] = [
  { kind: 'dc', volts: 12 },
  { kind: 'dc', volts: 24 },
  { kind: 'ac', volts: 24 },
];

/** The preset a supply matches, or undefined for a custom voltage. */
export function supplyPresetIndex(supply: Pick<PowerSupply, 'kind' | 'volts'>): number | undefined {
  const index = SUPPLY_PRESETS.findIndex(
    (preset) => preset.kind === supply.kind && preset.volts === supply.volts
  );
  return index === -1 ? undefined : index;
}

/** What Simple mode fixes: a 10% drop limit, a 20% reserve and a preset supply. */
export const SIMPLE_VOLTAGE_DROP_SETTINGS = {
  dropLimitPercent: 10,
  reservePercent: 20,
  supply: SUPPLY_PRESETS[0] as Pick<PowerSupply, 'kind' | 'volts'>,
} as const;

const voltageDropStateShape = voltageDropInputShape.extend({
  inputMode: inputModeSchema,
  deviceGroups: groupListSchema(voltageDropGroupStateSchema),
});

/** True when the state is Advanced, or a Simple state within Simple's rules. */
function followsSimpleRules(state: z.infer<typeof voltageDropStateShape>): boolean {
  const fixed = SIMPLE_VOLTAGE_DROP_SETTINGS;
  return (
    state.inputMode === 'advanced' ||
    (state.deviceGroups.length === 1 &&
      state.dropLimitPercent === fixed.dropLimitPercent &&
      state.powerSupply.reservePercent === fixed.reservePercent &&
      supplyPresetIndex(state.powerSupply) !== undefined)
  );
}

export const voltageDropCalculatorStateSchema = voltageDropStateShape
  .refine(groupsMatchWireSystem, WIRE_SYSTEM_MISMATCH)
  .refine(followsSimpleRules, {
    message: 'Simple mode has one device group and uses the fixed Simple settings',
  });

export type VoltageDropGroupState = z.infer<typeof voltageDropGroupStateSchema>;
export type VoltageDropCalculatorState = z.infer<typeof voltageDropCalculatorStateSchema>;

/** Group fields a user edits directly. Load input changes go through set-load-input. */
export type VoltageDropGroupChanges = Partial<Omit<VoltageDropGroupState, 'id' | 'colorIndex'>>;

export type VoltageDropCalculatorAction =
  | { type: 'load-state'; state: VoltageDropCalculatorState }
  | { type: 'set-input-mode'; inputMode: InputMode }
  | { type: 'update-group'; id: string; changes: VoltageDropGroupChanges }
  | { type: 'set-load-input'; id: string; input: LoadInput }
  | { type: 'add-group' }
  | { type: 'duplicate-group'; id: string }
  | { type: 'remove-group'; id: string }
  | { type: 'restore-group'; group: VoltageDropGroupState; index: number }
  | { type: 'clear-groups' }
  | { type: 'restore-groups'; groups: VoltageDropGroupState[] }
  | { type: 'update-supply'; changes: Partial<PowerSupply> }
  | { type: 'set-drop-limit'; dropLimitPercent: DropLimitPercent }
  | { type: 'set-wire-system'; wireSystem: WireSystem }
  | { type: 'set-cable-length-unit'; unit: CableLengthUnit };

export function createInitialVoltageDropCalculatorState(): VoltageDropCalculatorState {
  const input = createDefaultVoltageDropInput();
  return {
    ...input,
    inputMode: 'simple',
    deviceGroups: input.deviceGroups.map((group, index) => ({
      ...group,
      colorIndex: index % groupColors.length,
    })),
  };
}

/** Load for a new input choice: the defaults, since amps and watts don't convert without volts. */
function loadFor(input: LoadInput): DeviceLoad {
  return input === 'amps'
    ? { input, amps: DEFAULT_LOAD_AMPS }
    : { input, watts: DEFAULT_LOAD_WATTS };
}

/** A run length entered in the other unit, converted to `unit` to one decimal and kept within range. */
export function convertRunLength(length: number, unit: CableLengthUnit): number {
  const converted = unit === 'm' ? length * METRES_PER_FOOT : length / METRES_PER_FOOT;
  return Math.min(MAX_RUN_LENGTH, Math.max(0.1, Math.round(converted * 10) / 10));
}

const FIRST_GROUP: ListedGroup = { id: 'g1', name: 'Camera group 1', colorIndex: 0 };

/** A default group in the state's wire system and length unit. */
function newGroup(
  state: VoltageDropCalculatorState,
  { id, name, colorIndex }: ListedGroup
): VoltageDropGroupState {
  const group = createVoltageDropGroup(id, name);
  return {
    ...group,
    gauge: equivalentGauge(group.gauge, state.wireSystem),
    cableLength:
      state.cableLengthUnit === 'ft' ? group.cableLength : convertRunLength(group.cableLength, 'm'),
    colorIndex,
  };
}

/** True when the groups differ from what Clear would leave. */
export function hasCustomGroups(state: VoltageDropCalculatorState): boolean {
  const cleared = reduce(state, { type: 'clear-groups' }).deviceGroups;
  return JSON.stringify(state.deviceGroups) !== JSON.stringify(cleared);
}

/** Swaps in a new group list, keeping the same state object when the list is unchanged. */
function withGroups(
  state: VoltageDropCalculatorState,
  deviceGroups: VoltageDropGroupState[]
): VoltageDropCalculatorState {
  return deviceGroups === state.deviceGroups ? state : { ...state, deviceGroups };
}

/**
 * Simple mode calculates with exactly what it shows: one device group, the
 * fixed limit and reserve, and a preset supply. Returns the same state when it already fits.
 */
function applySimpleRules(state: VoltageDropCalculatorState): VoltageDropCalculatorState {
  if (followsSimpleRules(state)) {
    return state;
  }
  const fixed = SIMPLE_VOLTAGE_DROP_SETTINGS;
  const supply = supplyPresetIndex(state.powerSupply) === undefined ? fixed.supply : {};
  return {
    ...state,
    deviceGroups: firstGroupOnly(state.deviceGroups),
    dropLimitPercent: fixed.dropLimitPercent,
    powerSupply: { ...state.powerSupply, ...supply, reservePercent: fixed.reservePercent },
  };
}

/** What switching to Simple would change, for the Undo message; empty when nothing would. */
export function describeSwitchToSimple(state: VoltageDropCalculatorState): string[] {
  if (state.inputMode === 'simple') {
    return [];
  }
  const fixed = SIMPLE_VOLTAGE_DROP_SETTINGS;
  const removed = state.deviceGroups.length - 1;
  return [
    removed > 0 && `removed ${removed} device group${removed === 1 ? '' : 's'}`,
    supplyPresetIndex(state.powerSupply) === undefined && 'supply set to 12 V DC',
    state.dropLimitPercent !== fixed.dropLimitPercent && 'drop limit set to 10%',
    state.powerSupply.reservePercent !== fixed.reservePercent && 'reserve set to 20%',
  ].filter((change) => change !== false);
}

export function voltageDropCalculatorReducer(
  state: VoltageDropCalculatorState,
  action: VoltageDropCalculatorAction
): VoltageDropCalculatorState {
  // Every action, including undos, keeps Simple mode within its rules.
  return applySimpleRules(reduce(state, action));
}

function reduce(
  state: VoltageDropCalculatorState,
  action: VoltageDropCalculatorAction
): VoltageDropCalculatorState {
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

    case 'set-load-input':
      return withGroups(
        state,
        updateGroup(groups, action.id, (group) =>
          group.load.input === action.input ? group : { ...group, load: loadFor(action.input) }
        )
      );

    case 'add-group':
      return withGroups(
        state,
        addGroup(groups, (fields) => newGroup(state, fields))
      );

    case 'duplicate-group':
      return withGroups(state, duplicateGroup(groups, action.id));

    case 'remove-group':
      return withGroups(state, removeGroup(groups, action.id));

    case 'restore-group':
      return withGroups(state, restoreGroup(groups, action.group, action.index));

    case 'clear-groups':
      // Back to the single default group; the supply, limit and units are kept.
      return { ...state, deviceGroups: [newGroup(state, FIRST_GROUP)] };

    case 'restore-groups':
      return withGroups(state, action.groups);

    case 'update-supply':
      return { ...state, powerSupply: { ...state.powerSupply, ...action.changes } };

    case 'set-drop-limit':
      return { ...state, dropLimitPercent: action.dropLimitPercent };

    case 'set-wire-system':
      return action.wireSystem === state.wireSystem
        ? state
        : {
            ...state,
            wireSystem: action.wireSystem,
            deviceGroups: groups.map((group) => ({
              ...group,
              gauge: equivalentGauge(group.gauge, action.wireSystem),
            })),
          };

    case 'set-cable-length-unit':
      return action.unit === state.cableLengthUnit
        ? state
        : {
            ...state,
            cableLengthUnit: action.unit,
            deviceGroups: groups.map((group) => ({
              ...group,
              cableLength: convertRunLength(group.cableLength, action.unit),
            })),
          };
  }
}
