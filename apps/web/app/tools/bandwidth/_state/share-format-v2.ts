import type {
  BitrateSource,
  Codec,
  Resolution,
  SceneComplexity,
  ViewingBitrateSource,
} from '@cctv/calc-core';
import { z } from 'zod';
import type { BandwidthCalculatorState } from './bandwidth-calculator-state';

/*
 * Bandwidth share link format v2: a compact positional JSON array.
 *
 *   [remoteViewing, network, overheadPercent, groups, retiredInputMode?]
 *   remoteViewing = [enabled (0/1), viewers, camerasPerViewer, bitrateSource, customMbps,
 *                    siteUploadMbps (0 = check off)]
 *   network       = [uplinkMbps (0 = check off)]
 *   group         = [name, cameraCount, resolution, codec, frameRate, sceneComplexity,
 *                    bitrateSource, bitrateMbps (0 for Estimate), colorIndex]
 *
 * Choices are stored as indexes into the tables below. Those tables ARE the
 * format: only ever append to them. Reordering or removing an entry would make
 * existing links decode to the wrong value; a change like that needs a new
 * format version. They are separate from Storage's tables so each calculator's
 * links can change on their own. Group ids are not stored and are re-created
 * as g1, g2, … .
 *
 * The last item was the Simple / Advanced input mode (0 Advanced, 1 Simple), which
 * Bandwidth no longer has. Links that carry it still open with every group and
 * setting they hold; it is read and ignored, and new links leave it out.
 *
 * v2 replaced v1 when sub-streams, recorded streams and the recorder limit were
 * removed; v1 links are no longer read.
 */

export const V2_VIEWING_BITRATE_SOURCES = [
  'camera',
  'custom',
] as const satisfies readonly ViewingBitrateSource[];
export const V2_RESOLUTIONS = [
  '1MP',
  '2MP',
  '3MP',
  '4MP',
  '5MP',
  '6MP',
  '8MP',
  '12MP',
  'nHD',
  '960H',
] as const satisfies readonly Resolution[];
export const V2_CODECS = ['h264', 'h265', 'mjpeg'] as const satisfies readonly Codec[];
export const V2_SCENE_COMPLEXITIES = [
  'low',
  'medium',
  'high',
] as const satisfies readonly SceneComplexity[];
export const V2_BITRATE_SOURCES = [
  'estimate',
  'known-average',
  'bitrate-cap',
] as const satisfies readonly BitrateSource[];

const index = z.int().nonnegative();

/** Shape check only; value ranges are validated afterwards by the state schema. */
const payloadSchema = z.tuple([
  z.tuple([index, z.number(), z.number(), index, z.number(), z.number()]),
  z.tuple([z.number()]),
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
      z.number(),
      z.number(),
    ])
  ),
  // Retired input mode, ignored.
  index.optional(),
]);

type Payload = z.infer<typeof payloadSchema>;

/** Link capacities are positive when set, so 0 stands for "check off". */
const OFF = 0;
const capacityOrOff = (mbps: number | null) => mbps ?? OFF;
const capacityOrNull = (mbps: number) => (mbps === OFF ? null : mbps);

export function stateToV2Payload(state: BandwidthCalculatorState): Payload {
  const { remoteViewing, network } = state;
  return [
    [
      remoteViewing.enabled ? 1 : 0,
      remoteViewing.viewers,
      remoteViewing.camerasPerViewer,
      V2_VIEWING_BITRATE_SOURCES.indexOf(remoteViewing.bitrateSource),
      remoteViewing.customMbps,
      capacityOrOff(remoteViewing.siteUploadMbps),
    ],
    [capacityOrOff(network.uplinkMbps)],
    state.overheadPercent,
    state.cameraGroups.map((group) => [
      group.name,
      group.cameraCount,
      V2_RESOLUTIONS.indexOf(group.resolution),
      V2_CODECS.indexOf(group.codec),
      group.frameRate,
      V2_SCENE_COMPLEXITIES.indexOf(group.sceneComplexity),
      V2_BITRATE_SOURCES.indexOf(group.bitrate.source),
      group.bitrate.source === 'estimate' ? 0 : group.bitrate.mbps,
      group.colorIndex,
    ]),
  ];
}

/** Only 0 and 1 are valid; anything else becomes undefined so the schema check rejects it. */
const flagToBoolean = (flag: number) => [false, true][flag];

/**
 * Turns a decoded v2 payload back into a state-shaped object, or null when the
 * shape is wrong. An out-of-range index becomes undefined, so the caller's
 * bandwidthCalculatorStateSchema check (which also covers counts, ranges and
 * limits) rejects it.
 */
export function v2PayloadToState(raw: unknown): unknown {
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const [remoteViewing, network, overheadPercent, groups] = parsed.data;
  const [enabled, viewers, camerasPerViewer, sourceIndex, customMbps, siteUploadMbps] =
    remoteViewing;
  const [uplinkMbps] = network;

  return {
    remoteViewing: {
      enabled: flagToBoolean(enabled),
      viewers,
      camerasPerViewer,
      bitrateSource: V2_VIEWING_BITRATE_SOURCES[sourceIndex],
      customMbps,
      siteUploadMbps: capacityOrNull(siteUploadMbps),
    },
    network: { uplinkMbps: capacityOrNull(uplinkMbps) },
    overheadPercent,
    cameraGroups: groups.map((group, position) => {
      const [
        name,
        cameraCount,
        resolution,
        codec,
        frameRate,
        complexity,
        source,
        mbps,
        colorIndex,
      ] = group;
      const bitrateSource = V2_BITRATE_SOURCES[source];
      return {
        id: `g${position + 1}`,
        name,
        cameraCount,
        resolution: V2_RESOLUTIONS[resolution],
        codec: V2_CODECS[codec],
        frameRate,
        sceneComplexity: V2_SCENE_COMPLEXITIES[complexity],
        bitrate:
          bitrateSource === 'estimate'
            ? { source: bitrateSource }
            : { source: bitrateSource, mbps },
        colorIndex,
      };
    }),
  };
}
