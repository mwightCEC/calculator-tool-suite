import { z } from 'zod';
import {
  BITRATE_INPUT_MAX_MBPS,
  BITRATE_INPUT_MIN_MBPS,
  CALCULATION_MODES,
  CODECS,
  DRIVE_SIZES_TB,
  FRAME_RATES,
  MOTION_PERCENT_MAX,
  MOTION_PERCENT_MIN,
  MOTION_PERCENT_STEP,
  RAID_LEVELS,
  RECORDING_MODES,
  RESERVE_PERCENTS,
  RESOLUTIONS,
  SCENE_COMPLEXITIES,
  SCHEDULE_HOURS_MAX,
  SCHEDULE_HOURS_MIN,
} from '../options';

export const MAX_CAMERAS_PER_GROUP = 1000;
export const MAX_RETENTION_DAYS = 3650;
export const MAX_DRIVE_COUNT = 1000;
export const MAX_GROUP_NAME_LENGTH = 60;

/** A bitrate the user supplies: a measured average or a configured cap. */
export const enteredBitrateMbpsSchema = z
  .number()
  .min(BITRATE_INPUT_MIN_MBPS)
  .max(BITRATE_INPUT_MAX_MBPS);

export const groupBitrateSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('estimate') }),
  z.object({ source: z.literal('known-average'), mbps: enteredBitrateMbpsSchema }),
  z.object({ source: z.literal('bitrate-cap'), mbps: enteredBitrateMbpsSchema }),
]);

export const cameraGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(MAX_GROUP_NAME_LENGTH),
  cameraCount: z.int().min(1).max(MAX_CAMERAS_PER_GROUP),
  resolution: z.enum(RESOLUTIONS),
  codec: z.enum(CODECS),
  frameRate: z.literal(FRAME_RATES),
  sceneComplexity: z.enum(SCENE_COMPLEXITIES),
  recordingMode: z.enum(RECORDING_MODES),
  /** Used when recordingMode is "motion". Kept otherwise so switching modes is lossless. */
  motionPercent: z
    .int()
    .min(MOTION_PERCENT_MIN)
    .max(MOTION_PERCENT_MAX)
    .multipleOf(MOTION_PERCENT_STEP),
  /** Used when recordingMode is "schedule". */
  scheduleHours: z.int().min(SCHEDULE_HOURS_MIN).max(SCHEDULE_HOURS_MAX),
  /** Per-camera bitrate: estimated from the model, or entered by the user. */
  bitrate: groupBitrateSchema,
});

export const storageSettingsSchema = z.object({
  /** Retention target in days (storage-needed mode). */
  retentionDays: z.int().min(1).max(MAX_RETENTION_DAYS),
  /** Drive count (days-from-capacity mode). Rounded up to a valid RAID count when calculating. */
  driveCount: z.int().min(1).max(MAX_DRIVE_COUNT),
  driveSizeTb: z.literal(DRIVE_SIZES_TB),
  raidLevel: z.enum(RAID_LEVELS),
  reservePercent: z.literal(RESERVE_PERCENTS),
});

export const storageCalculationInputSchema = z.object({
  mode: z.enum(CALCULATION_MODES),
  cameraGroups: z.array(cameraGroupSchema).min(1),
  storage: storageSettingsSchema,
});

export type GroupBitrate = z.infer<typeof groupBitrateSchema>;
export type CameraGroup = z.infer<typeof cameraGroupSchema>;
export type StorageSettings = z.infer<typeof storageSettingsSchema>;
export type StorageCalculationInput = z.infer<typeof storageCalculationInputSchema>;
