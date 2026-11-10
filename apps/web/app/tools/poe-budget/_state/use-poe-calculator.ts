'use client';

import { useCallback, useMemo, useReducer } from 'react';
import {
  calculatePoe,
  type CableLengthUnit,
  type PoeSwitch,
  type PowerInput,
} from '@cctv/calc-core';
import {
  notifyGroupRemoved,
  notifyGroupsCleared,
} from '../../../../components/CameraGroupCard/undo-notifications';
import { savedStateKey } from '../../../../lib/share/clear-all-calculators';
import { useUrlStateSync } from '../../../../lib/share/use-url-state-sync';
import {
  createInitialPoeCalculatorState,
  poeCalculatorReducer,
  type PoeCalculatorState,
  type PoeGroupChanges,
} from './poe-calculator-state';
import { encodeState, poeShareCodec } from './share-link';

/** The default inputs: Start over and Clear all calculators return here, with a clean URL. */
const DEFAULT_STATE = createInitialPoeCalculatorState();
/** Where this calculator's last state is kept in the browser. */
const SAVED_STATE_KEY = savedStateKey('poe-budget');
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

  const loadState = useCallback(
    (restored: PoeCalculatorState) => dispatch({ type: 'load-state', state: restored }),
    []
  );
  const session = useUrlStateSync(state, loadState, poeShareCodec, DEFAULT_STATE, SAVED_STATE_KEY);

  const removeGroup = (id: string) => {
    const index = state.deviceGroups.findIndex((group) => group.id === id);
    const group = state.deviceGroups[index];
    if (!group || state.deviceGroups.length <= 1) {
      return;
    }
    dispatch({ type: 'remove-group', id });
    notifyGroupRemoved(group, () => dispatch({ type: 'restore-group', group, index }));
  };

  // Compared through the share encoding, which covers every group field that matters.
  const hasCustomGroups =
    encodeState(state) !== encodeState({ ...state, deviceGroups: DEFAULT_GROUPS });

  const clearGroups = () => {
    if (!hasCustomGroups) {
      return;
    }
    const previous = state.deviceGroups;
    dispatch({ type: 'clear-groups' });
    notifyGroupsCleared('device', () => dispatch({ type: 'restore-groups', groups: previous }));
  };

  const actions = {
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

  return { state, result, hasCustomGroups, actions, session };
}

export type PoeCalculatorActions = ReturnType<typeof usePoeCalculator>['actions'];
