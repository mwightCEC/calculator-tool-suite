import {
  MAX_POE_BUDGET_WATTS,
  MAX_POE_PORTS,
  PORT_STANDARDS,
  type PortStandard,
} from '@cctv/calc-core';
import {
  createInitialPoeCalculatorState,
  poeCalculatorStateSchema,
  type PoeCalculatorState,
  type PoeGroupState,
} from '../../tools/poe-budget/_state/poe-calculator-state';
import {
  fitModels,
  groupBasics,
  mergeModels,
  skippedModel,
  type AssignedCamera,
  type CameraModel,
} from './camera-models';
import type { PoeInjectorItem, PowerInput } from './cart-payload';
import { skippedLine, type SkippedLine } from './skipped';

/*
 * Cart → PoE budget check (spec: "PoE budget mapping"). The calculator models
 * one PoE source shared by all its ports, so the cart's injectors are combined:
 * budgets and ports added up, and the lowest port standard among them, so the
 * check errs on the safe side. Each camera is still checked against its own
 * port's limit by the calculator's port standard check. With no injector in
 * the cart, the check opens with the calculator's example switch.
 */

export type PoeInput = Extract<PowerInput, { type: 'poe' }>;

export interface PoeCheck {
  /** Injector lines combined into this check; empty when it uses the example switch. */
  injectors: PoeInjectorItem[];
  budgetWatts: number;
  ports: number;
  portStandard: PortStandard;
  /** True when the injectors support different standards, so the lowest is used. */
  mixedStandards: boolean;
  /** Device groups, as camera models with their counts. */
  groups: { sku: string; deviceCount: number }[];
  state: PoeCalculatorState;
}

export interface PoePlan {
  check?: PoeCheck;
  skipped: SkippedLine[];
}

interface PowerSource {
  budgetWatts: number;
  ports: number;
  portStandard: PortStandard;
  mixedStandards: boolean;
}

/** The injectors as one power source, or the calculator's example switch when there are none. */
function combinedSource(
  injectors: readonly PoeInjectorItem[],
  example: PoeCalculatorState['powerSource']
): PowerSource {
  if (!injectors.length) {
    const { budgetWatts, ports, portStandard } = example;
    return { budgetWatts, ports, portStandard, mixedStandards: false };
  }
  const rank = (standard: PortStandard) => PORT_STANDARDS.indexOf(standard);
  const standards = injectors.map((injector) => injector.poe.standard);
  return {
    budgetWatts: injectors.reduce((sum, { poe, qty }) => sum + poe.watts * qty, 0),
    ports: injectors.reduce((sum, { poe, qty }) => sum + poe.ports * qty, 0),
    portStandard: standards.reduce((lowest, standard) =>
      rank(standard) < rank(lowest) ? standard : lowest
    ),
    mixedStandards: new Set(standards).size > 1,
  };
}

function buildState(
  source: PowerSource,
  models: readonly CameraModel<PoeInput>[]
): PoeCalculatorState | undefined {
  const defaults = createInitialPoeCalculatorState();
  const deviceGroups: PoeGroupState[] = models.map((model, index) => ({
    ...groupBasics(model, index),
    power: { input: 'watts', watts: model.input.watts },
    // Blank: the calculator assumes the 100 m maximum and says so.
    cableLength: null,
  }));
  const { budgetWatts, ports, portStandard } = source;
  const parsed = poeCalculatorStateSchema.safeParse({
    ...defaults,
    powerSource: { ...defaults.powerSource, budgetWatts, ports, portStandard },
    deviceGroups,
  });
  return parsed.success ? parsed.data : undefined;
}

/** Builds the PoE check for the cart's injectors and the cameras assigned to PoE. */
export function planPoeCheck(
  injectors: readonly PoeInjectorItem[],
  cameras: readonly AssignedCamera<PoeInput>[]
): PoePlan {
  if (!cameras.length) {
    return { skipped: injectors.map((injector) => skippedLine(injector, 'no-poe-camera')) };
  }

  const models = mergeModels(cameras);
  const source = combinedSource(injectors, createInitialPoeCalculatorState().powerSource);
  if (source.budgetWatts > MAX_POE_BUDGET_WATTS || source.ports > MAX_POE_PORTS) {
    return {
      skipped: [
        ...injectors.map((injector) => skippedLine(injector, 'injectors-over-limit')),
        ...models.map((model) => skippedModel(model, 'injectors-over-limit')),
      ],
    };
  }

  const { grouped, skipped } = fitModels(models);
  if (!grouped.length) {
    return {
      skipped: [...skipped, ...injectors.map((injector) => skippedLine(injector, 'no-poe-camera'))],
    };
  }

  const state = buildState(source, grouped);
  if (!state) {
    return {
      skipped: [
        ...skipped,
        ...injectors.map((injector) => skippedLine(injector, 'invalid-data')),
        ...grouped.map((model) => skippedModel(model, 'invalid-data')),
      ],
    };
  }
  return {
    check: {
      injectors: [...injectors],
      ...source,
      groups: grouped.map(({ sku, deviceCount }) => ({ sku, deviceCount })),
      state,
    },
    skipped,
  };
}
