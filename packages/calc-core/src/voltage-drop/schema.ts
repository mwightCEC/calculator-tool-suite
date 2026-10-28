import { z } from 'zod';
import { MAX_CAMERAS_PER_GROUP, MAX_GROUP_NAME_LENGTH } from '../model/schema';
import { CABLE_LENGTH_UNITS } from '../poe/options';
import {
  DROP_LIMIT_PERCENTS,
  MAX_LOAD_AMPS,
  MAX_LOAD_WATTS,
  MAX_RUN_LENGTH,
  MAX_SUPPLY_AMPS,
  MAX_SUPPLY_VOLTS,
  MIN_LOAD_AMPS,
  MIN_LOAD_WATTS,
  MIN_SUPPLY_VOLTS,
  SUPPLY_KINDS,
  SUPPLY_RESERVE_PERCENTS,
  WIRE_GAUGES,
  WIRE_SYSTEMS,
} from './options';
import { wireGaugeSpec } from './wire-gauges';

/** Current offered when a group switches to "by amps". */
export const DEFAULT_LOAD_AMPS = 0.5;
/** Power offered when a group switches to "by watts". */
export const DEFAULT_LOAD_WATTS = 6;

/** A device's load: datasheet current (constant current) or power (constant power). */
export const deviceLoadSchema = z.discriminatedUnion('input', [
  z.object({ input: z.literal('amps'), amps: z.number().min(MIN_LOAD_AMPS).max(MAX_LOAD_AMPS) }),
  z.object({
    input: z.literal('watts'),
    watts: z.number().min(MIN_LOAD_WATTS).max(MAX_LOAD_WATTS),
  }),
]);

/** Devices that each have their own cable back to the supply (home runs). */
export const voltageDropGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(MAX_GROUP_NAME_LENGTH),
  deviceCount: z.int().min(1).max(MAX_CAMERAS_PER_GROUP),
  load: deviceLoadSchema,
  gauge: z.enum(WIRE_GAUGES),
  /** Longest run in the group, in the input's length unit. */
  cableLength: z.number().positive().max(MAX_RUN_LENGTH),
});

export const powerSupplySchema = z.object({
  kind: z.enum(SUPPLY_KINDS),
  /** Output voltage: DC, or RMS for AC. */
  volts: z.number().min(MIN_SUPPLY_VOLTS).max(MAX_SUPPLY_VOLTS),
  /** Rated output current; for an AC transformer, its VA ÷ volts. */
  ratedAmps: z.number().positive().max(MAX_SUPPLY_AMPS),
  reservePercent: z.literal(SUPPLY_RESERVE_PERCENTS),
});

export const voltageDropInputSchema = z
  .object({
    powerSupply: powerSupplySchema,
    deviceGroups: z.array(voltageDropGroupSchema).min(1),
    dropLimitPercent: z.literal(DROP_LIMIT_PERCENTS),
    wireSystem: z.enum(WIRE_SYSTEMS),
    cableLengthUnit: z.enum(CABLE_LENGTH_UNITS),
  })
  .refine(
    (input) =>
      input.deviceGroups.every((group) => wireGaugeSpec(group.gauge).system === input.wireSystem),
    { message: 'Every group must use a wire size from the chosen system', path: ['deviceGroups'] }
  );

export type DeviceLoad = z.infer<typeof deviceLoadSchema>;
export type VoltageDropGroup = z.infer<typeof voltageDropGroupSchema>;
export type PowerSupply = z.infer<typeof powerSupplySchema>;
export type VoltageDropInput = z.infer<typeof voltageDropInputSchema>;

export function createVoltageDropGroup(id: string, name: string): VoltageDropGroup {
  return {
    id,
    name,
    deviceCount: 4,
    load: { input: 'amps', amps: DEFAULT_LOAD_AMPS },
    gauge: 'awg-18',
    cableLength: 100,
  };
}

/** Defaults: a 12 V DC, 5 A supply with a 20% reserve; 4 cameras at 0.5 A on 100 ft of 18 AWG; 10% limit. */
export function createDefaultVoltageDropInput(): VoltageDropInput {
  return {
    powerSupply: { kind: 'dc', volts: 12, ratedAmps: 5, reservePercent: 20 },
    deviceGroups: [createVoltageDropGroup('g1', 'Camera group 1')],
    dropLimitPercent: 10,
    wireSystem: 'awg',
    cableLengthUnit: 'ft',
  };
}
