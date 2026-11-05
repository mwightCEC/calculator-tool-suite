import { formatNumber } from '../../../lib/format';
import { describeSupply } from '../../tools/voltage-drop/_lib/voltage-drop-labels';
import { voltageDropShareCodec } from '../../tools/voltage-drop/_state/share-link';
import type { CartSummary } from './plan-checks';
import type { VoltageDropCheck } from './voltage-drop-checks';

// Text and links for the Check my system page.

const VOLTAGE_DROP_ROUTE = '/tools/voltage-drop';

/** "1 camera", "12 cameras" */
export function plural(count: number, noun: string, pluralNoun = `${noun}s`): string {
  return `${formatNumber(count, 0)} ${count === 1 ? noun : pluralNoun}`;
}

/** "12 cameras, 1 power supply and 3 other items from your cart" */
export function describeCartSummary({ cameras, powerSupplies, otherItems }: CartSummary): string {
  const parts = [
    cameras ? plural(cameras, 'camera') : '',
    powerSupplies ? plural(powerSupplies, 'power supply', 'power supplies') : '',
    otherItems ? plural(otherItems, 'other item') : '',
  ].filter(Boolean);
  const list =
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? '');
  return `${list} from your cart`;
}

/** "Voltage drop · 12 V DC supply" */
export function voltageDropCheckTitle(check: VoltageDropCheck): string {
  return `Voltage drop · ${describeSupply(check)} supply`;
}

/** Lines under a check's title: the supply used, then the cameras. */
export function voltageDropCheckDetails(check: VoltageDropCheck): string[] {
  const amps = `${formatNumber(check.ratedAmps)} A`;
  const supplyUnits = check.supplies.reduce((sum, supply) => sum + supply.qty, 0);
  let supplyLine: string;
  if (!supplyUnits) {
    supplyLine = `No power supply in your cart, so this uses an example ${amps} supply. Enter yours.`;
  } else if (supplyUnits === 1) {
    supplyLine = `${amps} from ${check.supplies[0]!.sku}.`;
  } else {
    supplyLine = `${amps} from ${plural(supplyUnits, 'power supply', 'power supplies')} combined (${check.supplies
      .map((supply) => supply.sku)
      .join(', ')}). If the cameras are split between them, check each supply's share.`;
  }
  const cameras = check.groups.reduce((sum, group) => sum + group.deviceCount, 0);
  const models = plural(check.groups.length, 'camera model');
  return [supplyLine, `${plural(cameras, 'camera')} in ${models}.`];
}

/** The calculator page with this check's state, as a normal share link. */
export function voltageDropCheckHref(check: VoltageDropCheck): string {
  return `${VOLTAGE_DROP_ROUTE}?${voltageDropShareCodec.encodeShareParams(check.state).toString()}`;
}
