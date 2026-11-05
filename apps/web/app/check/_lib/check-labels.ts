import { formatNumber } from '../../../lib/format';
import { PORT_STANDARD_SHORT_LABELS } from '../../tools/poe-budget/_lib/poe-labels';
import { poeShareCodec } from '../../tools/poe-budget/_state/share-link';
import { describeSupply } from '../../tools/voltage-drop/_lib/voltage-drop-labels';
import { voltageDropShareCodec } from '../../tools/voltage-drop/_state/share-link';
import type { CartSummary } from './plan-checks';
import type { PoeCheck } from './poe-checks';
import type { VoltageDropCheck } from './voltage-drop-checks';

// Text and links for the Check my system page.

const VOLTAGE_DROP_ROUTE = '/tools/voltage-drop';
const POE_BUDGET_ROUTE = '/tools/poe-budget';

/** "1 camera", "12 cameras" */
export function plural(count: number, noun: string, pluralNoun = `${noun}s`): string {
  return `${formatNumber(count, 0)} ${count === 1 ? noun : pluralNoun}`;
}

/** "12 cameras, 1 power supply, 1 PoE injector and 3 other items from your cart" */
export function describeCartSummary({
  cameras,
  powerSupplies,
  poeInjectors,
  otherItems,
}: CartSummary): string {
  const parts = [
    cameras ? plural(cameras, 'camera') : '',
    powerSupplies ? plural(powerSupplies, 'power supply', 'power supplies') : '',
    poeInjectors ? plural(poeInjectors, 'PoE injector') : '',
    otherItems ? plural(otherItems, 'other item') : '',
  ].filter(Boolean);
  const list =
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? '');
  return `${list} from your cart`;
}

/** "10 cameras in 2 camera models." */
function describeCameras(groups: readonly { deviceCount: number }[]): string {
  const cameras = groups.reduce((sum, group) => sum + group.deviceCount, 0);
  return `${plural(cameras, 'camera')} in ${plural(groups.length, 'camera model')}.`;
}

/** "EX-A, EX-B" */
function listSkus(lines: readonly { sku: string }[]): string {
  return lines.map((line) => line.sku).join(', ');
}

/** "Voltage drop · 12 V DC supply" */
export function voltageDropCheckTitle(check: VoltageDropCheck): string {
  return `Voltage drop · ${describeSupply(check)} supply`;
}

/** Lines under a voltage drop check's title: the supply, the cameras, then what to enter. */
export function voltageDropCheckDetails(check: VoltageDropCheck): string[] {
  const amps = `${formatNumber(check.ratedAmps)} A`;
  const units = check.supplies.reduce((sum, supply) => sum + supply.qty, 0);
  let supplyLine: string;
  if (!units) {
    supplyLine = `No power supply in your cart, so this uses an example ${amps} supply. Enter yours.`;
  } else if (units === 1) {
    supplyLine = `${amps} from ${check.supplies[0]!.sku}.`;
  } else {
    supplyLine =
      `${amps} from ${plural(units, 'power supply', 'power supplies')} combined ` +
      `(${listSkus(check.supplies)}). If the cameras are split between them, check each supply’s share.`;
  }
  return [
    supplyLine,
    describeCameras(check.groups),
    'Every run starts at 100 ft of 18 AWG. Enter your real lengths and wire size: the results depend on them.',
  ];
}

/** "PoE budget · 360 W, 4 ports" */
export function poeCheckTitle(check: PoeCheck): string {
  return `PoE budget · ${formatNumber(check.budgetWatts)} W, ${plural(check.ports, 'port')}`;
}

/** Lines under the PoE check's title: the power source, the cameras, then what to enter. */
export function poeCheckDetails(check: PoeCheck): string[] {
  const standard = PORT_STANDARD_SHORT_LABELS[check.portStandard];
  const units = check.injectors.reduce((sum, injector) => sum + injector.qty, 0);
  let sourceLine: string;
  if (!units) {
    sourceLine =
      `No PoE injector in your cart, so this uses an example ${standard} switch. ` +
      'Enter your switch’s budget, ports and standard.';
  } else if (units === 1) {
    sourceLine = `${check.injectors[0]!.sku}, ${standard}.`;
  } else {
    sourceLine =
      `${plural(units, 'PoE injector')} combined (${listSkus(check.injectors)}). ` +
      'Each camera is still checked against what one port can supply.';
  }
  const lines = [sourceLine];
  if (check.mixedStandards) {
    lines.push(`They support different PoE standards, so this uses the lowest: ${standard}.`);
  }
  lines.push(
    describeCameras(check.groups),
    'Cable lengths start blank, so the calculator assumes the 100 m maximum. Enter yours if they’re shorter.'
  );
  return lines;
}

/** The calculator page with this check's state, as a normal share link. */
export function voltageDropCheckHref(check: VoltageDropCheck): string {
  return `${VOLTAGE_DROP_ROUTE}?${voltageDropShareCodec.encodeShareParams(check.state).toString()}`;
}

/** The PoE budget calculator with this check's state, as a normal share link. */
export function poeCheckHref(check: PoeCheck): string {
  return `${POE_BUDGET_ROUTE}?${poeShareCodec.encodeShareParams(check.state).toString()}`;
}
