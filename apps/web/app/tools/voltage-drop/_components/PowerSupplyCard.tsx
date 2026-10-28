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
import { Paper, Select, Title } from '@mantine/core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { parseOption } from '../../../../lib/camera-labels';
import {
  CUSTOM_SUPPLY,
  DROP_LIMIT_OPTIONS,
  RESERVE_OPTIONS,
  SUPPLY_KIND_OPTIONS,
  supplyOptions,
} from '../_lib/voltage-drop-labels';
import { SUPPLY_PRESETS, supplyPresetIndex } from '../_state/voltage-drop-calculator-state';
import { UnitInput } from './UnitInput';
import classes from './VoltageDropCalculator.module.css';

interface PowerSupplyCardProps {
  powerSupply: PowerSupply;
  dropLimitPercent: DropLimitPercent;
  /** Custom voltage, reserve and drop limit are Advanced settings. */
  advanced: boolean;
  onChange: (changes: Partial<PowerSupply>) => void;
  onDropLimitChange: (dropLimitPercent: DropLimitPercent) => void;
}

/** The power supply or transformer feeding the runs, and the drop allowed on each. */
export function PowerSupplyCard({
  powerSupply,
  dropLimitPercent,
  advanced,
  onChange,
  onDropLimitChange,
}: PowerSupplyCardProps) {
  const presetIndex = supplyPresetIndex(powerSupply);
  // Custom stays chosen while its voltage still matches a preset, e.g. just after picking it.
  const [customChosen, setCustomChosen] = useState(false);
  const showCustom = advanced && (customChosen || presetIndex === undefined);

  return (
    <Paper component="section" withBorder className={classes.card} aria-labelledby="supply-title">
      <Title order={2} id="supply-title" className={classes.cardTitle}>
        Power supply
      </Title>

      <FieldRow
        label="Supply"
        help="Output of the power supply or transformer. 24 V AC is treated like DC at its RMS voltage, using the wire's resistance only."
        controlId="supply-preset"
      >
        <Select
          id="supply-preset"
          data={supplyOptions(advanced)}
          value={showCustom ? CUSTOM_SUPPLY : String(presetIndex ?? 0)}
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

      {showCustom && (
        <>
          <FieldRow
            label="Output type"
            help="DC from a power supply, or AC from a transformer."
            controlId="supply-kind"
          >
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

      {advanced && (
        <>
          <FieldRow
            label="Supply reserve"
            help="Share of the rated current kept free as headroom for start-up surges, heaters in cold weather and devices added later."
            controlId="supply-reserve"
          >
            <OptionButtons
              id="supply-reserve"
              value={String(powerSupply.reservePercent)}
              onChange={(value) => {
                const reservePercent = parseOption(SUPPLY_RESERVE_PERCENTS, value);
                if (reservePercent !== undefined) {
                  onChange({ reservePercent });
                }
              }}
              options={RESERVE_OPTIONS}
              aria-labelledby={fieldLabelId('supply-reserve')}
            />
          </FieldRow>

          <FieldRow
            label="Drop limit"
            help="Largest voltage drop allowed on a run, as a share of the supply voltage. Check the device's input range: many 12 V DC cameras accept ±10%."
            controlId="drop-limit"
          >
            <OptionButtons
              id="drop-limit"
              value={String(dropLimitPercent)}
              onChange={(value) => {
                const limit = parseOption(DROP_LIMIT_PERCENTS, value);
                if (limit !== undefined) {
                  onDropLimitChange(limit);
                }
              }}
              options={DROP_LIMIT_OPTIONS}
              aria-labelledby={fieldLabelId('drop-limit')}
            />
          </FieldRow>
        </>
      )}
    </Paper>
  );
}
