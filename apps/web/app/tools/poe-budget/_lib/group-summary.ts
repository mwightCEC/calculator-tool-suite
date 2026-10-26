import type { CableLengthUnit, PoeGroupUsage } from '@cctv/calc-core';
import { formatNumber, formatWatts } from '../../../../lib/format';
import type { PoeGroupState } from '../_state/poe-calculator-state';

/** One device's power as entered: "6 W" or "Class 4". */
export function describePower(group: PoeGroupState): string {
  return group.power.input === 'class'
    ? `Class ${group.power.poeClass}`
    : formatWatts(group.power.watts);
}

/** Collapsed-card summary, e.g. "4 × 6 W · 6.2 W each · 300 ft". */
export function summarizeGroup(
  group: PoeGroupState,
  usage: PoeGroupUsage,
  unit: CableLengthUnit
): string {
  return [
    `${formatNumber(group.deviceCount, 0)} × ${describePower(group)}`,
    `${formatWatts(usage.perDeviceWatts)} each`,
    group.cableLength === null ? '100 m assumed' : `${formatNumber(group.cableLength, 1)} ${unit}`,
  ].join(' · ');
}

/** What one device takes from the budget, e.g. "6.2 W from the budget, including 0.2 W cable loss". */
export function describeAllocation(usage: PoeGroupUsage): string {
  const budget = `${formatWatts(usage.perDeviceWatts)} from the budget`;
  return usage.cableLossWatts > 0
    ? `${budget}, including ${formatWatts(usage.cableLossWatts)} estimated cable loss`
    : `${budget} (the class allocation)`;
}
