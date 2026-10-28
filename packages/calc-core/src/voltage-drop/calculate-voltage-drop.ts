import { cableLengthInMetres } from '../poe/cable-loss';
import { budgetStatus, type BudgetStatus } from '../poe/calculate-poe';
import type { WireGauge } from './options';
import { maxLoopOhms, runCurrent } from './run-drop';
import type { PowerSupply, VoltageDropGroup, VoltageDropInput } from './schema';
import { gaugesInSystem, loopOhms, ohmsPerMetre, wireGaugeSpec } from './wire-gauges';

export const RUN_STATUSES = ['ok', 'over-limit', 'cannot-power'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/** One failed check, naming the group where it belongs to one. */
export type VoltageDropProblem =
  | { kind: 'over-budget' }
  | { kind: 'into-reserve' }
  | { kind: 'over-limit'; groupId: string }
  | { kind: 'cannot-power'; groupId: string };

export interface VoltageDropGroupUsage {
  groupId: string;
  deviceCount: number;
  cableLengthM: number;
  /** Resistance out and back along one run, in ohms. */
  loopOhms: number;
  /** Current per device; when the run can't power it, its draw at the supply voltage. */
  ampsPerDevice: number;
  totalAmps: number;
  /** Drop along one run, in volts; null when the run can't power the device. */
  dropVolts: number | null;
  /** Drop as a share of the supply voltage, 0.1 = 10%; null when the run can't power the device. */
  dropFraction: number | null;
  /** Voltage at the device; null when the run can't power it. */
  deviceVolts: number | null;
  /** Power lost in all of the group's cables, in watts; null when a run can't power its device. */
  cableLossWatts: number | null;
  status: RunStatus;
  /** Thinnest wire in the input's system that keeps this run within the limit; null when none does. */
  smallestGauge: WireGauge | null;
  /** Longest run on the group's wire that keeps within the limit, in metres. */
  maxLengthM: number;
}

export interface VoltageDropResult {
  groups: VoltageDropGroupUsage[];
  totalDevices: number;
  /** Current the supply delivers to every run, in amps. */
  totalAmps: number;
  /** Power the supply delivers (volts × total amps), in watts. */
  totalWatts: number;
  ratedAmps: number;
  reserveAmps: number;
  /** Rated current less the reserve. */
  usableAmps: number;
  /** Usable amps left over; negative when over. */
  remainingAmps: number;
  /** Total ÷ usable; 1 = exactly at the usable rating. */
  utilisation: number;
  supplyStatus: BudgetStatus;
  /** Failed checks: the supply first, then each group in order. */
  problems: VoltageDropProblem[];
}

/** True when this wire keeps the run's drop within the limit. */
function withinLimit(
  group: VoltageDropGroup,
  gauge: WireGauge,
  supply: PowerSupply,
  lengthM: number,
  limit: number
): boolean {
  const ohms = loopOhms(gauge, lengthM);
  const amps = runCurrent(group.load, supply.volts, ohms);
  return amps !== null && amps * ohms <= supply.volts * limit;
}

function groupUsage(group: VoltageDropGroup, input: VoltageDropInput): VoltageDropGroupUsage {
  const supply = input.powerSupply;
  const limit = input.dropLimitPercent / 100;
  const cableLengthM = cableLengthInMetres(group.cableLength, input.cableLengthUnit);
  const ohms = loopOhms(group.gauge, cableLengthM);
  const amps = runCurrent(group.load, supply.volts, ohms);
  const nominalAmps =
    group.load.input === 'amps' ? group.load.amps : group.load.watts / supply.volts;
  const ampsPerDevice = amps ?? nominalAmps;
  const dropVolts = amps === null ? null : amps * ohms;
  const dropFraction = dropVolts === null ? null : dropVolts / supply.volts;

  let status: RunStatus = 'cannot-power';
  if (dropFraction !== null) {
    status = dropFraction <= limit ? 'ok' : 'over-limit';
  }

  const system = wireGaugeSpec(group.gauge).system;
  const smallestGauge =
    gaugesInSystem(system).find((gauge) =>
      withinLimit(group, gauge, supply, cableLengthM, limit)
    ) ?? null;

  return {
    groupId: group.id,
    deviceCount: group.deviceCount,
    cableLengthM,
    loopOhms: ohms,
    ampsPerDevice,
    totalAmps: ampsPerDevice * group.deviceCount,
    dropVolts,
    dropFraction,
    deviceVolts: dropVolts === null ? null : supply.volts - dropVolts,
    cableLossWatts: amps === null ? null : amps ** 2 * ohms * group.deviceCount,
    status,
    smallestGauge,
    maxLengthM: maxLoopOhms(group.load, supply.volts, limit) / (2 * ohmsPerMetre(group.gauge)),
  };
}

function problemsFor(groups: VoltageDropGroupUsage[], status: BudgetStatus): VoltageDropProblem[] {
  const problems: VoltageDropProblem[] = [];
  if (status !== 'ok') {
    problems.push({ kind: status });
  }
  for (const group of groups) {
    if (group.status !== 'ok') {
      problems.push({ kind: group.status, groupId: group.groupId });
    }
  }
  return problems;
}

/**
 * Voltage drop on each group's home runs, the smallest wire and longest run
 * that keep within the limit, and the load on the supply against its rating.
 * Expects input that has passed `voltageDropInputSchema`.
 */
export function calculateVoltageDrop(input: VoltageDropInput): VoltageDropResult {
  const { volts, ratedAmps, reservePercent } = input.powerSupply;
  const groups = input.deviceGroups.map((group) => groupUsage(group, input));
  const totalDevices = groups.reduce((sum, group) => sum + group.deviceCount, 0);
  const totalAmps = groups.reduce((sum, group) => sum + group.totalAmps, 0);
  const reserveAmps = (ratedAmps * reservePercent) / 100;
  const usableAmps = ratedAmps - reserveAmps;
  const status = budgetStatus(totalAmps, usableAmps, ratedAmps);

  return {
    groups,
    totalDevices,
    totalAmps,
    totalWatts: volts * totalAmps,
    ratedAmps,
    reserveAmps,
    usableAmps,
    remainingAmps: usableAmps - totalAmps,
    utilisation: totalAmps / usableAmps,
    supplyStatus: status,
    problems: problemsFor(groups, status),
  };
}
