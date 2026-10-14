import { z } from 'zod';
import { CODECS, RESOLUTIONS } from '../options';

/*
 * Camera model records for presets. Calculator-agnostic: the same record feeds
 * storage (codec, frame rate, bitrate), bandwidth (bitrate, network speed),
 * PoE budget (power) and lens/FOV (lens, field of view).
 *
 * IMPORTANT: spec sheets publish the CONFIGURABLE main-stream bitrate range
 * (e.g. 512–15,000 kbps). That range must never be used as a typical bitrate:
 * the max wildly overestimates storage and the min underestimates it. Typical
 * bitrates come only from engineering default stream settings or measured
 * averages, and stay null until supplied.
 */

/** An inclusive numeric range, e.g. a zoom lens's focal lengths. */
const minMaxSchema = z
  .object({ min: z.number().nonnegative(), max: z.number().nonnegative() })
  .refine((range) => range.min <= range.max, { message: 'min must not exceed max' });

const typicalBitrateSchema = z.object({
  codec: z.enum(CODECS),
  mbps: z.number().positive(),
  /** e.g. "engineering: factory default main stream" or "measured: busy lobby, 2026-11-02". */
  provenance: z.string().trim().min(1),
});

export const cameraModelSchema = z.object({
  manufacturer: z.string().trim().min(1),
  modelNumber: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  productUrl: z.url(),

  mainStream: z.object({
    widthPx: z.int().positive(),
    heightPx: z.int().positive(),
    /** Resolution tier used by the calculators. */
    resolution: z.enum(RESOLUTIONS),
  }),
  supportedCodecs: z.array(z.enum(CODECS)).min(1),
  maxFrameRate: z.int().positive(),
  /** As named by the manufacturer, e.g. "CBR", "VBR", "VBR+". */
  rateControlModes: z.array(z.string().trim().min(1)),
  /** Configurable main-stream range from the spec sheet. NOT a typical bitrate. */
  mainStreamBitrateKbps: minMaxSchema,
  /** Typical bitrate per codec, or null until engineering or measured data is supplied. */
  typicalBitrate: z.array(typicalBitrateSchema).min(1).nullable(),

  power: z.object({
    /** e.g. "IEEE 802.3af". */
    poeStandard: z.string().trim().min(1),
    poeClass: z.int().min(0).max(8).nullable(),
    watts: z.object({
      day: z.number().positive().nullable(),
      night: z.number().positive().nullable(),
      max: z.number().positive(),
    }),
  }),

  lens: z.object({
    /** Equal min and max for a fixed lens. */
    focalLengthMm: minMaxSchema,
    /** Widest aperture as an f-number, e.g. 1.4 for f/1.4. */
    maxApertureFNumber: z.number().positive(),
  }),
  /** Degrees; min is at the telephoto end, max at the wide end. Null when not published. */
  fieldOfViewDeg: z.object({
    horizontal: minMaxSchema,
    vertical: minMaxSchema.nullable(),
    diagonal: minMaxSchema.nullable(),
  }),

  networkPortMbps: z.int().positive(),
});

export type CameraModel = z.infer<typeof cameraModelSchema>;

/** Highest bitrate a user may enter for this camera's main stream, in Mbps. */
export function maxMainStreamBitrateMbps(camera: CameraModel): number {
  return camera.mainStreamBitrateKbps.max / 1000;
}

/** Typical bitrate for a codec, or null when no engineering/measured data exists. */
export function typicalBitrateMbpsFor(
  camera: CameraModel,
  codec: CameraModel['supportedCodecs'][number]
): number | null {
  return camera.typicalBitrate?.find((entry) => entry.codec === codec)?.mbps ?? null;
}
