import { z } from 'zod';
import { DEFAULT_CAMERA_GROUP_SETTINGS } from '../model/defaults';
import { cameraGroupSchema, enteredBitrateMbpsSchema } from '../model/schema';
import {
  MAX_CAMERAS_PER_VIEWER,
  MAX_LINK_CAPACITY_MBPS,
  MAX_REMOTE_VIEWERS,
  OVERHEAD_PERCENTS,
  UPLINK_SPEEDS_MBPS,
  VIEWING_BITRATE_SOURCES,
} from './options';

/**
 * A Bandwidth camera group: Storage's group fields without recording mode
 * (cameras stream continuously, so motion or schedule recording changes disk
 * writes, not network traffic).
 */
export const bandwidthCameraGroupSchema = cameraGroupSchema.omit({
  recordingMode: true,
  motionPercent: true,
  scheduleHours: true,
});

export const remoteViewingSchema = z.object({
  /** Off means nobody watches remotely: no remote viewing figure and no site upload check. */
  enabled: z.boolean(),
  /** Simultaneous remote viewers. */
  viewers: z.int().min(1).max(MAX_REMOTE_VIEWERS),
  /** Cameras each viewer watches at once (capped at the total camera count when calculating). */
  camerasPerViewer: z.int().min(1).max(MAX_CAMERAS_PER_VIEWER),
  bitrateSource: z.enum(VIEWING_BITRATE_SOURCES),
  /** Per-camera rate for the custom source; kept while Camera bitrate is selected. */
  customMbps: enteredBitrateMbpsSchema,
  /** The site's internet upload speed; null means the check is off. */
  siteUploadMbps: z.number().positive().max(MAX_LINK_CAPACITY_MBPS).nullable(),
});

/** Optional link capacities; null means the check is off. */
export const networkLinksSchema = z.object({
  uplinkMbps: z.literal(UPLINK_SPEEDS_MBPS).nullable(),
});

export const bandwidthInputSchema = z.object({
  cameraGroups: z.array(bandwidthCameraGroupSchema).min(1),
  remoteViewing: remoteViewingSchema,
  network: networkLinksSchema,
  overheadPercent: z.literal(OVERHEAD_PERCENTS),
});

export type BandwidthCameraGroup = z.infer<typeof bandwidthCameraGroupSchema>;
export type RemoteViewing = z.infer<typeof remoteViewingSchema>;
export type NetworkLinks = z.infer<typeof networkLinksSchema>;
export type BandwidthInput = z.infer<typeof bandwidthInputSchema>;

export function createBandwidthCameraGroup(id: string, name: string): BandwidthCameraGroup {
  const { cameraCount, resolution, codec, frameRate, sceneComplexity, bitrate } =
    DEFAULT_CAMERA_GROUP_SETTINGS;
  return { id, name, cameraCount, resolution, codec, frameRate, sceneComplexity, bitrate };
}

/** Defaults: remote viewing off (1 viewer × 4 cameras at the camera bitrate when on), no checks, 10%. */
export function createDefaultBandwidthInput(): BandwidthInput {
  return {
    cameraGroups: [createBandwidthCameraGroup('g1', 'Camera group 1')],
    remoteViewing: {
      enabled: false,
      viewers: 1,
      camerasPerViewer: 4,
      bitrateSource: 'camera',
      customMbps: 2,
      siteUploadMbps: null,
    },
    network: { uplinkMbps: null },
    overheadPercent: 10,
  };
}
