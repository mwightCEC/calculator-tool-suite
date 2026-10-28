'use client';

import { useCallback, useMemo, useReducer } from 'react';
import {
  calculateVoltageDrop,
  type CableLengthUnit,
  type DropLimitPercent,
  type LoadInput,
  type PowerSupply,
  type WireSystem,
} from '@cctv/calc-core';
import {
  notifyGroupRemoved,
  notifyGroupsCleared,
  notifySwitchedToSimple,
} from '../../../../components/CameraGroupCard/undo-notifications';
import type { InputMode } from '../../../../lib/input-mode';
import { useUrlStateSync } from '../../../../lib/share/use-url-state-sync';
import { encodeState, voltageDropShareCodec } from './share-link';
import {
  createInitialVoltageDropCalculatorState,
  describeSwitchToSimple,
  hasCustomGroups as groupsAreCustom,
  voltageDropCalculatorReducer,
  type VoltageDropCalculatorState,
  type VoltageDropGroupChanges,
} from './voltage-drop-calculator-state';

/** The default calculation keeps a clean URL with no share parameters. */
const DEFAULT_STATE_ENCODED = encodeState(createInitialVoltageDropCalculatorState());
/** Where this calculator's last state is kept in the browser. */
const SAVED_STATE_KEY = 'cctv-tool-suite:voltage-drop-calculator';

/**
 * Voltage drop calculator state, live results and actions.
 * Results are recalculated synchronously whenever any input changes.
 */
export function useVoltageDropCalculator() {
  const [state, dispatch] = useReducer(
    voltageDropCalculatorReducer,
    undefined,
    createInitialVoltageDropCalculatorState
  );
  const result = useMemo(() => calculateVoltageDrop(state), [state]);

  const loadState = useCallback(
    (restored: VoltageDropCalculatorState) => dispatch({ type: 'load-state', state: restored }),
    []
  );
  useUrlStateSync(state, loadState, voltageDropShareCodec, DEFAULT_STATE_ENCODED, SAVED_STATE_KEY);

  const removeGroup = (id: string) => {
    const index = state.deviceGroups.findIndex((group) => group.id === id);
    const group = state.deviceGroups[index];
    if (!group || state.deviceGroups.length <= 1) {
      return;
    }
    dispatch({ type: 'remove-group', id });
    notifyGroupRemoved(group, () => dispatch({ type: 'restore-group', group, index }));
  };

  const hasCustomGroups = groupsAreCustom(state);

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
    updateGroup: (id: string, changes: VoltageDropGroupChanges) =>
      dispatch({ type: 'update-group', id, changes }),
    setLoadInput: (id: string, input: LoadInput) => dispatch({ type: 'set-load-input', id, input }),
    addGroup: () => dispatch({ type: 'add-group' }),
    duplicateGroup: (id: string) => dispatch({ type: 'duplicate-group', id }),
    removeGroup,
    clearGroups,
    updateSupply: (changes: Partial<PowerSupply>) => dispatch({ type: 'update-supply', changes }),
    setDropLimit: (dropLimitPercent: DropLimitPercent) =>
      dispatch({ type: 'set-drop-limit', dropLimitPercent }),
    setWireSystem: (wireSystem: WireSystem) => dispatch({ type: 'set-wire-system', wireSystem }),
    setCableLengthUnit: (unit: CableLengthUnit) =>
      dispatch({ type: 'set-cable-length-unit', unit }),
  };

  return { state, result, hasCustomGroups, actions };
}

export type VoltageDropCalculatorActions = ReturnType<typeof useVoltageDropCalculator>['actions'];
