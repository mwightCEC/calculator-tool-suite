'use client';

import { useState } from 'react';
import {
  DROP_LIMIT_PERCENTS,
  MAX_SUPPLY_AMPS,
  MAX_SUPPLY_VOLTS,
  MIN_SUPPLY_VOLTS,
  SUPPLY_RESERVE_PERCENTS,
  type DropLimitPercent,
  type PowerSupply,
} from '@cctv/calc-core';
import { IconBolt } from '@tabler/icons-react';
import { Select } from '@mantine/core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { SettingsPanel } from '../../../../components/SettingsPanel/SettingsPanel';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { parseOption } from '../../../../lib/camera-labels';
import {
  CUSTOM_SUPPLY,
  DROP_LIMIT_OPTIONS,
  RESERVE_OPTIONS,
  SUPPLY_KIND_OPTIONS,
  SUPPLY_OPTIONS,
} from '../_lib/voltage-drop-labels';
import { SUPPLY_PRESETS, supplyPresetIndex } from '../_state/voltage-drop-calculator-state';
import classes from './VoltageDropCalculator.module.css';

interface SupplySectionProps {
  powerSupply: PowerSupply;
  dropLimitPercent: DropLimitPercent;
  onChange: (changes: Partial<PowerSupply>) => void;
  onDropLimitChange: (dropLimitPercent: DropLimitPercent) => void;
}

/**
 * Panel below the device groups for the power supply or transformer feeding the runs,
 * and the drop allowed on each. Always shown: the checks need every field.
 */
export function SupplySection({
  powerSupply,
  dropLimitPercent,
  onChange,
  onDropLimitChange,
}: SupplySectionProps) {
  const presetIndex = supplyPresetIndex(powerSupply);
  // Custom stays chosen while its voltage still matches a preset, e.g. just after picking it.
  const [customChosen, setCustomChosen] = useState(false);
  const showCustom = customChosen || presetIndex === undefined;

  return (
    <SettingsPanel
      icon={<IconBolt size={20} stroke={1.75} />}
      title="Power supply"
      description="Enter the power supply or transformer that feeds these runs, and the drop each run may have."
    >
      <div className={classes.fields}>
        <div className={classes.fieldGrid}>
          <FieldRow
            label="Supply"
            help="Output of the power supply or transformer. 24 V AC is treated like DC at its RMS voltage, using the wire's resistance only."
            controlId="supply-preset"
          >
            <Select
              id="supply-preset"
              data={SUPPLY_OPTIONS}
              value={showCustom ? CUSTOM_SUPPLY : String(presetIndex)}
              onChange={(value) => {
                if (value === CUSTOM_SUPPLY) {
                  setCustomChosen(true);
                  return;
                }
                const preset = SUPPLY_PRESETS[Number(value)];
                if (preset) {
                  setCustomChosen(false);
                  onChange(preset);
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>

          <FieldRow
            label="Rated current"
            help="Most current the supply can deliver across all outputs, from its label or datasheet. For an AC transformer rated in VA, divide by the voltage: 100 VA at 24 V is about 4.2 A."
            controlId="supply-amps"
          >
            <UnitInput
              id="supply-amps"
              value={powerSupply.ratedAmps}
              onChange={(ratedAmps) => onChange({ ratedAmps })}
              min={0.01}
              max={MAX_SUPPLY_AMPS}
              decimals={2}
              unit="A"
            />
          </FieldRow>

          {showCustom && (
            <>
              <FieldRow label="Output type" controlId="supply-kind">
                <OptionButtons
                  id="supply-kind"
                  value={powerSupply.kind}
                  onChange={(kind) => onChange({ kind })}
                  options={SUPPLY_KIND_OPTIONS}
                  aria-labelledby={fieldLabelId('supply-kind')}
                />
              </FieldRow>

              <FieldRow
                label="Output voltage"
                help="The supply's output with its adjustment set, e.g. 13.8 V. For AC, the RMS voltage."
                controlId="supply-volts"
              >
                <UnitInput
                  id="supply-volts"
                  value={powerSupply.volts}
                  onChange={(volts) => onChange({ volts })}
                  min={MIN_SUPPLY_VOLTS}
                  max={MAX_SUPPLY_VOLTS}
                  decimals={1}
                  unit="V"
                />
              </FieldRow>
            </>
          )}

          <FieldRow
            label="Supply reserve"
            help="Share of the rated current kept free as headroom for start-up surges, heaters in cold weather and devices added later."
            controlId="supply-reserve"
          >
            <Select
              id="supply-reserve"
              data={RESERVE_OPTIONS}
              value={String(powerSupply.reservePercent)}
              onChange={(value) => {
                const reservePercent = parseOption(SUPPLY_RESERVE_PERCENTS, value);
                if (reservePercent !== undefined) {
                  onChange({ reservePercent });
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>

          <FieldRow
            label="Drop limit"
            help="Largest voltage drop allowed on a run, as a share of the supply voltage. Check the device's input range: many 12 V DC cameras accept ±10%."
            controlId="drop-limit"
          >
            <Select
              id="drop-limit"
              data={DROP_LIMIT_OPTIONS}
              value={String(dropLimitPercent)}
              onChange={(value) => {
                const limit = parseOption(DROP_LIMIT_PERCENTS, value);
                if (limit !== undefined) {
                  onDropLimitChange(limit);
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>
        </div>
      </div>
    </SettingsPanel>
  );
}
