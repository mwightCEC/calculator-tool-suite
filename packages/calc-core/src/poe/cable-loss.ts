import type { CableLengthUnit } from './options';
import { poeClassSpec } from './poe-classes';

/** Conservative switch-port voltage used for the current estimate. */
export const CABLE_LOSS_VOLTS = 50;
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

/**
 * Estimated power lost in the cable for one device, in watts: (P / V)² × R,
 * with R scaled from 12.5 Ω per 100 m and halved on four pairs.
 */
export function cableLossWatts(deviceWatts: number, lengthM: number): number {
  const amps = deviceWatts / CABLE_LOSS_VOLTS;
  const pairSets = pairsForDeviceWatts(deviceWatts) / 2;
  const loopOhms = (LOOP_OHMS_PER_100_M * (lengthM / 100)) / pairSets;
  return amps * amps * loopOhms;
}
