'use client';

import { useCallback, useMemo, useReducer } from 'react';
import {
  calculateBandwidth,
  type BitrateSource,
  type NetworkLinks,
  type OverheadPercent,
  type RemoteViewing,
} from '@cctv/calc-core';
import {
  notifyGroupRemoved,
  notifyGroupsCleared,
  notifySwitchedToSimple,
} from '../../../../components/CameraGroupCard/undo-notifications';
import type { InputMode } from '../../../../lib/input-mode';
import { useUrlStateSync } from '../../../../lib/share/use-url-state-sync';
import {
  bandwidthCalculatorReducer,
  createInitialBandwidthCalculatorState,
  describeSwitchToSimple,
  type BandwidthCalculatorState,
  type BandwidthGroupChanges,
} from './bandwidth-calculator-state';
import { bandwidthShareCodec, encodeState } from './share-link';

/** The default calculation keeps a clean URL with no share parameters. */
const DEFAULT_STATE_ENCODED = encodeState(createInitialBandwidthCalculatorState());
/** Where this calculator's last state is kept in the browser. */
const SAVED_STATE_KEY = 'cctv-tool-suite:bandwidth-calculator';
const DEFAULT_GROUPS = createInitialBandwidthCalculatorState().cameraGroups;

/**
 * Bandwidth calculator state, live results and actions.
 * Results are recalculated synchronously whenever any input changes.
 */
export function useBandwidthCalculator() {
  const [state, dispatch] = useReducer(
    bandwidthCalculatorReducer,
    undefined,
    createInitialBandwidthCalculatorState
  );
  const result = useMemo(() => calculateBandwidth(state), [state]);

  const loadState = useCallback(
    (restored: BandwidthCalculatorState) => dispatch({ type: 'load-state', state: restored }),
    []
  );
  useUrlStateSync(state, loadState, bandwidthShareCodec, DEFAULT_STATE_ENCODED, SAVED_STATE_KEY);

  const removeGroup = (id: string) => {
    const index = state.cameraGroups.findIndex((group) => group.id === id);
    const group = state.cameraGroups[index];
    if (!group || state.cameraGroups.length <= 1) {
      return;
    }
    dispatch({ type: 'remove-group', id });
    notifyGroupRemoved(group, () => dispatch({ type: 'restore-group', group, index }));
  };

  // Compared through the share encoding, which covers every group field that matters.
  const hasCustomGroups =
    encodeState(state) !== encodeState({ ...state, cameraGroups: DEFAULT_GROUPS });

  const clearGroups = () => {
    if (!hasCustomGroups) {
      return;
    }
    const previous = state.cameraGroups;
    dispatch({ type: 'clear-groups' });
    notifyGroupsCleared(() => dispatch({ type: 'restore-groups', groups: previous }));
  };

  const setInputMode = (inputMode: InputMode) => {
    const previous = state;
    const changes = inputMode === 'simple' ? describeSwitchToSimple(previous) : [];
    dispatch({ type: 'set-input-mode', inputMode });
    if (changes.length > 0) {
      notifySwitchedToSimple(changes, () => dispatch({ type: 'load-state', state: previous }));
    }
  };

  const actions = {
    setInputMode,
    updateGroup: (id: string, changes: BandwidthGroupChanges) =>
      dispatch({ type: 'update-group', id, changes }),
    setBitrateSource: (id: string, source: BitrateSource) =>
      dispatch({ type: 'set-bitrate-source', id, source }),
    addGroup: () => dispatch({ type: 'add-group' }),
    duplicateGroup: (id: string) => dispatch({ type: 'duplicate-group', id }),
    removeGroup,
    clearGroups,
    updateRemoteViewing: (changes: Partial<RemoteViewing>) =>
      dispatch({ type: 'update-remote-viewing', changes }),
    updateNetwork: (changes: Partial<NetworkLinks>) =>
      dispatch({ type: 'update-network', changes }),
    setOverhead: (overheadPercent: OverheadPercent) =>
      dispatch({ type: 'set-overhead', overheadPercent }),
  };

  return { state, result, hasCustomGroups, actions };
}

export type BandwidthCalculatorActions = ReturnType<typeof useBandwidthCalculator>['actions'];
