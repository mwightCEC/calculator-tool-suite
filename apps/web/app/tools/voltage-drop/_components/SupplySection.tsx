'use client';

import { useState } from 'react';
import {
  DROP_LIMIT_PERCENTS,
  MAX_SUPPLY_AMPS,
  MAX_SUPPLY_VOLTS,
  MIN_SUPPLY_VOLTS,
  SUPPLY_KINDS,
  SUPPLY_RESERVE_PERCENTS,
  type DropLimitPercent,
  type PowerSupply,
} from '@cctv/calc-core';
import { IconBolt } from '@tabler/icons-react';
import { Paper, Select } from '@mantine/core';
import { FieldRow } from '../../../../components/FieldRow/FieldRow';
import { SettingsPanel } from '../../../../components/SettingsPanel/SettingsPanel';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { NOTE_BELOW_FIELD } from '../../../../hooks/use-number-draft';
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
 * The Power supply card above Device configuration: the supply or transformer feeding the
 * runs, and the drop allowed on each. Always open: the checks need every field.
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
    <Paper withBorder radius="lg" p="sm">
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
                description={
                  powerSupply.kind === 'ac'
                    ? "An approximation: AC is treated like DC at its RMS voltage, using the wire's resistance only."
                    : undefined
                }
                inputWrapperOrder={NOTE_BELOW_FIELD}
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

            {showCustom && (
              <>
                <FieldRow label="Output type" controlId="supply-kind">
                  <Select
                    id="supply-kind"
                    data={SUPPLY_KIND_OPTIONS}
                    value={powerSupply.kind}
                    onChange={(value) => {
                      const kind = parseOption(SUPPLY_KINDS, value);
                      if (kind) {
                        onChange({ kind });
                      }
                    }}
                    allowDeselect={false}
                    className={classes.select}
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

            {powerSupply.kind === 'ac' ? (
              <FieldRow
                label="Rated power"
                help="Most power the transformer can deliver across all outputs, in VA from its label or datasheet. The current it allows is VA ÷ voltage: 100 VA at 24 V is about 4.2 A."
                controlId="supply-va"
              >
                <UnitInput
                  id="supply-va"
                  value={Math.round(powerSupply.ratedAmps * powerSupply.volts * 10) / 10}
                  onChange={(voltAmps) => onChange({ ratedAmps: voltAmps / powerSupply.volts })}
                  min={1}
                  max={Math.floor(MAX_SUPPLY_AMPS * powerSupply.volts)}
                  decimals={1}
                  unit="VA"
                />
              </FieldRow>
            ) : (
              <FieldRow
                label="Rated current"
                help="Most current the supply can deliver across all outputs, from its label or datasheet."
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
            )}

            <FieldRow
              label="Supply reserve"
              help="Share of the supply's rating kept free as headroom for start-up surges, heaters in cold weather and devices added later."
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
          </div>
        </div>
      </SettingsPanel>
    </Paper>
  );
}
