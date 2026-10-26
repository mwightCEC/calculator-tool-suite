'use client';

import {
  MAX_POE_BUDGET_WATTS,
  MAX_POE_PORTS,
  MIN_POE_BUDGET_WATTS,
  POE_RESERVE_PERCENTS,
  PORT_STANDARDS,
  type PoeSwitch,
} from '@cctv/calc-core';
import { Paper, Select, Title } from '@mantine/core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { parseOption } from '../../../../lib/camera-labels';
import { PORT_STANDARD_SELECT_DATA, RESERVE_OPTIONS } from '../_lib/poe-labels';
import { WattsInput } from './WattsInput';
import classes from './PoeCalculator.module.css';

interface SwitchCardProps {
  powerSource: PoeSwitch;
  /** The reserve is an Advanced setting; Simple keeps 20%. */
  showReserve: boolean;
  onChange: (changes: Partial<PoeSwitch>) => void;
}

/** The PoE switch, or an NVR with built-in PoE ports, that powers the devices. */
export function SwitchCard({ powerSource, showReserve, onChange }: SwitchCardProps) {
  return (
    <Paper
      component="section"
      withBorder
      className={classes.card}
      aria-labelledby="poe-switch-title"
    >
      <Title order={2} id="poe-switch-title" className={classes.cardTitle}>
        Switch / NVR
      </Title>

      <FieldRow
        label="PoE budget"
        help="Total PoE power the switch or NVR can supply across all ports, from its datasheet. Often lower than the per-port maximum times the port count."
        controlId="poe-budget-watts"
      >
        <WattsInput
          id="poe-budget-watts"
          value={powerSource.budgetWatts}
          onChange={(budgetWatts) => onChange({ budgetWatts })}
          min={MIN_POE_BUDGET_WATTS}
          max={MAX_POE_BUDGET_WATTS}
          decimals={1}
        />
      </FieldRow>

      <FieldRow
        label="PoE ports"
        help="Number of ports that supply PoE. Uplink and non-PoE ports don't count."
        controlId="poe-ports"
      >
        <NumberStepper
          id="poe-ports"
          value={powerSource.ports}
          onChange={(ports) => onChange({ ports })}
          min={1}
          max={MAX_POE_PORTS}
          unitLabel="port"
        />
      </FieldRow>

      <FieldRow
        label="Port standard"
        help="The highest PoE standard the ports support, which sets the most power one port can deliver."
        controlId="poe-port-standard"
      >
        <Select
          id="poe-port-standard"
          data={PORT_STANDARD_SELECT_DATA}
          value={powerSource.portStandard}
          onChange={(value) => {
            const portStandard = parseOption(PORT_STANDARDS, value);
            if (portStandard) {
              onChange({ portStandard });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>

      {showReserve && (
        <FieldRow
          label="Budget reserve"
          help="Share of the budget kept free as headroom for start-up surges, heaters in cold weather and devices added later."
          controlId="poe-reserve"
        >
          <OptionButtons
            id="poe-reserve"
            value={String(powerSource.reservePercent)}
            onChange={(value) => {
              const reservePercent = parseOption(POE_RESERVE_PERCENTS, value);
              if (reservePercent !== undefined) {
                onChange({ reservePercent });
              }
            }}
            options={RESERVE_OPTIONS}
            aria-labelledby={fieldLabelId('poe-reserve')}
          />
        </FieldRow>
      )}
    </Paper>
  );
}
