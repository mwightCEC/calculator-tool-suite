'use client';

import { useMemo, useReducer } from 'react';
import {
  calculateBandwidth,
  type BitrateSource,
  type NetworkLinks,
  type OverheadPercent,
  type RecordedStreams,
  type RemoteViewing,
} from '@cctv/calc-core';
import { notifyGroupRemoved } from '../../../../components/CameraGroupCard/notify-group-removed';
import {
  bandwidthCalculatorReducer,
  createInitialBandwidthCalculatorState,
  type BandwidthGroupChanges,
} from './bandwidth-calculator-state';

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

  const removeGroup = (id: string) => {
    const index = state.cameraGroups.findIndex((group) => group.id === id);
    const group = state.cameraGroups[index];
    if (!group || state.cameraGroups.length <= 1) {
      return;
    }
    dispatch({ type: 'remove-group', id });
    notifyGroupRemoved(group, () => dispatch({ type: 'restore-group', group, index }));
  };

  const actions = {
    updateGroup: (id: string, changes: BandwidthGroupChanges) =>
      dispatch({ type: 'update-group', id, changes }),
    setBitrateSource: (id: string, source: BitrateSource) =>
      dispatch({ type: 'set-bitrate-source', id, source }),
    addGroup: () => dispatch({ type: 'add-group' }),
    duplicateGroup: (id: string) => dispatch({ type: 'duplicate-group', id }),
    removeGroup,
    setRecordedStreams: (recordedStreams: RecordedStreams) =>
      dispatch({ type: 'set-recorded-streams', recordedStreams }),
    updateRemoteViewing: (changes: Partial<RemoteViewing>) =>
      dispatch({ type: 'update-remote-viewing', changes }),
    updateNetwork: (changes: Partial<NetworkLinks>) =>
      dispatch({ type: 'update-network', changes }),
    setOverhead: (overheadPercent: OverheadPercent) =>
      dispatch({ type: 'set-overhead', overheadPercent }),
  };

  return { state, result, actions };
}

export type BandwidthCalculatorActions = ReturnType<typeof useBandwidthCalculator>['actions'];
