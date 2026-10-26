import { cableLengthInMetres, cableLossWatts, MAX_CABLE_RUN_M } from './cable-loss';
import type { CableLengthUnit, PoeClass, PortStandard } from './options';
import {
  classForDeviceWatts,
  PORT_STANDARD_MAX_CLASS,
  poeClassSpec,
  portStandardMaxDeviceWatts,
} from './poe-classes';
import type { PoeDeviceGroup, PoeInput } from './schema';

export const BUDGET_STATUSES = ['ok', 'into-reserve', 'over-budget'] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

/** One failed check, naming the group where it belongs to one. */
export type PoeProblem =
  | { kind: 'over-budget' }
  | { kind: 'into-reserve' }
  | { kind: 'not-enough-ports' }
  | { kind: 'port-standard'; groupId: string }
  | { kind: 'cable-too-long'; groupId: string };

export interface PoeGroupUsage {
  groupId: string;
  deviceCount: number;
  /** Class the device needs: as given, or the lowest that covers its draw (null when none does). */
  requiredClass: PoeClass | null;
  /** Cable run in metres; null when the group gave none. */
  cableLengthM: number | null;
  /** Estimated cable loss per device (by watts only; 0 by class, which already allows for it). */
  cableLossWatts: number;
  /** Switch-side power taken from the budget per device, in watts. */
  perDeviceWatts: number;
  totalWatts: number;
  /** False when the switch's port standard can't power this device. */
  fitsPortStandard: boolean;
  /** True when the cable run is longer than Ethernet's 100 m. */
  cableTooLong: boolean;
}

export interface PoeResult {
  groups: PoeGroupUsage[];
  totalDevices: number;
  /** Sum of every group's allocation, in watts. */
  totalWatts: number;
  budgetWatts: number;
  reserveWatts: number;
  /** Budget less the reserve. */
  usableWatts: number;
  /** Usable watts left over; negative when over. */
  remainingWatts: number;
  /** Total ÷ usable; 1 = exactly at the usable budget. */
  utilisation: number;
  budgetStatus: BudgetStatus;
  ports: number;
  enoughPorts: boolean;
  /** Failed checks: the budget first, then ports, then each group in order. */
  problems: PoeProblem[];
}

export function budgetStatus(
  totalWatts: number,
  usableWatts: number,
  budgetWatts: number
): BudgetStatus {
  if (totalWatts > budgetWatts) {
    return 'over-budget';
  }
  return totalWatts > usableWatts ? 'into-reserve' : 'ok';
}

function groupUsage(
  group: PoeDeviceGroup,
  portStandard: PortStandard,
  unit: CableLengthUnit
): PoeGroupUsage {
  const cableLengthM =
    group.cableLength === null ? null : cableLengthInMetres(group.cableLength, unit);
  const cableTooLong = cableLengthM !== null && cableLengthM > MAX_CABLE_RUN_M;
  const base = { groupId: group.id, deviceCount: group.deviceCount, cableLengthM, cableTooLong };

  if (group.power.input === 'class') {
    const { poeClass } = group.power;
    const perDeviceWatts = poeClassSpec(poeClass).switchWatts;
    return {
      ...base,
      requiredClass: poeClass,
      cableLossWatts: 0,
      perDeviceWatts,
      totalWatts: perDeviceWatts * group.deviceCount,
      fitsPortStandard: poeClass <= PORT_STANDARD_MAX_CLASS[portStandard],
    };
  }

  const { watts } = group.power;
  const lossWatts = cableLossWatts(watts, cableLengthM ?? MAX_CABLE_RUN_M);
  const perDeviceWatts = watts + lossWatts;
  return {
    ...base,
    requiredClass: classForDeviceWatts(watts),
    cableLossWatts: lossWatts,
    perDeviceWatts,
    totalWatts: perDeviceWatts * group.deviceCount,
    fitsPortStandard: watts <= portStandardMaxDeviceWatts(portStandard),
  };
}

function problemsFor(
  groups: PoeGroupUsage[],
  status: BudgetStatus,
  enoughPorts: boolean
): PoeProblem[] {
  const problems: PoeProblem[] = [];
  if (status !== 'ok') {
    problems.push({ kind: status });
  }
  if (!enoughPorts) {
    problems.push({ kind: 'not-enough-ports' });
  }
  for (const group of groups) {
    if (!group.fitsPortStandard) {
      problems.push({ kind: 'port-standard', groupId: group.groupId });
    }
    if (group.cableTooLong) {
      problems.push({ kind: 'cable-too-long', groupId: group.groupId });
    }
  }
  return problems;
}

/**
 * PoE power each device group takes from one switch, and the checks from the
 * spec: budget against the reserve, port count, port standard and cable length.
 * Expects input that has passed `poeInputSchema`.
 */
export function calculatePoe(input: PoeInput): PoeResult {
  const { budgetWatts, ports, portStandard, reservePercent } = input.powerSource;
  const groups = input.deviceGroups.map((group) =>
    groupUsage(group, portStandard, input.cableLengthUnit)
  );
  const totalDevices = groups.reduce((sum, group) => sum + group.deviceCount, 0);
  const totalWatts = groups.reduce((sum, group) => sum + group.totalWatts, 0);
  const reserveWatts = (budgetWatts * reservePercent) / 100;
  const usableWatts = budgetWatts - reserveWatts;
  const status = budgetStatus(totalWatts, usableWatts, budgetWatts);
  const enoughPorts = totalDevices <= ports;

  return {
    groups,
    totalDevices,
    totalWatts,
    budgetWatts,
    reserveWatts,
    usableWatts,
    remainingWatts: usableWatts - totalWatts,
    utilisation: totalWatts / usableWatts,
    budgetStatus: status,
    ports,
    enoughPorts,
    problems: problemsFor(groups, status, enoughPorts),
  };
}
