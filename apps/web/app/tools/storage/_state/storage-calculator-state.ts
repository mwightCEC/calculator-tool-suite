import {
  cameraGroupSchema,
  changeBitrateSource,
  createDefaultStorageCalculationInput,
  DEFAULT_CAMERA_GROUP_SETTINGS,
  MAX_GROUP_NAME_LENGTH,
  normalizeDriveCount,
  storageCalculationInputSchema,
  type BitrateSource,
  type CalculationMode,
  type CameraGroup,
  type StorageSettings,
} from '@cctv/calc-core';
import { z } from 'zod';
import { groupColors } from '../../../../theme/palettes';

/*
 * The storage calculator's whole state: calc-core's calculation input plus
 * UI-only data (each group's palette colour). Validated by a schema so it can
 * be restored from a shared link.
 */

export const MAX_CAMERA_GROUPS = 20;

export const cameraGroupStateSchema = cameraGroupSchema.extend({
  /** Index into the theme's group colours; assigned when the group is created. */
  colorIndex: z
    .int()
    .min(0)
    .max(groupColors.length - 1),
});

export const storageCalculatorStateSchema = storageCalculationInputSchema.extend({
  cameraGroups: z.array(cameraGroupStateSchema).min(1).max(MAX_CAMERA_GROUPS),
});

export type CameraGroupState = z.infer<typeof cameraGroupStateSchema>;
export type StorageCalculatorState = z.infer<typeof storageCalculatorStateSchema>;

/** Group fields a user edits directly. Bitrate source changes go through set-bitrate-source. */
export type CameraGroupChanges = Partial<Omit<CameraGroupState, 'id' | 'colorIndex'>>;

export type StorageCalculatorAction =
  | { type: 'set-mode'; mode: CalculationMode }
  | { type: 'update-group'; id: string; changes: CameraGroupChanges }
  | { type: 'set-bitrate-source'; id: string; source: BitrateSource }
  | { type: 'add-group' }
  | { type: 'duplicate-group'; id: string }
  | { type: 'remove-group'; id: string }
  | { type: 'restore-group'; group: CameraGroupState; index: number }
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

/** Next unused numeric id, e.g. g4 after g1–g3. Short ids keep shared links compact. */
function nextGroupNumber(groups: readonly CameraGroupState[]): number {
  const numbers = groups.map((group) => Number(group.id.replace(/^g/, '')) || 0);
  return Math.max(0, ...numbers) + 1;
}

/** New groups take the palette colour after the last group's. */
function nextColorIndex(groups: readonly CameraGroupState[]): number {
  const last = groups.at(-1);
  return last ? (last.colorIndex + 1) % groupColors.length : 0;
}

function createGroup(groups: readonly CameraGroupState[]): CameraGroupState {
  const number = nextGroupNumber(groups);
  return {
    id: `g${number}`,
    name: `Camera group ${number}`,
    colorIndex: nextColorIndex(groups),
    ...DEFAULT_CAMERA_GROUP_SETTINGS,
  };
}

function duplicateGroup(
  groups: readonly CameraGroupState[],
  source: CameraGroupState
): CameraGroupState {
  return {
    ...source,
    id: `g${nextGroupNumber(groups)}`,
    name: `${source.name} copy`.slice(0, MAX_GROUP_NAME_LENGTH),
    colorIndex: nextColorIndex(groups),
  };
}

function updateGroup(
  state: StorageCalculatorState,
  id: string,
  update: (group: CameraGroupState) => CameraGroupState
): StorageCalculatorState {
  return {
    ...state,
    cameraGroups: state.cameraGroups.map((group) => (group.id === id ? update(group) : group)),
  };
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
    case 'set-mode':
      return { ...state, mode: action.mode };

    case 'update-group':
      return updateGroup(state, action.id, (group) => ({ ...group, ...action.changes }));

    case 'set-bitrate-source':
      return updateGroup(state, action.id, (group) => ({
        ...group,
        bitrate: changeBitrateSource(group satisfies CameraGroup, action.source),
      }));

    case 'add-group':
      if (groups.length >= MAX_CAMERA_GROUPS) {
        return state;
      }
      return { ...state, cameraGroups: [...groups, createGroup(groups)] };

    case 'duplicate-group': {
      const index = groups.findIndex((group) => group.id === action.id);
      const source = groups[index];
      if (!source || groups.length >= MAX_CAMERA_GROUPS) {
        return state;
      }
      const copy = duplicateGroup(groups, source);
      return { ...state, cameraGroups: groups.toSpliced(index + 1, 0, copy) };
    }

    case 'remove-group':
      if (groups.length <= 1) {
        return state;
      }
      return { ...state, cameraGroups: groups.filter((group) => group.id !== action.id) };

    case 'restore-group': {
      const alreadyPresent = groups.some((group) => group.id === action.group.id);
      if (alreadyPresent || groups.length >= MAX_CAMERA_GROUPS) {
        return state;
      }
      const index = Math.min(action.index, groups.length);
      return { ...state, cameraGroups: groups.toSpliced(index, 0, action.group) };
    }

    case 'update-storage':
      return { ...state, storage: updateStorage(state.storage, action.changes) };
  }
}
