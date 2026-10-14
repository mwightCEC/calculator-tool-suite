'use client';

import { useMemo, useReducer } from 'react';
import {
  calculateStorage,
  type BitrateSource,
  type CalculationMode,
  type StorageSettings,
} from '@cctv/calc-core';
import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  createInitialStorageCalculatorState,
  storageCalculatorReducer,
  type CameraGroupChanges,
} from './storage-calculator-state';

const UNDO_TIMEOUT_MS = 6000;

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

  const removeGroup = (id: string) => {
    const index = state.cameraGroups.findIndex((group) => group.id === id);
    const group = state.cameraGroups[index];
    if (!group || state.cameraGroups.length <= 1) {
      return;
    }
    dispatch({ type: 'remove-group', id });

    // Deleting is immediate; offer Undo instead of a confirmation dialog.
    const notificationId = `group-removed-${id}-${Date.now()}`;
    const undo = () => {
      dispatch({ type: 'restore-group', group, index });
      notifications.hide(notificationId);
    };
    notifications.show({
      id: notificationId,
      autoClose: UNDO_TIMEOUT_MS,
      message: (
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Text size="sm">Deleted “{group.name}”</Text>
          <Button variant="subtle" size="compact-sm" onClick={undo}>
            Undo
          </Button>
        </Group>
      ),
    });
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
    updateStorage: (changes: Partial<StorageSettings>) =>
      dispatch({ type: 'update-storage', changes }),
  };

  return { state, result, actions };
}

export type StorageCalculatorActions = ReturnType<typeof useStorageCalculator>['actions'];
