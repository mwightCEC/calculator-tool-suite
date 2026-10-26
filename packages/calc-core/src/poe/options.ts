// Allowed values for PoE budget calculator inputs. Display labels live in the UI.

/**
 * The highest PoE standard a switch's ports support:
 * PoE (802.3af), PoE+ (802.3at), PoE++ Type 3 and Type 4 (802.3bt).
 */
export const PORT_STANDARDS = ['af', 'at', 'bt-type3', 'bt-type4'] as const;
export type PortStandard = (typeof PORT_STANDARDS)[number];

/** IEEE 802.3 power classes; details in poe-classes.ts. */
export const POE_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export type PoeClass = (typeof POE_CLASSES)[number];

/** How a group's power is given: its PoE class, or the datasheet's maximum draw in watts. */
export const POWER_INPUTS = ['class', 'watts'] as const;
export type PowerInput = (typeof POWER_INPUTS)[number];

/** Share of the switch budget held back as headroom. */
export const POE_RESERVE_PERCENTS = [0, 10, 20, 30] as const;
export type PoeReservePercent = (typeof POE_RESERVE_PERCENTS)[number];

export const CABLE_LENGTH_UNITS = ['ft', 'm'] as const;
export type CableLengthUnit = (typeof CABLE_LENGTH_UNITS)[number];

export const MIN_POE_BUDGET_WATTS = 1;
export const MAX_POE_BUDGET_WATTS = 2000;
export const MAX_POE_PORTS = 96;
export const MIN_DEVICE_WATTS = 0.5;
export const MAX_DEVICE_WATTS = 90;
/** Upper bound for a cable length the user types, in either unit. */
export const MAX_CABLE_LENGTH = 1000;
