import {
  cameraGroupSchema,
  changeBitrateSource,
  createDefaultStorageCalculationInput,
  DEFAULT_CAMERA_GROUP_SETTINGS,
  normalizeDriveCount,
  storageCalculationInputSchema,
  type BitrateSource,
  type CalculationMode,
  type StorageSettings,
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
 * The storage calculator's whole state: calc-core's calculation input plus
 * UI-only data (Simple or Advanced input, each group's palette colour).
 * Validated by a schema so it can be restored from a shared link.
 */

export const cameraGroupStateSchema = cameraGroupSchema.extend({
  colorIndex: colorIndexSchema,
});

/** What Simple mode fixes: the settings it hides. */
export const SIMPLE_STORAGE_SETTINGS = {
  raidLevel: 'none',
  reservePercent: 0,
} as const satisfies Partial<StorageSettings>;

export const storageCalculatorStateSchema = storageCalculationInputSchema
  .extend({
    inputMode: inputModeSchema,
    cameraGroups: groupListSchema(cameraGroupStateSchema),
  })
  .refine(
    (state) =>
      state.inputMode === 'advanced' ||
      (state.cameraGroups.length === 1 &&
        state.storage.raidLevel === SIMPLE_STORAGE_SETTINGS.raidLevel &&
        state.storage.reservePercent === SIMPLE_STORAGE_SETTINGS.reservePercent),
    { message: 'Simple mode has one camera group, no RAID and no reserve' }
  );

export type CameraGroupState = z.infer<typeof cameraGroupStateSchema>;
export type StorageCalculatorState = z.infer<typeof storageCalculatorStateSchema>;

/** Group fields a user edits directly. Bitrate source changes go through set-bitrate-source. */
export type CameraGroupChanges = Partial<Omit<CameraGroupState, 'id' | 'colorIndex'>>;

export type StorageCalculatorAction =
  | { type: 'load-state'; state: StorageCalculatorState }
  | { type: 'set-mode'; mode: CalculationMode }
  | { type: 'set-input-mode'; inputMode: InputMode }
  | { type: 'update-group'; id: string; changes: CameraGroupChanges }
  | { type: 'set-bitrate-source'; id: string; source: BitrateSource }
  | { type: 'add-group' }
  | { type: 'duplicate-group'; id: string }
  | { type: 'remove-group'; id: string }
  | { type: 'restore-group'; group: CameraGroupState; index: number }
  | { type: 'clear-groups' }
  | { type: 'restore-groups'; groups: CameraGroupState[] }
  | { type: 'update-storage'; changes: Partial<StorageSettings> };

export function createInitialStorageCalculatorState(): StorageCalculatorState {
  const input = createDefaultStorageCalculationInput();
  return {
    ...input,
    inputMode: 'simple',
    cameraGroups: input.cameraGroups.map((group, index) => ({
      ...group,
      id: `g${index + 1}`,
      colorIndex: index % groupColors.length,
    })),
  };
}

/** Swaps in a new group list, keeping the same state object when the list is unchanged. */
function withGroups(
  state: StorageCalculatorState,
  cameraGroups: CameraGroupState[]
): StorageCalculatorState {
  return cameraGroups === state.cameraGroups ? state : { ...state, cameraGroups };
}

function updateStorage(
  storage: StorageSettings,
  changes: Partial<StorageSettings>
): StorageSettings {
  const next = { ...storage, ...changes };
  // Keep the drive count valid for the RAID level (minimum and step).
  return { ...next, driveCount: normalizeDriveCount(next.raidLevel, next.driveCount) };
}

/**
 * Simple mode calculates with exactly what it shows: one camera group, no RAID
 * and no reserve. Returns the same state when it already fits.
 */
function applySimpleRules(state: StorageCalculatorState): StorageCalculatorState {
  if (state.inputMode === 'advanced') {
    return state;
  }
  const cameraGroups = firstGroupOnly(state.cameraGroups);
  const fits =
    cameraGroups === state.cameraGroups &&
    state.storage.raidLevel === SIMPLE_STORAGE_SETTINGS.raidLevel &&
    state.storage.reservePercent === SIMPLE_STORAGE_SETTINGS.reservePercent;
  return fits
    ? state
    : { ...state, cameraGroups, storage: updateStorage(state.storage, SIMPLE_STORAGE_SETTINGS) };
}

/** What switching to Simple would change, for the Undo message; empty when nothing would. */
export function describeSwitchToSimple(state: StorageCalculatorState): string[] {
  if (state.inputMode === 'simple') {
    return [];
  }
  const removed = state.cameraGroups.length - 1;
  return [
    removed > 0 && `removed ${removed} camera group${removed === 1 ? '' : 's'}`,
    state.storage.raidLevel !== SIMPLE_STORAGE_SETTINGS.raidLevel && 'RAID set to none',
    state.storage.reservePercent !== SIMPLE_STORAGE_SETTINGS.reservePercent && 'reserve set to 0%',
  ].filter((change) => change !== false);
}

export function storageCalculatorReducer(
  state: StorageCalculatorState,
  action: StorageCalculatorAction
): StorageCalculatorState {
  // Every action, including undos, keeps Simple mode within its rules.
  return applySimpleRules(reduce(state, action));
}

function reduce(
  state: StorageCalculatorState,
  action: StorageCalculatorAction
): StorageCalculatorState {
  const groups = state.cameraGroups;

  switch (action.type) {
    case 'load-state':
      // Restored state is already schema-valid; keep the drive count valid for its RAID
      // level and fix any neighbouring groups that share a colour (e.g. older links).
      return {
        ...action.state,
        cameraGroups: repairGroupColors(action.state.cameraGroups),
        storage: updateStorage(action.state.storage, {}),
      };

    case 'set-mode':
      return { ...state, mode: action.mode };

    case 'set-input-mode':
      return action.inputMode === state.inputMode
        ? state
        : { ...state, inputMode: action.inputMode };

    case 'update-group':
      return withGroups(
        state,
        updateGroup(groups, action.id, (group) => ({ ...group, ...action.changes }))
      );

    case 'set-bitrate-source':
      return withGroups(
        state,
        updateGroup(groups, action.id, (group) => ({
          ...group,
          bitrate: changeBitrateSource(group, action.source),
        }))
      );

    case 'add-group':
      return withGroups(
        state,
        addGroup(groups, (fields) => ({ ...fields, ...DEFAULT_CAMERA_GROUP_SETTINGS }))
      );

    case 'duplicate-group':
      return withGroups(state, duplicateGroup(groups, action.id));

    case 'remove-group':
      return withGroups(state, removeGroup(groups, action.id));

    case 'restore-group':
      return withGroups(state, restoreGroup(groups, action.group, action.index));

    case 'clear-groups':
      // Back to the single default group; storage settings are kept.
      return { ...state, cameraGroups: createInitialStorageCalculatorState().cameraGroups };

    case 'restore-groups':
      return withGroups(state, action.groups);

    case 'update-storage':
      return { ...state, storage: updateStorage(state.storage, action.changes) };
  }
}
