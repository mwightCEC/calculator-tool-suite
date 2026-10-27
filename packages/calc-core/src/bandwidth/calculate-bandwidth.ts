import type { BitrateModel } from '../bitrate/bitrate-model-schema';
import { cameraBitrateRange } from '../bitrate/group-bitrate';
import type { BitrateSource } from '../options';
import { pointRange, scaleRange, sumRanges, type ValueRange } from '../range';
import { checkLink, type LinkCheck } from './link-checks';
import type { BandwidthCameraGroup, BandwidthInput, RemoteViewing } from './schema';

export interface BandwidthModels {
  bitrateModel?: BitrateModel;
}

export interface BandwidthGroupUsage {
  groupId: string;
  bitrateSource: BitrateSource;
  perCameraMbps: ValueRange;
  /** All cameras in the group, before overhead. */
  totalMbps: ValueRange;
}

export interface RemoteViewingUsage {
  /** Cameras each remote viewer actually watches (capped at the total camera count). */
  viewedCamerasPerViewer: number;
  /** Per-camera rate used for remote viewing, before overhead. */
  perCameraMbps: ValueRange;
  /** Bandwidth for all remote viewers, with overhead. */
  totalMbps: ValueRange;
}

export interface BandwidthResult {
  groups: BandwidthGroupUsage[];
  totalCameras: number;
  /** True when any camera group's bitrate comes from the estimate. */
  isEstimated: boolean;
  /** Sum of all camera streams, before overhead. */
  streamsMbps: ValueRange;
  /** Average bitrate per camera, weighted by camera count, before overhead. */
  averagePerCameraMbps: ValueRange;
  /** The bandwidth estimate: all camera traffic on the local network, with overhead. */
  bandwidthMbps: ValueRange;
  /** Null when remote viewing is off. */
  remoteViewing: RemoteViewingUsage | null;
  /** One check per link the user entered, in a fixed order. */
  linkChecks: LinkCheck[];
}

function groupUsage(group: BandwidthCameraGroup, models: BandwidthModels): BandwidthGroupUsage {
  const perCameraMbps = cameraBitrateRange(group, models.bitrateModel);
  return {
    groupId: group.id,
    bitrateSource: group.bitrate.source,
    perCameraMbps,
    totalMbps: scaleRange(perCameraMbps, group.cameraCount),
  };
}

function remoteViewingUsage(
  viewing: RemoteViewing,
  averagePerCameraMbps: ValueRange,
  totalCameras: number,
  overheadFactor: number
): RemoteViewingUsage | null {
  if (!viewing.enabled) {
    return null;
  }
  const viewedCamerasPerViewer = Math.min(viewing.camerasPerViewer, totalCameras);
  const perCameraMbps =
    viewing.bitrateSource === 'custom' ? pointRange(viewing.customMbps) : averagePerCameraMbps;
  return {
    viewedCamerasPerViewer,
    perCameraMbps,
    totalMbps: scaleRange(perCameraMbps, viewing.viewers * viewedCamerasPerViewer * overheadFactor),
  };
}

function linkChecks(
  input: BandwidthInput,
  bandwidth: ValueRange,
  remoteViewing: RemoteViewingUsage | null
): LinkCheck[] {
  const { uplinkMbps } = input.network;
  const { siteUploadMbps } = input.remoteViewing;
  const checks: LinkCheck[] = [];
  if (uplinkMbps !== null) {
    checks.push(checkLink('uplink', uplinkMbps, bandwidth));
  }
  if (remoteViewing && siteUploadMbps !== null) {
    checks.push(checkLink('site-upload', siteUploadMbps, remoteViewing.totalMbps));
  }
  return checks;
}

/**
 * Peak network traffic for a CCTV system, and how it fits the links entered.
 * Expects input that has passed `bandwidthInputSchema`. Bitrates are ranges;
 * link checks use the high estimate.
 */
export function calculateBandwidth(
  input: BandwidthInput,
  models: BandwidthModels = {}
): BandwidthResult {
  const groups = input.cameraGroups.map((group) => groupUsage(group, models));
  const totalCameras = input.cameraGroups.reduce((sum, group) => sum + group.cameraCount, 0);
  const overheadFactor = 1 + input.overheadPercent / 100;

  const streamsMbps = sumRanges(groups.map((group) => group.totalMbps));
  const averagePerCameraMbps = scaleRange(streamsMbps, 1 / totalCameras);
  const bandwidthMbps = scaleRange(streamsMbps, overheadFactor);
  const remoteViewing = remoteViewingUsage(
    input.remoteViewing,
    averagePerCameraMbps,
    totalCameras,
    overheadFactor
  );

  return {
    groups,
    totalCameras,
    isEstimated: groups.some((group) => group.bitrateSource === 'estimate'),
    streamsMbps,
    averagePerCameraMbps,
    bandwidthMbps,
    remoteViewing,
    linkChecks: linkChecks(input, bandwidthMbps, remoteViewing),
  };
}
