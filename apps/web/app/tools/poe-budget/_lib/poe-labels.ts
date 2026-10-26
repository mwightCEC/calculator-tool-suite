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

export const POWER_INPUT_LABELS: Record<PowerInput, string> = {
  watts: 'By watts',
  class: 'By PoE class',
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

/** "Class 3 (up to 12.95 W)", by device power, which is what datasheets list. */
export const POE_CLASS_SELECT_DATA = POE_CLASS_SPECS.map((spec) => ({
  value: String(spec.poeClass),
  label: `Class ${spec.poeClass} (up to ${formatNumber(spec.deviceWatts, 2)} W)`,
}));
