import type {
  BitrateSource,
  Codec,
  RecordedStreams,
  Resolution,
  SceneComplexity,
  SubStreamResolution,
  ViewingStream,
} from '@cctv/calc-core';
import { z } from 'zod';
import type { BandwidthCalculatorState } from './bandwidth-calculator-state';

/*
 * Bandwidth share link format v1: a compact positional JSON array.
 *
 *   [recordedStreams, remoteViewing, network, overheadPercent, groups]
 *   remoteViewing = [viewers, camerasPerViewer, stream]
 *   network       = [recorderLimitMbps, uplinkMbps, siteUploadMbps] (0 = check off)
 *   group         = [name, cameraCount, resolution, codec, frameRate, sceneComplexity,
 *                    subStreamResolution, bitrateSource, bitrateMbps (0 for Estimate),
 *                    colorIndex]
 *
 * Choices are stored as indexes into the tables below. Those tables ARE the
 * format: only ever append to them. Reordering or removing an entry would make
 * existing links decode to the wrong value; a change like that needs a new
 * format version. They are separate from Storage's tables so each calculator's
 * links can change on their own. Group ids are not stored and are re-created
 * as g1, g2, … .
 */

export const V1_RECORDED_STREAMS = [
  'main',
  'main-and-sub',
] as const satisfies readonly RecordedStreams[];
export const V1_VIEWING_STREAMS = ['sub', 'main'] as const satisfies readonly ViewingStream[];
export const V1_RESOLUTIONS = [
  '1MP',
  '2MP',
  '3MP',
  '4MP',
  '5MP',
  '6MP',
  '8MP',
  '12MP',
] as const satisfies readonly Resolution[];
export const V1_CODECS = ['h264', 'h265', 'mjpeg'] as const satisfies readonly Codec[];
export const V1_SCENE_COMPLEXITIES = [
  'low',
  'medium',
  'high',
] as const satisfies readonly SceneComplexity[];
export const V1_SUB_STREAM_RESOLUTIONS = [
  'd1',
  '720p',
  '1080p',
] as const satisfies readonly SubStreamResolution[];
export const V1_BITRATE_SOURCES = [
  'estimate',
  'known-average',
  'bitrate-cap',
] as const satisfies readonly BitrateSource[];

const index = z.int().nonnegative();

/** Shape check only; value ranges are validated afterwards by the state schema. */
const payloadSchema = z.tuple([
  index,
  z.tuple([z.number(), z.number(), index]),
  z.tuple([z.number(), z.number(), z.number()]),
  z.number(),
  z.array(
    z.tuple([
      z.string(),
      z.number(),
      index,
      index,
      z.number(),
      index,
      index,
      index,
      z.number(),
      z.number(),
    ])
  ),
]);

type Payload = z.infer<typeof payloadSchema>;

/** Link capacities are positive when set, so 0 stands for "check off". */
const OFF = 0;
const capacityOrOff = (mbps: number | null) => mbps ?? OFF;
const capacityOrNull = (mbps: number) => (mbps === OFF ? null : mbps);

export function stateToV1Payload(state: BandwidthCalculatorState): Payload {
  const { remoteViewing, network } = state;
  return [
    V1_RECORDED_STREAMS.indexOf(state.recordedStreams),
    [
      remoteViewing.viewers,
      remoteViewing.camerasPerViewer,
      V1_VIEWING_STREAMS.indexOf(remoteViewing.stream),
    ],
    [
      capacityOrOff(network.recorderLimitMbps),
      capacityOrOff(network.uplinkMbps),
      capacityOrOff(network.siteUploadMbps),
    ],
    state.overheadPercent,
    state.cameraGroups.map((group) => [
      group.name,
      group.cameraCount,
      V1_RESOLUTIONS.indexOf(group.resolution),
      V1_CODECS.indexOf(group.codec),
      group.frameRate,
      V1_SCENE_COMPLEXITIES.indexOf(group.sceneComplexity),
      V1_SUB_STREAM_RESOLUTIONS.indexOf(group.subStreamResolution),
      V1_BITRATE_SOURCES.indexOf(group.bitrate.source),
      group.bitrate.source === 'estimate' ? 0 : group.bitrate.mbps,
      group.colorIndex,
    ]),
  ];
}

/**
 * Turns a decoded v1 payload back into a state-shaped object, or null when the
 * shape is wrong. An out-of-range index becomes undefined, so the caller's
 * bandwidthCalculatorStateSchema check (which also covers counts, ranges and
 * limits) rejects it.
 */
export function v1PayloadToState(raw: unknown): unknown {
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const [recordedIndex, remoteViewing, network, overheadPercent, groups] = parsed.data;
  const [viewers, camerasPerViewer, streamIndex] = remoteViewing;
  const [recorderLimitMbps, uplinkMbps, siteUploadMbps] = network;

  return {
    recordedStreams: V1_RECORDED_STREAMS[recordedIndex],
    remoteViewing: { viewers, camerasPerViewer, stream: V1_VIEWING_STREAMS[streamIndex] },
    network: {
      recorderLimitMbps: capacityOrNull(recorderLimitMbps),
      uplinkMbps: capacityOrNull(uplinkMbps),
      siteUploadMbps: capacityOrNull(siteUploadMbps),
    },
    overheadPercent,
    cameraGroups: groups.map((group, position) => {
      const [
        name,
        cameraCount,
        resolution,
        codec,
        frameRate,
        complexity,
        subStream,
        source,
        mbps,
        colorIndex,
      ] = group;
      const bitrateSource = V1_BITRATE_SOURCES[source];
      return {
        id: `g${position + 1}`,
        name,
        cameraCount,
        resolution: V1_RESOLUTIONS[resolution],
        codec: V1_CODECS[codec],
        frameRate,
        sceneComplexity: V1_SCENE_COMPLEXITIES[complexity],
        subStreamResolution: V1_SUB_STREAM_RESOLUTIONS[subStream],
        bitrate:
          bitrateSource === 'estimate'
            ? { source: bitrateSource }
            : { source: bitrateSource, mbps },
        colorIndex,
      };
    }),
  };
}
