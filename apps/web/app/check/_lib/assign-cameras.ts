import type { SupplyKind } from '@cctv/calc-core';
import type { CameraItem, LowVoltageInput, PowerInput } from './cart-payload';

/*
 * Which check each camera joins (spec: "Voltage drop mapping", step 2).
 * A camera is checked once:
 * 1. Its first power input that matches something in the cart wins: a supply
 *    of the same type and voltage, or, for PoE, a PoE injector.
 * 2. Otherwise its first input that can still be checked with an example
 *    power source: DC or AC when the cart has no power supply at all, or PoE
 *    (the visitor's own switch).
 * 3. Otherwise it isn't checked: the cart's supplies are all the wrong voltage.
 */

export type CameraAssignment =
  | { check: 'voltage-drop'; supplyKey: string; input: LowVoltageInput }
  | { check: 'poe'; input: Extract<PowerInput, { type: 'poe' }> }
  | { check: 'none' };

/** Supplies and camera inputs with the same key can be checked together. */
export function supplyKey(kind: SupplyKind, volts: number): string {
  return `${kind}:${volts}`;
}

export interface CartPowerSources {
  /** supplyKey of every power supply in the cart. */
  supplyKeys: ReadonlySet<string>;
  hasPoeInjector: boolean;
}

export function assignCamera(camera: CameraItem, sources: CartPowerSources): CameraAssignment {
  for (const input of camera.power) {
    if (input.type === 'poe') {
      if (sources.hasPoeInjector) {
        return { check: 'poe', input };
      }
    } else {
      const key = supplyKey(input.type, input.volts);
      if (sources.supplyKeys.has(key)) {
        return { check: 'voltage-drop', supplyKey: key, input };
      }
    }
  }

  const noSupplies = sources.supplyKeys.size === 0;
  for (const input of camera.power) {
    if (input.type === 'poe') {
      return { check: 'poe', input };
    }
    if (noSupplies) {
      const key = supplyKey(input.type, input.volts);
      return { check: 'voltage-drop', supplyKey: key, input };
    }
  }
  return { check: 'none' };
}
