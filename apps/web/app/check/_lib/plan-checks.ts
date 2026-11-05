import { assignCamera, supplyKey } from './assign-cameras';
import type { Cart, CartItem, PowerSupplyItem } from './cart-payload';
import type { SkippedLine } from './skipped';
import {
  planVoltageDropChecks,
  type VoltageDropCamera,
  type VoltageDropCheck,
} from './voltage-drop-checks';

/*
 * Sorts a cart into the checks the Check my system page offers, and the lines
 * it can't check (with the reason). PoE budget checks come in a later change;
 * until then PoE cameras and injectors are listed as not checked yet.
 */

export interface CartSummary {
  cameras: number;
  powerSupplies: number;
  /** Everything else, including lines that couldn't be read. */
  otherItems: number;
}

export interface CheckPlan {
  summary: CartSummary;
  voltageDrop: VoltageDropCheck[];
  skipped: SkippedLine[];
}

function skippedItem(item: CartItem, reason: SkippedLine['reason']): SkippedLine {
  return {
    sku: item.sku,
    ...(item.name ? { name: item.name } : {}),
    qty: item.qty,
    reason,
  };
}

function summarise(cart: Cart): CartSummary {
  const total = (kind: CartItem['kind']) =>
    cart.items.filter((item) => item.kind === kind).reduce((sum, item) => sum + item.qty, 0);
  const cameras = total('camera');
  const powerSupplies = total('power-supply');
  const allItems =
    cart.items.reduce((sum, item) => sum + item.qty, 0) +
    cart.unreadable.reduce((sum, line) => sum + (line.qty ?? 1), 0);
  return { cameras, powerSupplies, otherItems: allItems - cameras - powerSupplies };
}

export function planChecks(cart: Cart): CheckPlan {
  const supplies = cart.items.filter(
    (item): item is PowerSupplyItem => item.kind === 'power-supply'
  );
  const sources = {
    supplyKeys: new Set(
      supplies.map((supply) => supplyKey(supply.output.type, supply.output.volts))
    ),
    hasPoeInjector: cart.items.some((item) => item.kind === 'poe-injector'),
  };

  const skipped: SkippedLine[] = [...cart.unreadable];
  const voltageDropCameras: VoltageDropCamera[] = [];

  for (const item of cart.items) {
    switch (item.kind) {
      case 'camera': {
        const assignment = assignCamera(item, sources);
        if (assignment.check === 'voltage-drop') {
          voltageDropCameras.push({
            camera: item,
            supplyKey: assignment.supplyKey,
            input: assignment.input,
          });
        } else {
          skipped.push(
            skippedItem(item, assignment.check === 'poe' ? 'poe-not-yet' : 'no-matching-supply')
          );
        }
        break;
      }
      case 'poe-injector':
        skipped.push(skippedItem(item, 'poe-not-yet'));
        break;
      case 'recorder':
        skipped.push(skippedItem(item, 'recorder'));
        break;
      case 'cable':
      case 'accessory':
        skipped.push(skippedItem(item, 'not-powered'));
        break;
      case 'power-supply':
        // Handled with the cameras assigned to it.
        break;
    }
  }

  const voltageDrop = planVoltageDropChecks(supplies, voltageDropCameras);
  return {
    summary: summarise(cart),
    voltageDrop: voltageDrop.checks,
    skipped: [...skipped, ...voltageDrop.skipped],
  };
}
