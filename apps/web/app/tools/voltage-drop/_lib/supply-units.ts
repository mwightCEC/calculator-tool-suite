import type { PowerSupply } from '@cctv/calc-core';
import { formatAmps, formatVoltAmps } from '../../../../lib/format';

/*
 * Supply figures in the unit the supply is sold by: amps for DC, volt-amperes
 * for an AC transformer. The calculation stays in amps; treating AC like DC at
 * its RMS voltage, VA = volts × amps.
 */

type SupplyRating = Pick<PowerSupply, 'kind' | 'volts'>;

/** A supply-side current in the supply's rating unit: "4.17 A", or "100 VA" for AC. */
export function formatSupplyAmps(supply: SupplyRating, amps: number): string {
  return supply.kind === 'ac' ? formatVoltAmps(amps * supply.volts) : formatAmps(amps);
}
