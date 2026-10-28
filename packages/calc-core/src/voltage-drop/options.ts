// Allowed values for voltage drop calculator inputs. Display labels live in the UI.

/** The supply's output: DC, or AC (treated as purely resistive, RMS volts). */
export const SUPPLY_KINDS = ['dc', 'ac'] as const;
export type SupplyKind = (typeof SUPPLY_KINDS)[number];

/** How wire sizes are listed: American Wire Gauge or metric cross-section. */
export const WIRE_SYSTEMS = ['awg', 'mm2'] as const;
export type WireSystem = (typeof WIRE_SYSTEMS)[number];

/** Copper conductor sizes, thinnest first within each system; areas in wire-gauges.ts. */
export const WIRE_GAUGES = [
  'awg-24',
  'awg-22',
  'awg-20',
  'awg-18',
  'awg-16',
  'awg-14',
  'awg-12',
  'awg-10',
  'mm2-0.5',
  'mm2-0.75',
  'mm2-1',
  'mm2-1.5',
  'mm2-2.5',
  'mm2-4',
  'mm2-6',
] as const;
export type WireGauge = (typeof WIRE_GAUGES)[number];

/** How a group's load per device is given: datasheet current or datasheet power. */
export const LOAD_INPUTS = ['amps', 'watts'] as const;
export type LoadInput = (typeof LOAD_INPUTS)[number];

/** Largest drop allowed, as a share of the supply voltage. */
export const DROP_LIMIT_PERCENTS = [5, 10, 15, 20] as const;
export type DropLimitPercent = (typeof DROP_LIMIT_PERCENTS)[number];

/** Share of the supply's rated current held back as headroom. */
export const SUPPLY_RESERVE_PERCENTS = [0, 10, 20, 30] as const;
export type SupplyReservePercent = (typeof SUPPLY_RESERVE_PERCENTS)[number];

export const MIN_SUPPLY_VOLTS = 5;
export const MAX_SUPPLY_VOLTS = 60;
export const MAX_SUPPLY_AMPS = 200;
export const MIN_LOAD_AMPS = 0.01;
export const MAX_LOAD_AMPS = 20;
export const MIN_LOAD_WATTS = 0.1;
export const MAX_LOAD_WATTS = 500;
/** Upper bound for a cable run the user types, in either length unit. */
export const MAX_RUN_LENGTH = 5000;
