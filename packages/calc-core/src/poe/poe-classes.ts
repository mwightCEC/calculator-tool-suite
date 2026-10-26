import type { PoeClass, PortStandard } from './options';

export interface PoeClassSpec {
  poeClass: PoeClass;
  standard: PortStandard;
  /** Power the switch sets aside per port, in watts. */
  switchWatts: number;
  /** Most the device may draw at its end of a 100 m cable, in watts. */
  deviceWatts: number;
  /** Twisted pairs carrying power. */
  pairs: 2 | 4;
}

/** IEEE 802.3af/at/bt power classes. Class 0 is unclassified and budgeted like class 3. */
export const POE_CLASS_SPECS: readonly PoeClassSpec[] = [
  { poeClass: 0, standard: 'af', switchWatts: 15.4, deviceWatts: 12.95, pairs: 2 },
  { poeClass: 1, standard: 'af', switchWatts: 4, deviceWatts: 3.84, pairs: 2 },
  { poeClass: 2, standard: 'af', switchWatts: 7, deviceWatts: 6.49, pairs: 2 },
  { poeClass: 3, standard: 'af', switchWatts: 15.4, deviceWatts: 12.95, pairs: 2 },
  { poeClass: 4, standard: 'at', switchWatts: 30, deviceWatts: 25.5, pairs: 2 },
  { poeClass: 5, standard: 'bt-type3', switchWatts: 45, deviceWatts: 40, pairs: 4 },
  { poeClass: 6, standard: 'bt-type3', switchWatts: 60, deviceWatts: 51, pairs: 4 },
  { poeClass: 7, standard: 'bt-type4', switchWatts: 75, deviceWatts: 62, pairs: 4 },
  { poeClass: 8, standard: 'bt-type4', switchWatts: 90, deviceWatts: 71.3, pairs: 4 },
];

/** Highest class each port standard can power. */
export const PORT_STANDARD_MAX_CLASS: Record<PortStandard, PoeClass> = {
  af: 3,
  at: 4,
  'bt-type3': 6,
  'bt-type4': 8,
};

export function poeClassSpec(poeClass: PoeClass): PoeClassSpec {
  // POE_CLASS_SPECS is indexed by class number.
  return POE_CLASS_SPECS[poeClass] as PoeClassSpec;
}

/** Most a device on a port of this standard may draw, in watts. */
export function portStandardMaxDeviceWatts(standard: PortStandard): number {
  return poeClassSpec(PORT_STANDARD_MAX_CLASS[standard]).deviceWatts;
}

/**
 * Lowest class whose device power covers a draw, or null when no class does.
 * Class 0 is skipped: it budgets the same as class 3.
 */
export function classForDeviceWatts(watts: number): PoeClass | null {
  const spec = POE_CLASS_SPECS.find(
    (candidate) => candidate.poeClass !== 0 && candidate.deviceWatts >= watts
  );
  return spec ? spec.poeClass : null;
}
