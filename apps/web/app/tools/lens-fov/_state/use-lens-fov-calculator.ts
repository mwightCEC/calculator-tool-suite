'use client';

import { useCallback, useMemo, useReducer } from 'react';
import {
  calculateLensFov,
  type CableLengthUnit,
  type Resolution,
  type SensorFormat,
  type SolveFor,
} from '@cctv/calc-core';
import { savedStateKey } from '../../../../lib/share/clear-all-calculators';
import { useUrlStateSync } from '../../../../lib/share/use-url-state-sync';
import {
  createInitialLensFovCalculatorState,
  CUSTOM,
  lensFovCalculatorReducer,
  type LensFovCalculatorState,
} from './lens-fov-calculator-state';
import { lensFovShareCodec } from './share-link';

/** The default inputs: Start over and Clear all calculators return here, with a clean URL. */
const DEFAULT_STATE = createInitialLensFovCalculatorState();
/** Where this calculator's last state is kept in the browser. */
const SAVED_STATE_KEY = savedStateKey('lens-fov');

/**
 * Lens / FOV calculator state, live results and actions.
 * Results are recalculated synchronously whenever any input changes.
 */
export function useLensFovCalculator() {
  const [state, dispatch] = useReducer(
    lensFovCalculatorReducer,
    undefined,
    createInitialLensFovCalculatorState
  );
  const result = useMemo(() => calculateLensFov(state), [state]);

  const loadState = useCallback(
    (restored: LensFovCalculatorState) => dispatch({ type: 'load-state', state: restored }),
    []
  );
  const session = useUrlStateSync(
    state,
    loadState,
    lensFovShareCodec,
    DEFAULT_STATE,
    SAVED_STATE_KEY
  );

  const actions = {
    setResolution: (resolution: Resolution | typeof CUSTOM) =>
      dispatch({ type: 'set-resolution', resolution }),
    setCustomResolution: (changes: Partial<{ width: number; height: number }>) =>
      dispatch({ type: 'set-custom-resolution', changes }),
    setSensor: (sensor: SensorFormat | typeof CUSTOM) => dispatch({ type: 'set-sensor', sensor }),
    setCustomSensor: (changes: Partial<{ widthMm: number; heightMm: number }>) =>
      dispatch({ type: 'set-custom-sensor', changes }),
    setFocalLength: (focalLengthMm: number) =>
      dispatch({ type: 'set-focal-length', focalLengthMm }),
    setSolveFor: (solveFor: SolveFor) => dispatch({ type: 'set-solve-for', solveFor }),
    setDistance: (distance: number) => dispatch({ type: 'set-distance', distance }),
    setCustomDensity: (density: number) => dispatch({ type: 'set-custom-density', density }),
    setLengthUnit: (unit: CableLengthUnit) => dispatch({ type: 'set-length-unit', unit }),
  };

  return { state, result, actions, session };
}

export type LensFovCalculatorActions = ReturnType<typeof useLensFovCalculator>['actions'];
