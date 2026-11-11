'use client';

import {
  MAX_CAMERAS_PER_GROUP,
  MAX_DEVICE_WATTS,
  MIN_DEVICE_WATTS,
  POE_CLASSES,
  POWER_INPUTS,
  type CableLengthUnit,
  type PoeGroupUsage,
  type PowerInput,
} from '@cctv/calc-core';
import { Group, Select, Text } from '@mantine/core';
import { FieldLayoutProvider, FieldRow } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { UnitSelect } from '../../../../components/UnitSelect/UnitSelect';
import { parseOption } from '../../../../lib/camera-labels';
import { describeAllocation } from '../_lib/group-summary';
import {
  CABLE_LENGTH_UNIT_OPTIONS,
  POE_CLASS_DEVICE_NOTES,
  POE_CLASS_SELECT_DATA,
  POWER_INPUT_OPTIONS,
} from '../_lib/poe-labels';
import type { PoeGroupChanges, PoeGroupState } from '../_state/poe-calculator-state';
import { CableLengthInput } from './CableLengthInput';
import classes from './PoeCalculator.module.css';

interface DeviceFieldsProps {
  group: PoeGroupState;
  usage: PoeGroupUsage;
  cableLengthUnit: CableLengthUnit;
  onChange: (changes: PoeGroupChanges) => void;
  onPowerInputChange: (input: PowerInput) => void;
  onCableLengthUnitChange: (unit: CableLengthUnit) => void;
}

/**
 * A device group's fields in one row with labels above (two or one on narrow cards):
 * count, power per device and cable length, then what each device takes from the
 * budget. Info icons only where they explain something.
 */
export function DeviceFields({
  group,
  usage,
  cableLengthUnit,
  onChange,
  onPowerInputChange,
  onCableLengthUnitChange,
}: DeviceFieldsProps) {
  const id = group.id;
  const { power } = group;

  return (
    <FieldLayoutProvider value="stacked">
      <div className={classes.deviceFields}>
        <div className={classes.deviceGrid} data-columns="4">
          <FieldRow label="Devices" controlId={`${id}-devices`}>
            <NumberStepper
              id={`${id}-devices`}
              value={group.deviceCount}
              onChange={(deviceCount) => onChange({ deviceCount })}
              min={1}
              max={MAX_CAMERAS_PER_GROUP}
            />
          </FieldRow>

          <FieldRow label="Power given as" controlId={`${id}-power-input`}>
            <Select
              id={`${id}-power-input`}
              data={POWER_INPUT_OPTIONS}
              value={power.input}
              onChange={(value) => {
                const input = parseOption(POWER_INPUTS, value);
                if (input) {
                  onPowerInputChange(input);
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>

          {power.input === 'class' ? (
            <FieldRow label="PoE class" controlId={`${id}-class`}>
              <Select
                id={`${id}-class`}
                data={POE_CLASS_SELECT_DATA}
                renderOption={({ option }) => (
                  <Group justify="space-between" gap="md" wrap="nowrap" className={classes.option}>
                    <span>{option.label} at switch</span>
                    <Text size="xs" className={classes.groupNote}>
                      {POE_CLASS_DEVICE_NOTES[option.value]}
                    </Text>
                  </Group>
                )}
                comboboxProps={{ width: 'max-content', position: 'bottom-start' }}
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
            <FieldRow label="Max power draw" controlId={`${id}-watts`}>
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

          <FieldRow label="Cable length" controlId={`${id}-cable`}>
            <CableLengthInput
              id={`${id}-cable`}
              value={group.cableLength}
              unit={cableLengthUnit}
              onChange={(cableLength) => onChange({ cableLength })}
              unitControl={
                <UnitSelect
                  value={cableLengthUnit}
                  onChange={onCableLengthUnitChange}
                  options={CABLE_LENGTH_UNIT_OPTIONS}
                  aria-label="Cable length unit"
                />
              }
            />
          </FieldRow>
        </div>
        <Text size="xs" className={classes.groupNote}>
          {describeAllocation(usage)}
        </Text>
      </div>
    </FieldLayoutProvider>
  );
}
