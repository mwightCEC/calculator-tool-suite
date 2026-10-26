import { z } from 'zod';
import { MAX_CAMERAS_PER_GROUP, MAX_GROUP_NAME_LENGTH } from '../model/schema';
import {
  CABLE_LENGTH_UNITS,
  MAX_CABLE_LENGTH,
  MAX_DEVICE_WATTS,
  MAX_POE_BUDGET_WATTS,
  MAX_POE_PORTS,
  MIN_DEVICE_WATTS,
  MIN_POE_BUDGET_WATTS,
  POE_CLASSES,
  POE_RESERVE_PERCENTS,
  PORT_STANDARDS,
  type PoeClass,
} from './options';

/** Class offered when a group switches to "by PoE class". */
export const DEFAULT_POE_CLASS: PoeClass = 3;
/** Draw offered when a group switches to "by watts". */
export const DEFAULT_DEVICE_WATTS = 6;

/** A group's power per device: its PoE class, or the datasheet's maximum draw. */
export const devicePowerSchema = z.discriminatedUnion('input', [
  z.object({ input: z.literal('class'), poeClass: z.literal(POE_CLASSES) }),
  z.object({
    input: z.literal('watts'),
    watts: z.number().min(MIN_DEVICE_WATTS).max(MAX_DEVICE_WATTS),
  }),
]);

export const poeDeviceGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(MAX_GROUP_NAME_LENGTH),
  deviceCount: z.int().min(1).max(MAX_CAMERAS_PER_GROUP),
  power: devicePowerSchema,
  /** Longest cable run in the group, in the input's length unit; null = not given (100 m assumed). */
  cableLength: z.number().positive().max(MAX_CABLE_LENGTH).nullable(),
});

/** The switch, or an NVR with built-in PoE ports. */
export const poeSwitchSchema = z.object({
  budgetWatts: z.number().min(MIN_POE_BUDGET_WATTS).max(MAX_POE_BUDGET_WATTS),
  ports: z.int().min(1).max(MAX_POE_PORTS),
  portStandard: z.enum(PORT_STANDARDS),
  reservePercent: z.literal(POE_RESERVE_PERCENTS),
});

export const poeInputSchema = z.object({
  powerSource: poeSwitchSchema,
  deviceGroups: z.array(poeDeviceGroupSchema).min(1),
  cableLengthUnit: z.enum(CABLE_LENGTH_UNITS),
});

export type DevicePower = z.infer<typeof devicePowerSchema>;
export type PoeDeviceGroup = z.infer<typeof poeDeviceGroupSchema>;
export type PoeSwitch = z.infer<typeof poeSwitchSchema>;
export type PoeInput = z.infer<typeof poeInputSchema>;

export function createPoeDeviceGroup(id: string, name: string): PoeDeviceGroup {
  return {
    id,
    name,
    deviceCount: 4,
    power: { input: 'watts', watts: DEFAULT_DEVICE_WATTS },
    cableLength: null,
  };
}

/** Defaults from the spec: a 120 W, 8-port PoE+ switch with a 20% reserve; 4 cameras at 6 W; feet. */
export function createDefaultPoeInput(): PoeInput {
  return {
    powerSource: { budgetWatts: 120, ports: 8, portStandard: 'at', reservePercent: 20 },
    deviceGroups: [createPoeDeviceGroup('g1', 'Camera group 1')],
    cableLengthUnit: 'ft',
  };
}
