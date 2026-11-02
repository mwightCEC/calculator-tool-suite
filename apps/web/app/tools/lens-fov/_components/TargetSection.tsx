'use client';

import {
  DORI_LEVELS,
  MAX_CUSTOM_DENSITY,
  MAX_TARGET_DISTANCE,
  MIN_CUSTOM_DENSITY,
  SOLVE_FOR,
} from '@cctv/calc-core';
import { IconRuler2 } from '@tabler/icons-react';
import { SegmentedControl, Select } from '@mantine/core';
import { FieldRow } from '../../../../components/FieldRow/FieldRow';
import { SettingsPanel } from '../../../../components/SettingsPanel/SettingsPanel';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { UnitSelect } from '../../../../components/UnitSelect/UnitSelect';
import { parseOption } from '../../../../lib/camera-labels';
import {
  DENSITY_UNIT_LABELS,
  DENSITY_UNIT_OPTIONS,
  LENGTH_UNIT_OPTIONS,
  SOLVE_FOR_OPTIONS,
  TARGET_OPTIONS,
} from '../_lib/lens-fov-labels';
import {
  CUSTOM,
  targetDensity,
  type LensFovCalculatorState,
} from '../_state/lens-fov-calculator-state';
import type { LensFovCalculatorActions } from '../_state/use-lens-fov-calculator';
import classes from './LensFovCalculator.module.css';

interface TargetSectionProps {
  state: LensFovCalculatorState;
  actions: LensFovCalculatorActions;
}

/**
 * Panel below the camera fields: what to solve for, then the distance to the
 * target, or the DORI level or pixel density to reach.
 */
export function TargetSection({ state, actions }: TargetSectionProps) {
  const { lengthUnit, target } = state;

  return (
    <SettingsPanel
      icon={<IconRuler2 size={20} stroke={1.75} />}
      title="Distance and target"
      description="See the coverage at a distance, or the farthest distance that reaches a DORI level."
    >
      <SegmentedControl
        data={SOLVE_FOR_OPTIONS}
        value={state.solveFor}
        onChange={(value) => {
          const solveFor = parseOption(SOLVE_FOR, value);
          if (solveFor) {
            actions.setSolveFor(solveFor);
          }
        }}
        aria-label="Solve for"
      />

      <div className={classes.fields}>
        <div className={classes.fieldGrid}>
          {state.solveFor === 'coverage' ? (
            <FieldRow label="Distance to target" controlId="lens-distance">
              <UnitInput
                id="lens-distance"
                value={state.distance}
                onChange={actions.setDistance}
                min={0.1}
                max={MAX_TARGET_DISTANCE}
                decimals={1}
                unit={lengthUnit}
                unitControl={
                  <UnitSelect
                    value={lengthUnit}
                    onChange={actions.setLengthUnit}
                    options={LENGTH_UNIT_OPTIONS}
                    aria-label="Distance unit"
                  />
                }
              />
            </FieldRow>
          ) : (
            <>
              <FieldRow
                label="Target"
                help="IEC 62676-4:2014 DORI levels: the horizontal pixel density at the target for Detection (25 PPM), Observation (62.5), Recognition (125) and Identification (250). Choose Custom for any other density."
                controlId="lens-target"
              >
                <Select
                  id="lens-target"
                  data={TARGET_OPTIONS}
                  value={target.kind === 'custom' ? CUSTOM : target.level}
                  onChange={(value) => {
                    if (value === CUSTOM) {
                      actions.setCustomDensity(targetDensity(state));
                      return;
                    }
                    const level = parseOption(DORI_LEVELS, value);
                    if (level) {
                      actions.setDoriTarget(level);
                    }
                  }}
                  allowDeselect={false}
                  className={classes.select}
                />
              </FieldRow>

              <FieldRow
                label="Pixel density"
                help="Horizontal pixels per foot (PPF) or per metre (PPM) at the target. Typing a value makes the target Custom."
                controlId="lens-density"
              >
                <UnitInput
                  id="lens-density"
                  value={targetDensity(state)}
                  onChange={actions.setCustomDensity}
                  min={MIN_CUSTOM_DENSITY}
                  max={MAX_CUSTOM_DENSITY}
                  decimals={1}
                  unit={DENSITY_UNIT_LABELS[lengthUnit]}
                  unitControl={
                    <UnitSelect
                      value={lengthUnit}
                      onChange={actions.setLengthUnit}
                      options={DENSITY_UNIT_OPTIONS}
                      aria-label="Pixel density unit"
                    />
                  }
                />
              </FieldRow>
            </>
          )}
        </div>
      </div>
    </SettingsPanel>
  );
}
