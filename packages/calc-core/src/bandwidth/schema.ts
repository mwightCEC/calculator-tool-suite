import { z } from 'zod';
import { DEFAULT_CAMERA_GROUP_SETTINGS } from '../model/defaults';
import { cameraGroupSchema } from '../model/schema';
import {
  MAX_CAMERAS_PER_VIEWER,
  MAX_LINK_CAPACITY_MBPS,
  MAX_REMOTE_VIEWERS,
  OVERHEAD_PERCENTS,
  RECORDED_STREAMS,
  SUB_STREAM_RESOLUTIONS,
  UPLINK_SPEEDS_MBPS,
  VIEWING_STREAMS,
} from './options';

/**
 * A Bandwidth camera group: Storage's group fields without recording mode
 * (recorders pull streams continuously, so motion or schedule recording changes
 * disk writes, not network traffic), plus the sub-stream resolution.
 */
export const bandwidthCameraGroupSchema = cameraGroupSchema
  .omit({ recordingMode: true, motionPercent: true, scheduleHours: true })
  .extend({ subStreamResolution: z.enum(SUB_STREAM_RESOLUTIONS) });

export const remoteViewingSchema = z.object({
  /** Simultaneous remote viewers; 0 means nobody watches remotely. */
  viewers: z.int().min(0).max(MAX_REMOTE_VIEWERS),
  /** Cameras each viewer watches at once (capped at the total camera count when calculating). */
  camerasPerViewer: z.int().min(1).max(MAX_CAMERAS_PER_VIEWER),
  stream: z.enum(VIEWING_STREAMS),
});

/** Optional link capacities; null means the check is off. */
export const networkLinksSchema = z.object({
  recorderLimitMbps: z.number().positive().max(MAX_LINK_CAPACITY_MBPS).nullable(),
  uplinkMbps: z.literal(UPLINK_SPEEDS_MBPS).nullable(),
  siteUploadMbps: z.number().positive().max(MAX_LINK_CAPACITY_MBPS).nullable(),
});

export const bandwidthInputSchema = z.object({
  cameraGroups: z.array(bandwidthCameraGroupSchema).min(1),
  recordedStreams: z.enum(RECORDED_STREAMS),
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
  return {
    id,
    name,
    cameraCount,
    resolution,
    codec,
    frameRate,
    sceneComplexity,
    bitrate,
    subStreamResolution: 'd1',
  };
}

/** Defaults from the spec: main streams only, 1 viewer × 4 cameras on the sub-stream, no checks, 10%. */
export function createDefaultBandwidthInput(): BandwidthInput {
  return {
    cameraGroups: [createBandwidthCameraGroup('g1', 'Camera group 1')],
    recordedStreams: 'main',
    remoteViewing: { viewers: 1, camerasPerViewer: 4, stream: 'sub' },
    network: { recorderLimitMbps: null, uplinkMbps: null, siteUploadMbps: null },
    overheadPercent: 10,
  };
}
