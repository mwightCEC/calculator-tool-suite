import type { CableLengthUnit, VoltageDropGroupUsage } from '@cctv/calc-core';
import {
  formatAmps,
  formatNumber,
  formatPercent,
  formatVolts,
  formatWatts,
} from '../../../../lib/format';
import type { VoltageDropGroupState } from '../_state/voltage-drop-calculator-state';
import { describeGauge } from './voltage-drop-labels';

/** One device's load as entered: "0.5 A" or "6 W". */
export function describeLoad(group: VoltageDropGroupState): string {
  return group.load.input === 'amps' ? formatAmps(group.load.amps) : formatWatts(group.load.watts);
}

/** The drop on one run: "0.64 V (5.3%)", or "Can't power the device" when the run can't deliver it. */
export function describeDrop(usage: VoltageDropGroupUsage): string {
  if (usage.dropVolts === null || usage.dropFraction === null) {
    return "Can't power the device";
  }
  return `${formatVolts(usage.dropVolts)} (${formatPercent(usage.dropFraction)})`;
}

/** Collapsed-card summary, e.g. "4 × 0.5 A · 18 AWG · 100 ft". */
export function summarizeGroup(group: VoltageDropGroupState, unit: CableLengthUnit): string {
  return [
    `${formatNumber(group.deviceCount, 0)} × ${describeLoad(group)}`,
    describeGauge(group.gauge),
    `${formatNumber(group.cableLength, 1)} ${unit}`,
  ].join(' · ');
}

/** Note under the run length, e.g. "0.64 V (5.3%) drop · 11.36 V at the device". */
export function describeRun(usage: VoltageDropGroupUsage): string {
  if (usage.deviceVolts === null) {
    return "This run can't deliver the device's power";
  }
  return `${describeDrop(usage)} drop · ${formatVolts(usage.deviceVolts)} at the device`;
}
