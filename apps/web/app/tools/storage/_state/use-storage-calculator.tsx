'use client';

import { useCallback, useMemo, useReducer } from 'react';
import {
  calculateStorage,
  type BitrateSource,
  type CalculationMode,
  type StorageSettings,
} from '@cctv/calc-core';
import {
  notifyGroupRemoved,
  notifyGroupsCleared,
} from '../../../../components/CameraGroupCard/undo-notifications';
import { useUrlStateSync } from '../../../../lib/share/use-url-state-sync';
import { encodeState, storageShareCodec } from './share-link';
import {
  createInitialStorageCalculatorState,
  storageCalculatorReducer,
  type CameraGroupChanges,
  type StorageCalculatorState,
} from './storage-calculator-state';

/** The default calculation keeps a clean URL with no share parameters. */
const DEFAULT_STATE_ENCODED = encodeState(createInitialStorageCalculatorState());
/** Where this calculator's last state is kept in the browser. */
const SAVED_STATE_KEY = 'cctv-tool-suite:storage-calculator';
const DEFAULT_GROUPS = createInitialStorageCalculatorState().cameraGroups;

/**
 * Storage calculator state, live results and actions.
 * Results are recalculated synchronously whenever any input changes.
 */
export function useStorageCalculator() {
  const [state, dispatch] = useReducer(
    storageCalculatorReducer,
    undefined,
    createInitialStorageCalculatorState
  );
  const result = useMemo(() => calculateStorage(state), [state]);

  const loadState = useCallback(
    (restored: StorageCalculatorState) => dispatch({ type: 'load-state', state: restored }),
    []
  );
  useUrlStateSync(state, loadState, storageShareCodec, DEFAULT_STATE_ENCODED, SAVED_STATE_KEY);

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

  const actions = {
    setMode: (mode: CalculationMode) => dispatch({ type: 'set-mode', mode }),
    updateGroup: (id: string, changes: CameraGroupChanges) =>
      dispatch({ type: 'update-group', id, changes }),
    setBitrateSource: (id: string, source: BitrateSource) =>
      dispatch({ type: 'set-bitrate-source', id, source }),
    addGroup: () => dispatch({ type: 'add-group' }),
    duplicateGroup: (id: string) => dispatch({ type: 'duplicate-group', id }),
    removeGroup,
    clearGroups,
    updateStorage: (changes: Partial<StorageSettings>) =>
      dispatch({ type: 'update-storage', changes }),
  };

  return { state, result, hasCustomGroups, actions };
}

export type StorageCalculatorActions = ReturnType<typeof useStorageCalculator>['actions'];
