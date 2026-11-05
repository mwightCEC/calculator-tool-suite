import { assignCamera, supplyKey } from './assign-cameras';
import type { AssignedCamera } from './camera-models';
import type { Cart, CartItem, PoeInjectorItem, PowerSupplyItem } from './cart-payload';
import { planPoeCheck, type PoeCheck, type PoeInput } from './poe-checks';
import { skippedLine, type SkippedLine } from './skipped';
import {
  planVoltageDropChecks,
  type VoltageDropCamera,
  type VoltageDropCheck,
} from './voltage-drop-checks';

/*
 * Sorts a cart into the checks the Check my system page offers, and the lines
 * it can't check (with the reason).
 */

export interface CartSummary {
  cameras: number;
  powerSupplies: number;
  poeInjectors: number;
  /** Everything else, including lines that couldn't be read. */
  otherItems: number;
}

export interface CheckPlan {
  summary: CartSummary;
  voltageDrop: VoltageDropCheck[];
  poe?: PoeCheck;
  skipped: SkippedLine[];
}

function summarise(cart: Cart): CartSummary {
  const total = (kind: CartItem['kind']) =>
    cart.items.filter((item) => item.kind === kind).reduce((sum, item) => sum + item.qty, 0);
  const cameras = total('camera');
  const powerSupplies = total('power-supply');
  const poeInjectors = total('poe-injector');
  const allItems =
    cart.items.reduce((sum, item) => sum + item.qty, 0) +
    cart.unreadable.reduce((sum, line) => sum + (line.qty ?? 1), 0);
  return {
    cameras,
    powerSupplies,
    poeInjectors,
    otherItems: allItems - cameras - powerSupplies - poeInjectors,
  };
}

export function planChecks(cart: Cart): CheckPlan {
  const supplies = cart.items.filter(
    (item): item is PowerSupplyItem => item.kind === 'power-supply'
  );
  const injectors = cart.items.filter(
    (item): item is PoeInjectorItem => item.kind === 'poe-injector'
  );
  const sources = {
    supplyKeys: new Set(
      supplies.map((supply) => supplyKey(supply.output.type, supply.output.volts))
    ),
    hasPoeInjector: injectors.length > 0,
  };

  const skipped: SkippedLine[] = [...cart.unreadable];
  const voltageDropCameras: VoltageDropCamera[] = [];
  const poeCameras: AssignedCamera<PoeInput>[] = [];

  for (const item of cart.items) {
    switch (item.kind) {
      case 'camera': {
        const assignment = assignCamera(item, sources);
        if (assignment.check === 'voltage-drop') {
          const { supplyKey: key, input } = assignment;
          voltageDropCameras.push({ camera: item, supplyKey: key, input });
        } else if (assignment.check === 'poe') {
          poeCameras.push({ camera: item, input: assignment.input });
        } else {
          skipped.push(skippedLine(item, 'no-matching-supply'));
        }
        break;
      }
      case 'recorder':
        skipped.push(skippedLine(item, 'recorder'));
        break;
      case 'cable':
      case 'accessory':
        skipped.push(skippedLine(item, 'not-powered'));
        break;
      case 'power-supply':
      case 'poe-injector':
        // Handled with the cameras assigned to them.
        break;
    }
  }

  const voltageDrop = planVoltageDropChecks(supplies, voltageDropCameras);
  const poe = planPoeCheck(injectors, poeCameras);
  return {
    summary: summarise(cart),
    voltageDrop: voltageDrop.checks,
    ...(poe.check ? { poe: poe.check } : {}),
    skipped: [...skipped, ...voltageDrop.skipped, ...poe.skipped],
  };
}
