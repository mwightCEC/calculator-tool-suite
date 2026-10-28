import type { DeviceLoad } from './schema';

/**
 * Current one device draws through a run with this loop resistance, in amps,
 * or null when the run can't deliver its power.
 *
 * By amps the load is constant current, which no run can deliver once I × R
 * reaches the supply voltage. By watts it is constant power, so the
 * current rises as the voltage at the device falls: P = (V − IR) × I, solved
 * as I = 2P / (V + √(V² − 4PR)). With V² < 4PR no current delivers P.
 */
export function runCurrent(load: DeviceLoad, supplyVolts: number, loopOhms: number): number | null {
  if (load.input === 'amps') {
    return load.amps * loopOhms < supplyVolts ? load.amps : null;
  }
  const discriminant = supplyVolts ** 2 - 4 * load.watts * loopOhms;
  if (discriminant < 0) {
    return null;
  }
  return (2 * load.watts) / (supplyVolts + Math.sqrt(discriminant));
}

/**
 * Highest loop resistance that keeps the drop within `limitFraction` of the
 * supply voltage, in ohms. By watts the device then sees V(1 − f) and draws
 * P / (V(1 − f)), so R = V² f (1 − f) / P.
 */
export function maxLoopOhms(load: DeviceLoad, supplyVolts: number, limitFraction: number): number {
  if (load.input === 'amps') {
    return (supplyVolts * limitFraction) / load.amps;
  }
  return (supplyVolts ** 2 * limitFraction * (1 - limitFraction)) / load.watts;
}
