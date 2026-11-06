import type { CableLengthUnit, PortStandard } from './options';
import { poeClassSpec } from './poe-classes';

/**
 * Lowest voltage a switch port of each standard may put out (IEEE 802.3af/at/bt
 * PSE minimums). The cable-loss estimate uses it, as the standard's own
 * allocations do, so the result holds for any compliant switch.
 */
export const PORT_STANDARD_MIN_VOLTS: Record<PortStandard, number> = {
  af: 44,
  at: 50,
  'bt-type3': 50,
  'bt-type4': 52,
};
/** 802.3at loop resistance for 100 m of Cat5e on one pair set, in ohms. */
export const LOOP_OHMS_PER_100_M = 12.5;
/** Longest Ethernet run the standard allows; also the length assumed when none is given. */
export const MAX_CABLE_RUN_M = 100;
export const METRES_PER_FOOT = 0.3048;

export function cableLengthInMetres(length: number, unit: CableLengthUnit): number {
  return unit === 'm' ? length : length * METRES_PER_FOOT;
}

/** Draws above class 4's device power need four pairs, which halves the loop resistance. */
export function pairsForDeviceWatts(watts: number): 2 | 4 {
  return watts > poeClassSpec(4).deviceWatts ? 4 : 2;
}

/** Loop resistance of one run, in ohms: 12.5 Ω per 100 m, halved on four pairs. */
export function poeLoopOhms(deviceWatts: number, lengthM: number): number {
  const pairSets = pairsForDeviceWatts(deviceWatts) / 2;
  return (LOOP_OHMS_PER_100_M * (lengthM / 100)) / pairSets;
}

/**
 * Estimated power lost in the cable for one device, in watts, or null when the
 * cable can't carry the device's power at all.
 *
 * The device gets what the cable leaves: P = (V − I·R)·I. Solving for the
 * smaller current, I = 2P ÷ (V + √(V² − 4PR)), and the loss is I²R. With no
 * real root (4PR > V²) no current delivers P through this cable.
 */
export function cableLossWatts(
  deviceWatts: number,
  lengthM: number,
  portStandard: PortStandard
): number | null {
  const volts = PORT_STANDARD_MIN_VOLTS[portStandard];
  const ohms = poeLoopOhms(deviceWatts, lengthM);
  const discriminant = volts * volts - 4 * deviceWatts * ohms;
  if (discriminant < 0) {
    return null;
  }
  const amps = (2 * deviceWatts) / (volts + Math.sqrt(discriminant));
  return amps * amps * ohms;
}
