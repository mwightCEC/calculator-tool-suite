'use client';

import {
  CABLE_LENGTH_UNITS,
  MAX_CAMERAS_PER_GROUP,
  MAX_DEVICE_WATTS,
  MIN_DEVICE_WATTS,
  POE_CLASSES,
  type CableLengthUnit,
  type PoeGroupUsage,
  type PowerInput,
} from '@cctv/calc-core';
import { Group, SegmentedControl, Select } from '@mantine/core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { parseOption } from '../../../../lib/camera-labels';
import { describeAllocation } from '../_lib/group-summary';
import {
  CABLE_LENGTH_UNIT_OPTIONS,
  POE_CLASS_SELECT_DATA,
  POWER_INPUT_OPTIONS,
} from '../_lib/poe-labels';
import type { PoeGroupChanges, PoeGroupState } from '../_state/poe-calculator-state';
import { CableLengthInput } from './CableLengthInput';
import classes from './PoeCalculator.module.css';

const POWER_HELP =
  'By watts: the maximum power consumption from the datasheet, with IR and any heater on. By PoE class: the class the device reports, which the switch may reserve in full.';
const CABLE_HELP =
  'Longest cable run in this group. Longer runs lose more power in the cable. Left empty, 100 m (328 ft) is assumed, the most Ethernet allows. The unit applies to every group.';

interface DeviceFieldsProps {
  group: PoeGroupState;
  usage: PoeGroupUsage;
  cableLengthUnit: CableLengthUnit;
  /** Cable length is an Advanced setting; Simple assumes 100 m. */
  showCableLength: boolean;
  onChange: (changes: PoeGroupChanges) => void;
  onPowerInputChange: (input: PowerInput) => void;
  onCableLengthUnitChange: (unit: CableLengthUnit) => void;
}

/** A device group's fields: count, power per device and (Advanced) cable length. */
export function DeviceFields({
  group,
  usage,
  cableLengthUnit,
  showCableLength,
  onChange,
  onPowerInputChange,
  onCableLengthUnitChange,
}: DeviceFieldsProps) {
  const id = group.id;
  const { power } = group;

  return (
    <>
      <FieldRow
        label="Devices"
        help="Number of cameras or other PoE devices in this group. All devices in a group share the settings below."
        controlId={`${id}-devices`}
      >
        <NumberStepper
          id={`${id}-devices`}
          value={group.deviceCount}
          onChange={(deviceCount) => onChange({ deviceCount })}
          min={1}
          max={MAX_CAMERAS_PER_GROUP}
          unitLabel="device"
        />
      </FieldRow>

      <FieldRow label="Power given as" help={POWER_HELP} controlId={`${id}-power-input`}>
        <OptionButtons
          id={`${id}-power-input`}
          value={power.input}
          onChange={onPowerInputChange}
          options={POWER_INPUT_OPTIONS}
          aria-labelledby={fieldLabelId(`${id}-power-input`)}
        />
      </FieldRow>

      {power.input === 'class' ? (
        <FieldRow
          label="PoE class"
          help="The PoE class on the datasheet. The switch sets aside the class's full allocation for each device."
          controlId={`${id}-class`}
          note={describeAllocation(usage)}
        >
          <Select
            id={`${id}-class`}
            data={POE_CLASS_SELECT_DATA}
            value={String(power.poeClass)}
            onChange={(value) => {
              const poeClass = parseOption(POE_CLASSES, value);
              if (poeClass !== undefined) {
                onChange({ power: { input: 'class', poeClass } });
              }
            }}
            allowDeselect={false}
            className={classes.select}
          />
        </FieldRow>
      ) : (
        <FieldRow
          label="Max power draw"
          help="Maximum power consumption per device from the datasheet, with IR and any heater on."
          controlId={`${id}-watts`}
          note={describeAllocation(usage)}
        >
          <UnitInput
            id={`${id}-watts`}
            value={power.watts}
            onChange={(watts) => onChange({ power: { input: 'watts', watts } })}
            min={MIN_DEVICE_WATTS}
            max={MAX_DEVICE_WATTS}
            decimals={2}
            unit="W"
          />
        </FieldRow>
      )}

      {showCableLength && (
        <FieldRow label="Cable length" help={CABLE_HELP} controlId={`${id}-cable`}>
          <Group gap="xs" wrap="nowrap">
            <CableLengthInput
              id={`${id}-cable`}
              value={group.cableLength}
              unit={cableLengthUnit}
              onChange={(cableLength) => onChange({ cableLength })}
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
              aria-label="Cable length unit"
            />
          </Group>
        </FieldRow>
      )}
    </>
  );
}
