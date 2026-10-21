import {
  bandwidthCameraGroupSchema,
  bandwidthInputSchema,
  changeBitrateSource,
  createBandwidthCameraGroup,
  createDefaultBandwidthInput,
  type BitrateSource,
  type NetworkLinks,
  type OverheadPercent,
  type RecordedStreams,
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
import { groupColors } from '../../../../theme/palettes';

/*
 * The bandwidth calculator's whole state: calc-core's bandwidth input plus
 * UI-only data (each group's palette colour). Validated by a schema so it can
 * be restored from a shared link.
 */

export const bandwidthGroupStateSchema = bandwidthCameraGroupSchema.extend({
  colorIndex: colorIndexSchema,
});

export const bandwidthCalculatorStateSchema = bandwidthInputSchema.extend({
  cameraGroups: groupListSchema(bandwidthGroupStateSchema),
});

export type BandwidthGroupState = z.infer<typeof bandwidthGroupStateSchema>;
export type BandwidthCalculatorState = z.infer<typeof bandwidthCalculatorStateSchema>;

/** Group fields a user edits directly. Bitrate source changes go through set-bitrate-source. */
export type BandwidthGroupChanges = Partial<Omit<BandwidthGroupState, 'id' | 'colorIndex'>>;

export type BandwidthCalculatorAction =
  | { type: 'load-state'; state: BandwidthCalculatorState }
  | { type: 'update-group'; id: string; changes: BandwidthGroupChanges }
  | { type: 'set-bitrate-source'; id: string; source: BitrateSource }
  | { type: 'add-group' }
  | { type: 'duplicate-group'; id: string }
  | { type: 'remove-group'; id: string }
  | { type: 'restore-group'; group: BandwidthGroupState; index: number }
  | { type: 'set-recorded-streams'; recordedStreams: RecordedStreams }
  | { type: 'update-remote-viewing'; changes: Partial<RemoteViewing> }
  | { type: 'update-network'; changes: Partial<NetworkLinks> }
  | { type: 'set-overhead'; overheadPercent: OverheadPercent };

export function createInitialBandwidthCalculatorState(): BandwidthCalculatorState {
  const input = createDefaultBandwidthInput();
  return {
    ...input,
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

export function bandwidthCalculatorReducer(
  state: BandwidthCalculatorState,
  action: BandwidthCalculatorAction
): BandwidthCalculatorState {
  const groups = state.cameraGroups;

  switch (action.type) {
    case 'load-state':
      // Restored state is already schema-valid; fix any neighbouring groups that share a colour.
      return { ...action.state, cameraGroups: repairGroupColors(action.state.cameraGroups) };

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

    case 'set-recorded-streams':
      return { ...state, recordedStreams: action.recordedStreams };

    case 'update-remote-viewing':
      return { ...state, remoteViewing: { ...state.remoteViewing, ...action.changes } };

    case 'update-network':
      return { ...state, network: { ...state.network, ...action.changes } };

    case 'set-overhead':
      return { ...state, overheadPercent: action.overheadPercent };
  }
}
