'use client';

import { useMemo, useReducer } from 'react';
import {
  calculatePoe,
  type CableLengthUnit,
  type PoeSwitch,
  type PowerInput,
} from '@cctv/calc-core';
import {
  notifyGroupRemoved,
  notifyGroupsCleared,
  notifySwitchedToSimple,
} from '../../../../components/CameraGroupCard/undo-notifications';
import type { InputMode } from '../../../../lib/input-mode';
import {
  createInitialPoeCalculatorState,
  describeSwitchToSimple,
  poeCalculatorReducer,
  type PoeGroupChanges,
} from './poe-calculator-state';

const DEFAULT_GROUPS = createInitialPoeCalculatorState().deviceGroups;

/**
 * PoE budget calculator state, live results and actions.
 * Results are recalculated synchronously whenever any input changes.
 */
export function usePoeCalculator() {
  const [state, dispatch] = useReducer(
    poeCalculatorReducer,
    undefined,
    createInitialPoeCalculatorState
  );
  const result = useMemo(() => calculatePoe(state), [state]);

  const removeGroup = (id: string) => {
    const index = state.deviceGroups.findIndex((group) => group.id === id);
    const group = state.deviceGroups[index];
    if (!group || state.deviceGroups.length <= 1) {
      return;
    }
    dispatch({ type: 'remove-group', id });
    notifyGroupRemoved(group, () => dispatch({ type: 'restore-group', group, index }));
  };

  const hasCustomGroups = JSON.stringify(state.deviceGroups) !== JSON.stringify(DEFAULT_GROUPS);

  const clearGroups = () => {
    if (!hasCustomGroups) {
      return;
    }
    const previous = state.deviceGroups;
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
    updateGroup: (id: string, changes: PoeGroupChanges) =>
      dispatch({ type: 'update-group', id, changes }),
    setPowerInput: (id: string, input: PowerInput) =>
      dispatch({ type: 'set-power-input', id, input }),
    addGroup: () => dispatch({ type: 'add-group' }),
    duplicateGroup: (id: string) => dispatch({ type: 'duplicate-group', id }),
    removeGroup,
    clearGroups,
    updateSwitch: (changes: Partial<PoeSwitch>) => dispatch({ type: 'update-switch', changes }),
    setCableLengthUnit: (unit: CableLengthUnit) =>
      dispatch({ type: 'set-cable-length-unit', unit }),
  };

  return { state, result, hasCustomGroups, actions };
}

export type PoeCalculatorActions = ReturnType<typeof usePoeCalculator>['actions'];
