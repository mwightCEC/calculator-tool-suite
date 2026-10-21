import type { BitrateModel } from '../bitrate/bitrate-model-schema';
import { cameraBitrateRange } from '../bitrate/group-bitrate';
import type { BitrateSource } from '../options';
import { pointRange, scaleRange, sumRanges, type ValueRange } from '../range';
import { checkLink, type LinkCheck } from './link-checks';
import type { ViewingStream } from './options';
import type { BandwidthCameraGroup, BandwidthInput } from './schema';
import { subStreamBitrateRange, type SubStreamModel } from './sub-stream-model';

export interface BandwidthModels {
  bitrateModel?: BitrateModel;
  subStreamModel?: SubStreamModel;
}

export interface BandwidthGroupUsage {
  groupId: string;
  /** Source of the main-stream bitrate. Sub-streams always use the placeholder ranges. */
  bitrateSource: BitrateSource;
  mainPerCameraMbps: ValueRange;
  subPerCameraMbps: ValueRange;
  /** All cameras in the group, before overhead. */
  mainTotalMbps: ValueRange;
  subTotalMbps: ValueRange;
}

export interface BandwidthResult {
  groups: BandwidthGroupUsage[];
  totalCameras: number;
  /** True when any traffic that counts comes from an estimate or the sub-stream placeholders. */
  isEstimated: boolean;
  /** Sum of all main streams, before overhead. */
  mainTotalMbps: ValueRange;
  /** Sum of all sub-streams, before overhead (counted in ingest only when recorded). */
  subTotalMbps: ValueRange;
  /** Average main-stream bitrate per camera, before overhead. */
  averageMainPerCameraMbps: ValueRange;
  /** Traffic the recorder receives on the local network, with overhead. */
  ingestMbps: ValueRange;
  /** Cameras each remote viewer actually watches (capped at the total camera count). */
  viewedCamerasPerViewer: number;
  /** Per-camera rate used for remote viewing (busiest group's), or null with no viewers. */
  viewingPerCameraMbps: ValueRange | null;
  /** Upload from the site for remote viewing, with overhead. */
  viewingUploadMbps: ValueRange;
  /** One check per link the user entered, in a fixed order. */
  linkChecks: LinkCheck[];
}

function groupUsage(group: BandwidthCameraGroup, models: BandwidthModels): BandwidthGroupUsage {
  const mainPerCameraMbps = cameraBitrateRange(group, models.bitrateModel);
  const subPerCameraMbps = subStreamBitrateRange(group.subStreamResolution, models.subStreamModel);
  return {
    groupId: group.id,
    bitrateSource: group.bitrate.source,
    mainPerCameraMbps,
    subPerCameraMbps,
    mainTotalMbps: scaleRange(mainPerCameraMbps, group.cameraCount),
    subTotalMbps: scaleRange(subPerCameraMbps, group.cameraCount),
  };
}

/** The busiest group's per-camera rate for a stream (highest high estimate), keeping viewing conservative. */
function busiestPerCameraRate(groups: BandwidthGroupUsage[], stream: ViewingStream): ValueRange {
  const rates = groups.map((group) =>
    stream === 'main' ? group.mainPerCameraMbps : group.subPerCameraMbps
  );
  return rates.reduce((busiest, rate) => (rate.high > busiest.high ? rate : busiest));
}

function linkChecks(input: BandwidthInput, ingest: ValueRange, upload: ValueRange): LinkCheck[] {
  const { recorderLimitMbps, uplinkMbps, siteUploadMbps } = input.network;
  const checks: LinkCheck[] = [];
  if (recorderLimitMbps !== null) {
    checks.push(checkLink('recorder-limit', recorderLimitMbps, ingest));
  }
  if (uplinkMbps !== null) {
    checks.push(checkLink('uplink', uplinkMbps, ingest));
  }
  if (siteUploadMbps !== null) {
    checks.push(checkLink('site-upload', siteUploadMbps, upload));
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
  const recordsSub = input.recordedStreams === 'main-and-sub';
  const { viewers, camerasPerViewer, stream } = input.remoteViewing;

  const mainTotalMbps = sumRanges(groups.map((group) => group.mainTotalMbps));
  const subTotalMbps = sumRanges(groups.map((group) => group.subTotalMbps));
  const recordedMbps = recordsSub ? sumRanges([mainTotalMbps, subTotalMbps]) : mainTotalMbps;
  const ingestMbps = scaleRange(recordedMbps, overheadFactor);

  const viewedCamerasPerViewer = Math.min(camerasPerViewer, totalCameras);
  const viewingPerCameraMbps = viewers > 0 ? busiestPerCameraRate(groups, stream) : null;
  const viewingUploadMbps = viewingPerCameraMbps
    ? scaleRange(viewingPerCameraMbps, viewers * viewedCamerasPerViewer * overheadFactor)
    : pointRange(0);

  const mainEstimated = groups.some((group) => group.bitrateSource === 'estimate');
  const subStreamsCount = recordsSub || (viewers > 0 && stream === 'sub');

  return {
    groups,
    totalCameras,
    isEstimated: mainEstimated || subStreamsCount,
    mainTotalMbps,
    subTotalMbps,
    averageMainPerCameraMbps: scaleRange(mainTotalMbps, 1 / totalCameras),
    ingestMbps,
    viewedCamerasPerViewer,
    viewingPerCameraMbps,
    viewingUploadMbps,
    linkChecks: linkChecks(input, ingestMbps, viewingUploadMbps),
  };
}
