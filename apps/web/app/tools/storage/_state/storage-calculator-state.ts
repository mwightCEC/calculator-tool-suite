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
import { groupColors } from '../../../../theme/palettes';

/*
 * The storage calculator's whole state: calc-core's calculation input plus
 * UI-only data (each group's palette colour). Validated by a schema so it can
 * be restored from a shared link.
 */

export const cameraGroupStateSchema = cameraGroupSchema.extend({
  colorIndex: colorIndexSchema,
});

export const storageCalculatorStateSchema = storageCalculationInputSchema.extend({
  cameraGroups: groupListSchema(cameraGroupStateSchema),
});

export type CameraGroupState = z.infer<typeof cameraGroupStateSchema>;
export type StorageCalculatorState = z.infer<typeof storageCalculatorStateSchema>;

/** Group fields a user edits directly. Bitrate source changes go through set-bitrate-source. */
export type CameraGroupChanges = Partial<Omit<CameraGroupState, 'id' | 'colorIndex'>>;

export type StorageCalculatorAction =
  | { type: 'load-state'; state: StorageCalculatorState }
  | { type: 'set-mode'; mode: CalculationMode }
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

export function storageCalculatorReducer(
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
