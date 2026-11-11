'use client';

import {
  LOAD_INPUTS,
  MAX_CAMERAS_PER_GROUP,
  MAX_LOAD_AMPS,
  MAX_LOAD_WATTS,
  MAX_RUN_LENGTH,
  MIN_LOAD_AMPS,
  MIN_LOAD_WATTS,
  WIRE_GAUGES,
  type CableLengthUnit,
  type LoadInput,
  type VoltageDropGroupUsage,
  type WireSystem,
} from '@cctv/calc-core';
import { Select } from '@mantine/core';
import { FieldLayoutProvider, FieldRow } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { UNIT_SELECT_WIDTH, UnitSelect } from '../../../../components/UnitSelect/UnitSelect';
import { parseOption } from '../../../../lib/camera-labels';
import { describeRun } from '../_lib/group-summary';
import { describeRunLimits } from '../_lib/result-summary';
import {
  CABLE_LENGTH_UNIT_OPTIONS,
  gaugeSelectData,
  LOAD_INPUT_OPTIONS,
  WIRE_SYSTEM_OPTIONS,
} from '../_lib/voltage-drop-labels';
import type {
  VoltageDropGroupChanges,
  VoltageDropGroupState,
} from '../_state/voltage-drop-calculator-state';
import classes from './VoltageDropCalculator.module.css';

interface LoadFieldsProps {
  group: VoltageDropGroupState;
  usage: VoltageDropGroupUsage;
  wireSystem: WireSystem;
  cableLengthUnit: CableLengthUnit;
  onChange: (changes: VoltageDropGroupChanges) => void;
  onLoadInputChange: (input: LoadInput) => void;
  onWireSystemChange: (system: WireSystem) => void;
  onCableLengthUnitChange: (unit: CableLengthUnit) => void;
}

/**
 * A device group's fields in a grid with labels above: count, load per device and
 * wire size in one row (two or one on narrow cards), then run length with its drop,
 * the thinnest wire that passes and the longest run on the chosen wire.
 * Units sit inside their fields. Info icons only where they explain something.
 */
export function LoadFields({
  group,
  usage,
  wireSystem,
  cableLengthUnit,
  onChange,
  onLoadInputChange,
  onWireSystemChange,
  onCableLengthUnitChange,
}: LoadFieldsProps) {
  const id = group.id;
  const { load } = group;

  return (
    <FieldLayoutProvider value="stacked">
      <div className={classes.fields}>
        <div className={classes.fieldGrid} data-columns="4">
          <FieldRow label="Devices" controlId={`${id}-devices`}>
            <NumberStepper
              id={`${id}-devices`}
              value={group.deviceCount}
              onChange={(deviceCount) => onChange({ deviceCount })}
              min={1}
              max={MAX_CAMERAS_PER_GROUP}
            />
          </FieldRow>

          <FieldRow label="Load given as" controlId={`${id}-load-input`}>
            <Select
              id={`${id}-load-input`}
              data={LOAD_INPUT_OPTIONS}
              value={load.input}
              onChange={(value) => {
                const input = parseOption(LOAD_INPUTS, value);
                if (input) {
                  onLoadInputChange(input);
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>

          {load.input === 'amps' ? (
            <FieldRow label="Current draw" controlId={`${id}-amps`}>
              <UnitInput
                id={`${id}-amps`}
                value={load.amps}
                onChange={(amps) => onChange({ load: { input: 'amps', amps } })}
                min={MIN_LOAD_AMPS}
                max={MAX_LOAD_AMPS}
                decimals={2}
                unit="A"
              />
            </FieldRow>
          ) : (
            <FieldRow label="Max power draw" controlId={`${id}-watts`}>
              <UnitInput
                id={`${id}-watts`}
                value={load.watts}
                onChange={(watts) => onChange({ load: { input: 'watts', watts } })}
                min={MIN_LOAD_WATTS}
                max={MAX_LOAD_WATTS}
                decimals={2}
                unit="W"
              />
            </FieldRow>
          )}

          <FieldRow label="Wire size" controlId={`${id}-gauge`}>
            <Select
              id={`${id}-gauge`}
              data={gaugeSelectData(wireSystem)}
              value={group.gauge}
              onChange={(value) => {
                const gauge = parseOption(WIRE_GAUGES, value);
                if (gauge) {
                  onChange({ gauge });
                }
              }}
              allowDeselect={false}
              rightSection={
                <UnitSelect
                  value={wireSystem}
                  onChange={onWireSystemChange}
                  options={WIRE_SYSTEM_OPTIONS}
                  aria-label="Wire size system"
                />
              }
              rightSectionWidth={UNIT_SELECT_WIDTH}
              rightSectionPointerEvents="all"
              className={classes.select}
            />
          </FieldRow>

          <FieldRow
            label="Run length"
            className={classes.runLength}
            controlId={`${id}-length`}
            note={
              <>
                {describeRun(usage)}
                <br />
                {describeRunLimits(usage, group.gauge, cableLengthUnit)}
              </>
            }
          >
            <UnitInput
              id={`${id}-length`}
              value={group.cableLength}
              onChange={(cableLength) => onChange({ cableLength })}
              min={0.1}
              max={MAX_RUN_LENGTH}
              decimals={1}
              unit={cableLengthUnit}
              unitControl={
                <UnitSelect
                  value={cableLengthUnit}
                  onChange={onCableLengthUnitChange}
                  options={CABLE_LENGTH_UNIT_OPTIONS}
                  aria-label="Run length unit"
                />
              }
            />
          </FieldRow>
        </div>
      </div>
    </FieldLayoutProvider>
  );
}
