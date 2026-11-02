'use client';

import { useMemo, useReducer } from 'react';
import {
  calculateLensFov,
  type CableLengthUnit,
  type DoriLevel,
  type Resolution,
  type SensorFormat,
  type SolveFor,
} from '@cctv/calc-core';
import {
  createInitialLensFovCalculatorState,
  CUSTOM,
  lensFovCalculatorReducer,
} from './lens-fov-calculator-state';

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
    setDoriTarget: (level: DoriLevel) => dispatch({ type: 'set-dori-target', level }),
    setCustomDensity: (density: number) => dispatch({ type: 'set-custom-density', density }),
    setLengthUnit: (unit: CableLengthUnit) => dispatch({ type: 'set-length-unit', unit }),
  };

  return { state, result, actions };
}

export type LensFovCalculatorActions = ReturnType<typeof useLensFovCalculator>['actions'];
