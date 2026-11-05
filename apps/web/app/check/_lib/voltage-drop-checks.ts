import { MAX_SUPPLY_AMPS, type DeviceLoad, type SupplyKind } from '@cctv/calc-core';
import {
  createInitialVoltageDropCalculatorState,
  voltageDropCalculatorStateSchema,
  type VoltageDropCalculatorState,
  type VoltageDropGroupState,
} from '../../tools/voltage-drop/_state/voltage-drop-calculator-state';
import { supplyKey } from './assign-cameras';
import {
  fitModels,
  groupBasics,
  mergeModels,
  skippedModel,
  type AssignedCamera,
  type CameraModel,
} from './camera-models';
import type { LowVoltageInput, PowerSupplyItem } from './cart-payload';
import { skippedLine, type SkippedLine } from './skipped';

/*
 * Cart → Voltage drop checks (spec: "Voltage drop mapping"). One check per
 * supply type and voltage: supplies of that kind are combined, and each camera
 * model assigned to it becomes one device group. What the cart can't know
 * (cable lengths, wire size, drop limit, reserve) stays at the calculator's
 * defaults.
 */

/** Rated current of the example supply used when the cart has none. */
export const EXAMPLE_SUPPLY_AMPS = 5;

/** A camera line assigned to a voltage drop check, before lines are merged. */
export interface VoltageDropCamera extends AssignedCamera<LowVoltageInput> {
  supplyKey: string;
}

export interface VoltageDropCheck {
  kind: SupplyKind;
  volts: number;
  /** Supply lines combined into this check; empty when it uses the example supply. */
  supplies: PowerSupplyItem[];
  ratedAmps: number;
  /** Device groups, as camera models with their counts. */
  groups: { sku: string; deviceCount: number }[];
  state: VoltageDropCalculatorState;
}

export interface VoltageDropPlan {
  checks: VoltageDropCheck[];
  skipped: SkippedLine[];
}

/** Total rated current of one supply line, in amps. */
function supplyLineAmps({ output, qty }: PowerSupplyItem): number {
  const perUnit = output.amps ?? (output.watts ?? 0) / output.volts;
  return perUnit * qty;
}

function roundAmps(amps: number): number {
  return Math.round(amps * 100) / 100;
}

/** Amps when the datasheet gives them (constant current), otherwise watts (constant power). */
function loadFor(input: LowVoltageInput): DeviceLoad {
  return input.amps !== undefined
    ? { input: 'amps', amps: input.amps }
    : { input: 'watts', watts: input.watts ?? 0 };
}

function buildState(
  kind: SupplyKind,
  volts: number,
  ratedAmps: number,
  models: readonly CameraModel<LowVoltageInput>[]
): VoltageDropCalculatorState | undefined {
  const defaults = createInitialVoltageDropCalculatorState();
  const template = defaults.deviceGroups[0]!;
  const deviceGroups: VoltageDropGroupState[] = models.map((model, index) => ({
    ...groupBasics(model, index),
    load: loadFor(model.input),
    gauge: template.gauge,
    cableLength: template.cableLength,
  }));
  const parsed = voltageDropCalculatorStateSchema.safeParse({
    ...defaults,
    powerSupply: { ...defaults.powerSupply, kind, volts, ratedAmps },
    deviceGroups,
  });
  return parsed.success ? parsed.data : undefined;
}

/**
 * Builds the voltage drop checks for the cart's supplies and the cameras
 * assigned to them (see assign-cameras.ts), keeping the cart's order.
 */
export function planVoltageDropChecks(
  supplies: readonly PowerSupplyItem[],
  cameras: readonly VoltageDropCamera[]
): VoltageDropPlan {
  const keys = [...new Set(cameras.map((camera) => camera.supplyKey))];
  const checks: VoltageDropCheck[] = [];
  const skipped: SkippedLine[] = [];

  for (const supply of supplies) {
    if (!keys.includes(supplyKey(supply.output.type, supply.output.volts))) {
      skipped.push(skippedLine(supply, 'no-matching-camera'));
    }
  }

  for (const key of keys) {
    const assigned = cameras.filter((camera) => camera.supplyKey === key);
    const { type: kind, volts } = assigned[0]!.input;
    const keySupplies = supplies.filter(
      (supply) => supplyKey(supply.output.type, supply.output.volts) === key
    );
    const totalAmps = keySupplies.reduce((sum, supply) => sum + supplyLineAmps(supply), 0);
    const models = mergeModels(assigned);

    if (totalAmps > MAX_SUPPLY_AMPS) {
      skipped.push(
        ...keySupplies.map((supply) => skippedLine(supply, 'supply-over-limit')),
        ...models.map((model) => skippedModel(model, 'supply-over-limit'))
      );
      continue;
    }

    const { grouped, skipped: overLimits } = fitModels(models);
    skipped.push(...overLimits);
    if (!grouped.length) {
      skipped.push(...keySupplies.map((supply) => skippedLine(supply, 'no-matching-camera')));
      continue;
    }

    const ratedAmps = keySupplies.length ? roundAmps(totalAmps) : EXAMPLE_SUPPLY_AMPS;
    const state = buildState(kind, volts, ratedAmps, grouped);
    if (!state) {
      skipped.push(
        ...keySupplies.map((supply) => skippedLine(supply, 'invalid-data')),
        ...grouped.map((model) => skippedModel(model, 'invalid-data'))
      );
      continue;
    }
    checks.push({
      kind,
      volts,
      supplies: keySupplies,
      ratedAmps,
      groups: grouped.map(({ sku, deviceCount }) => ({ sku, deviceCount })),
      state,
    });
  }

  return { checks, skipped };
}
