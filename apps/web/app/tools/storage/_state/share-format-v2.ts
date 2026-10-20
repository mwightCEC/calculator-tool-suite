import type {
  BitrateSource,
  CalculationMode,
  Codec,
  RaidLevel,
  RecordingMode,
  Resolution,
  SceneComplexity,
} from '@cctv/calc-core';
import { z } from 'zod';
import type { StorageCalculatorState } from './storage-calculator-state';

/*
 * Share link format v2: a compact positional JSON array instead of the full
 * state object (about 6× shorter for typical calculations).
 *
 *   [mode, storage, groups]
 *   storage = [retentionDays, driveCount, driveSizeTb, raid, reservePercent]
 *   group   = [name, cameraCount, resolution, codec, frameRate, sceneComplexity,
 *              recordingMode, motionPercent, scheduleHours, bitrateSource,
 *              bitrateMbps (0 for Estimate), colorIndex]
 *
 * Choices are stored as indexes into the tables below. Those tables ARE the
 * format: only ever append to them. Reordering or removing an entry would make
 * existing links decode to the wrong value; a change like that needs a new
 * format version. Group ids are not stored and are re-created as g1, g2, … .
 */

export const V2_MODES = [
  'storage-needed',
  'days-from-capacity',
] as const satisfies readonly CalculationMode[];
export const V2_RAID_LEVELS = [
  'none',
  'raid1',
  'raid5',
  'raid6',
  'raid10',
] as const satisfies readonly RaidLevel[];
export const V2_RESOLUTIONS = [
  '1MP',
  '2MP',
  '3MP',
  '4MP',
  '5MP',
  '6MP',
  '8MP',
  '12MP',
] as const satisfies readonly Resolution[];
export const V2_CODECS = ['h264', 'h265', 'mjpeg'] as const satisfies readonly Codec[];
export const V2_SCENE_COMPLEXITIES = [
  'low',
  'medium',
  'high',
] as const satisfies readonly SceneComplexity[];
export const V2_RECORDING_MODES = [
  'continuous',
  'motion',
  'schedule',
] as const satisfies readonly RecordingMode[];
export const V2_BITRATE_SOURCES = [
  'estimate',
  'known-average',
  'bitrate-cap',
] as const satisfies readonly BitrateSource[];

const index = z.int().nonnegative();

/** Shape check only; value ranges are validated afterwards by the state schema. */
const payloadSchema = z.tuple([
  index,
  z.tuple([z.number(), z.number(), z.number(), index, z.number()]),
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
      index,
      z.number(),
      z.number(),
    ])
  ),
]);

type Payload = z.infer<typeof payloadSchema>;

export function stateToV2Payload(state: StorageCalculatorState): Payload {
  const { storage } = state;
  return [
    V2_MODES.indexOf(state.mode),
    [
      storage.retentionDays,
      storage.driveCount,
      storage.driveSizeTb,
      V2_RAID_LEVELS.indexOf(storage.raidLevel),
      storage.reservePercent,
    ],
    state.cameraGroups.map((group) => [
      group.name,
      group.cameraCount,
      V2_RESOLUTIONS.indexOf(group.resolution),
      V2_CODECS.indexOf(group.codec),
      group.frameRate,
      V2_SCENE_COMPLEXITIES.indexOf(group.sceneComplexity),
      V2_RECORDING_MODES.indexOf(group.recordingMode),
      group.motionPercent,
      group.scheduleHours,
      V2_BITRATE_SOURCES.indexOf(group.bitrate.source),
      group.bitrate.source === 'estimate' ? 0 : group.bitrate.mbps,
      group.colorIndex,
    ]),
  ];
}

/**
 * Turns a decoded v2 payload back into a state-shaped object, or null when the
 * shape is wrong. An out-of-range index becomes undefined, so the caller's
 * storageCalculatorStateSchema check (which also covers counts, ranges and
 * limits) rejects it.
 */
export function v2PayloadToState(raw: unknown): unknown {
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const [modeIndex, storage, groups] = parsed.data;
  const [retentionDays, driveCount, driveSizeTb, raidIndex, reservePercent] = storage;

  return {
    mode: V2_MODES[modeIndex],
    storage: {
      retentionDays,
      driveCount,
      driveSizeTb,
      raidLevel: V2_RAID_LEVELS[raidIndex],
      reservePercent,
    },
    cameraGroups: groups.map((group, position) => {
      const [
        name,
        cameraCount,
        resolution,
        codec,
        frameRate,
        complexity,
        recording,
        motionPercent,
        scheduleHours,
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
        recordingMode: V2_RECORDING_MODES[recording],
        motionPercent,
        scheduleHours,
        bitrate:
          bitrateSource === 'estimate'
            ? { source: bitrateSource }
            : { source: bitrateSource, mbps },
        colorIndex,
      };
    }),
  };
}
