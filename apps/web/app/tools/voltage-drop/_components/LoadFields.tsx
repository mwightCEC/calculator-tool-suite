'use client';

import {
  CABLE_LENGTH_UNITS,
  MAX_CAMERAS_PER_GROUP,
  MAX_LOAD_AMPS,
  MAX_LOAD_WATTS,
  MAX_RUN_LENGTH,
  MIN_LOAD_AMPS,
  MIN_LOAD_WATTS,
  WIRE_GAUGES,
  WIRE_SYSTEMS,
  type CableLengthUnit,
  type LoadInput,
  type VoltageDropGroupUsage,
  type WireSystem,
} from '@cctv/calc-core';
import { Group, SegmentedControl, Select } from '@mantine/core';
import {
  FieldLayoutProvider,
  FieldRow,
  fieldLabelId,
} from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { parseOption } from '../../../../lib/camera-labels';
import { describeRun } from '../_lib/group-summary';
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

const LOAD_HELP =
  'By amps: the current on the datasheet. By watts: the maximum power, with IR and any heater on; the current then rises as the voltage at the device falls.';
const GAUGE_HELP =
  'Conductor size of the power pair, in copper. Thicker wire (a lower AWG number) drops less voltage. The system applies to every group.';
const LENGTH_HELP =
  'Longest run in this group, from the supply to the device. The drop counts both conductors, out and back. The unit applies to every group.';

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
 * A device group's fields in a grid with labels above: count, load per device,
 * wire size and run length. Info icons only where they explain something.
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
        <div className={classes.fieldGrid}>
          <FieldRow label="Devices" controlId={`${id}-devices`}>
            <NumberStepper
              id={`${id}-devices`}
              value={group.deviceCount}
              onChange={(deviceCount) => onChange({ deviceCount })}
              min={1}
              max={MAX_CAMERAS_PER_GROUP}
              unitLabel="device"
            />
          </FieldRow>

          <FieldRow label="Load given as" help={LOAD_HELP} controlId={`${id}-load-input`}>
            <OptionButtons
              id={`${id}-load-input`}
              value={load.input}
              onChange={onLoadInputChange}
              options={LOAD_INPUT_OPTIONS}
              aria-labelledby={fieldLabelId(`${id}-load-input`)}
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

          <FieldRow label="Wire size" help={GAUGE_HELP} controlId={`${id}-gauge`}>
            <Group gap="xs" wrap="nowrap">
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
                className={classes.gaugeSelect}
              />
              <SegmentedControl
                size="xs"
                color="brand"
                value={wireSystem}
                onChange={(value) => {
                  const system = parseOption(WIRE_SYSTEMS, value);
                  if (system) {
                    onWireSystemChange(system);
                  }
                }}
                data={WIRE_SYSTEM_OPTIONS}
                aria-label="Wire size system"
              />
            </Group>
          </FieldRow>

          <FieldRow
            label="Run length"
            help={LENGTH_HELP}
            controlId={`${id}-length`}
            note={describeRun(usage)}
          >
            <Group gap="xs" wrap="nowrap">
              <UnitInput
                id={`${id}-length`}
                value={group.cableLength}
                onChange={(cableLength) => onChange({ cableLength })}
                min={0.1}
                max={MAX_RUN_LENGTH}
                decimals={1}
                unit={cableLengthUnit}
              />
              <SegmentedControl
                size="xs"
                color="brand"
                value={cableLengthUnit}
                onChange={(value) => {
                  const unit = parseOption(CABLE_LENGTH_UNITS, value);
                  if (unit) {
                    onCableLengthUnitChange(unit);
                  }
                }}
                data={CABLE_LENGTH_UNIT_OPTIONS}
                aria-label="Run length unit"
              />
            </Group>
          </FieldRow>
        </div>
      </div>
    </FieldLayoutProvider>
  );
}
