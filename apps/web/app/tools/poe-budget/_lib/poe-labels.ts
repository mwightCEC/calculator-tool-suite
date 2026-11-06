import {
  CABLE_LENGTH_UNITS,
  POE_CLASS_SPECS,
  POE_RESERVE_PERCENTS,
  PORT_STANDARDS,
  POWER_INPUTS,
  type CableLengthUnit,
  type PortStandard,
  type PowerInput,
} from '@cctv/calc-core';
import { toOptions } from '../../../../lib/camera-labels';
import { formatNumber } from '../../../../lib/format';

// Display labels for PoE budget options.

export const PORT_STANDARD_LABELS: Record<PortStandard, string> = {
  af: 'PoE (802.3af, 15.4 W)',
  at: 'PoE+ (802.3at, 30 W)',
  'bt-type3': 'PoE++ Type 3 (802.3bt, 60 W)',
  'bt-type4': 'PoE++ Type 4 (802.3bt, 90 W)',
};

/** Short names for sentences: "more than PoE+ ports supply". */
export const PORT_STANDARD_SHORT_LABELS: Record<PortStandard, string> = {
  af: 'PoE',
  at: 'PoE+',
  'bt-type3': 'PoE++ Type 3',
  'bt-type4': 'PoE++ Type 4',
};

export const POWER_INPUT_LABELS: Record<PowerInput, string> = {
  watts: 'Watts',
  class: 'PoE class',
};

export const CABLE_LENGTH_UNIT_LABELS: Record<CableLengthUnit, string> = {
  ft: 'ft',
  m: 'm',
};

export const PORT_STANDARD_SELECT_DATA = toOptions(PORT_STANDARDS, PORT_STANDARD_LABELS);
/** Watts first: most datasheets give a maximum draw rather than a class. */
export const POWER_INPUT_OPTIONS = toOptions([...POWER_INPUTS].reverse(), POWER_INPUT_LABELS);
export const CABLE_LENGTH_UNIT_OPTIONS = toOptions(CABLE_LENGTH_UNITS, CABLE_LENGTH_UNIT_LABELS);

export const RESERVE_OPTIONS = POE_RESERVE_PERCENTS.map((percent) => ({
  value: String(percent),
  label: `${percent}%`,
}));

/** "Class 3 · 15.4 W": the class and the switch-side power the budget takes for it. */
export const POE_CLASS_SELECT_DATA = POE_CLASS_SPECS.map((spec) => ({
  value: String(spec.poeClass),
  label: `Class ${spec.poeClass} · ${formatNumber(spec.switchWatts, 1)} W`,
}));

/** "device max 12.95 W" by class value, shown beside each option in the dropdown. */
export const POE_CLASS_DEVICE_NOTES: Record<string, string> = Object.fromEntries(
  POE_CLASS_SPECS.map((spec) => [
    String(spec.poeClass),
    `device max ${formatNumber(spec.deviceWatts, 2)} W`,
  ])
);
