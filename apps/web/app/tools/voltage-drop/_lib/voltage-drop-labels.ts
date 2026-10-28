import {
  CABLE_LENGTH_UNITS,
  DROP_LIMIT_PERCENTS,
  LOAD_INPUTS,
  SUPPLY_KINDS,
  SUPPLY_RESERVE_PERCENTS,
  WIRE_GAUGE_SPECS,
  WIRE_SYSTEMS,
  type CableLengthUnit,
  type LoadInput,
  type PowerSupply,
  type SupplyKind,
  type WireGauge,
  type WireSystem,
} from '@cctv/calc-core';
import { toOptions } from '../../../../lib/camera-labels';
import { formatNumber } from '../../../../lib/format';
import { SUPPLY_PRESETS } from '../_state/voltage-drop-calculator-state';

// Display labels for voltage drop options.

export const SUPPLY_KIND_LABELS: Record<SupplyKind, string> = {
  dc: 'DC',
  ac: 'AC',
};

export const LOAD_INPUT_LABELS: Record<LoadInput, string> = {
  amps: 'By amps',
  watts: 'By watts',
};

export const WIRE_SYSTEM_LABELS: Record<WireSystem, string> = {
  awg: 'AWG',
  mm2: 'mm²',
};

export const CABLE_LENGTH_UNIT_LABELS: Record<CableLengthUnit, string> = {
  ft: 'ft',
  m: 'm',
};

/** "12 V DC" */
export function describeSupply(supply: Pick<PowerSupply, 'kind' | 'volts'>): string {
  return `${formatNumber(supply.volts, 1)} V ${SUPPLY_KIND_LABELS[supply.kind]}`;
}

/** "18 AWG" or "1.5 mm²" */
export function describeGauge(gauge: WireGauge): string {
  const [system, size] = gauge.split('-') as [WireSystem, string];
  return system === 'awg' ? `${size} AWG` : `${size} mm²`;
}

/** Value of the supply choice that sets any other voltage (Advanced only). */
export const CUSTOM_SUPPLY = 'custom';

/** Supply choices: each preset by index, then Custom when Advanced. */
export function supplyOptions(withCustom: boolean) {
  const presets = SUPPLY_PRESETS.map((preset, index) => ({
    value: String(index),
    label: describeSupply(preset),
  }));
  return withCustom ? [...presets, { value: CUSTOM_SUPPLY, label: 'Custom' }] : presets;
}

export const SUPPLY_KIND_OPTIONS = toOptions(SUPPLY_KINDS, SUPPLY_KIND_LABELS);
export const LOAD_INPUT_OPTIONS = toOptions(LOAD_INPUTS, LOAD_INPUT_LABELS);
export const WIRE_SYSTEM_OPTIONS = toOptions(WIRE_SYSTEMS, WIRE_SYSTEM_LABELS);
export const CABLE_LENGTH_UNIT_OPTIONS = toOptions(CABLE_LENGTH_UNITS, CABLE_LENGTH_UNIT_LABELS);

/** Wire sizes in one system, thinnest first, for a Select. */
export function gaugeSelectData(system: WireSystem) {
  return WIRE_GAUGE_SPECS.filter((spec) => spec.system === system).map((spec) => ({
    value: spec.gauge,
    label: describeGauge(spec.gauge),
  }));
}

export const RESERVE_OPTIONS = SUPPLY_RESERVE_PERCENTS.map((percent) => ({
  value: String(percent),
  label: `${percent}%`,
}));

export const DROP_LIMIT_OPTIONS = DROP_LIMIT_PERCENTS.map((percent) => ({
  value: String(percent),
  label: `${percent}%`,
}));
