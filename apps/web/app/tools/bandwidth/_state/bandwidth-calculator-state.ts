import {
  bandwidthCameraGroupSchema,
  bandwidthInputSchema,
  changeBitrateSource,
  createBandwidthCameraGroup,
  createDefaultBandwidthInput,
  type BitrateSource,
  type NetworkLinks,
  type OverheadPercent,
  type RemoteViewing,
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
 * The bandwidth calculator's whole state: calc-core's bandwidth input plus
 * UI-only data (Simple or Advanced input, each group's palette colour).
 * Validated by a schema so it can be restored from a shared link.
 */

export const bandwidthGroupStateSchema = bandwidthCameraGroupSchema.extend({
  colorIndex: colorIndexSchema,
});

/** What Simple mode fixes: remote viewing and the uplink check are off, with the default overhead. */
export const SIMPLE_BANDWIDTH_SETTINGS = {
  overheadPercent: 10,
} as const;

const bandwidthStateShape = bandwidthInputSchema.extend({
  inputMode: inputModeSchema,
  cameraGroups: groupListSchema(bandwidthGroupStateSchema),
});

/** True when the state is Advanced, or a Simple state within Simple's rules. */
function followsSimpleRules(state: z.infer<typeof bandwidthStateShape>): boolean {
  const fixed = SIMPLE_BANDWIDTH_SETTINGS;
  return (
    state.inputMode === 'advanced' ||
    (state.cameraGroups.length === 1 &&
      !state.remoteViewing.enabled &&
      state.network.uplinkMbps === null &&
      state.overheadPercent === fixed.overheadPercent)
  );
}

export const bandwidthCalculatorStateSchema = bandwidthStateShape.refine(followsSimpleRules, {
  message: 'Simple mode has one camera group and uses the fixed Simple settings',
});

export type BandwidthGroupState = z.infer<typeof bandwidthGroupStateSchema>;
export type BandwidthCalculatorState = z.infer<typeof bandwidthCalculatorStateSchema>;

/** Group fields a user edits directly. Bitrate source changes go through set-bitrate-source. */
export type BandwidthGroupChanges = Partial<Omit<BandwidthGroupState, 'id' | 'colorIndex'>>;

export type BandwidthCalculatorAction =
  | { type: 'load-state'; state: BandwidthCalculatorState }
  | { type: 'set-input-mode'; inputMode: InputMode }
  | { type: 'update-group'; id: string; changes: BandwidthGroupChanges }
  | { type: 'set-bitrate-source'; id: string; source: BitrateSource }
  | { type: 'add-group' }
  | { type: 'duplicate-group'; id: string }
  | { type: 'remove-group'; id: string }
  | { type: 'restore-group'; group: BandwidthGroupState; index: number }
  | { type: 'clear-groups' }
  | { type: 'restore-groups'; groups: BandwidthGroupState[] }
  | { type: 'update-remote-viewing'; changes: Partial<RemoteViewing> }
  | { type: 'update-network'; changes: Partial<NetworkLinks> }
  | { type: 'set-overhead'; overheadPercent: OverheadPercent };

export function createInitialBandwidthCalculatorState(): BandwidthCalculatorState {
  const input = createDefaultBandwidthInput();
  return {
    ...input,
    inputMode: 'simple',
    cameraGroups: input.cameraGroups.map((group, index) => ({
      ...group,
      colorIndex: index % groupColors.length,
    })),
  };
}

/** Swaps in a new group list, keeping the same state object when the list is unchanged. */
function withGroups(
  state: BandwidthCalculatorState,
  cameraGroups: BandwidthGroupState[]
): BandwidthCalculatorState {
  return cameraGroups === state.cameraGroups ? state : { ...state, cameraGroups };
}

/**
 * Simple mode calculates with exactly what it shows: one camera group and the
 * fixed Simple settings. Returns the same state when it already fits.
 */
function applySimpleRules(state: BandwidthCalculatorState): BandwidthCalculatorState {
  if (followsSimpleRules(state)) {
    return state;
  }
  return {
    ...state,
    cameraGroups: firstGroupOnly(state.cameraGroups),
    remoteViewing: { ...state.remoteViewing, enabled: false },
    network: { ...state.network, uplinkMbps: null },
    overheadPercent: SIMPLE_BANDWIDTH_SETTINGS.overheadPercent,
  };
}

/** What switching to Simple would change, for the Undo message; empty when nothing would. */
export function describeSwitchToSimple(state: BandwidthCalculatorState): string[] {
  if (state.inputMode === 'simple') {
    return [];
  }
  const { overheadPercent } = SIMPLE_BANDWIDTH_SETTINGS;
  const removed = state.cameraGroups.length - 1;
  return [
    removed > 0 && `removed ${removed} camera group${removed === 1 ? '' : 's'}`,
    state.remoteViewing.enabled && 'remote viewing turned off',
    state.network.uplinkMbps !== null && 'uplink check turned off',
    state.overheadPercent !== overheadPercent && `overhead set to ${overheadPercent}%`,
  ].filter((change) => change !== false);
}

export function bandwidthCalculatorReducer(
  state: BandwidthCalculatorState,
  action: BandwidthCalculatorAction
): BandwidthCalculatorState {
  // Every action, including undos, keeps Simple mode within its rules.
  return applySimpleRules(reduce(state, action));
}

function reduce(
  state: BandwidthCalculatorState,
  action: BandwidthCalculatorAction
): BandwidthCalculatorState {
  const groups = state.cameraGroups;

  switch (action.type) {
    case 'load-state':
      // Restored state is already schema-valid; fix any neighbouring groups that share a colour.
      return { ...action.state, cameraGroups: repairGroupColors(action.state.cameraGroups) };

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
        addGroup(groups, ({ id, name, colorIndex }) => ({
          ...createBandwidthCameraGroup(id, name),
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
      // Back to the single default group; system settings are kept.
      return { ...state, cameraGroups: createInitialBandwidthCalculatorState().cameraGroups };

    case 'restore-groups':
      return withGroups(state, action.groups);

    case 'update-remote-viewing':
      return { ...state, remoteViewing: { ...state.remoteViewing, ...action.changes } };

    case 'update-network':
      return { ...state, network: { ...state.network, ...action.changes } };

    case 'set-overhead':
      return { ...state, overheadPercent: action.overheadPercent };
  }
}
