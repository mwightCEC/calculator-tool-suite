import { z } from 'zod';
import { PLACEHOLDER_PROVENANCE } from '../bitrate/bitrate-model-schema';
import subStreamModelJson from '../data/sub-stream-model.json';
import type { ValueRange } from '../range';
import { SUB_STREAM_RESOLUTIONS, type SubStreamResolution } from './options';

/*
 * Per-camera sub-stream bitrate ranges, kept apart from the main bitrate model.
 * Values live in data/sub-stream-model.json; replacing them needs no code changes.
 */

const rangeEntrySchema = z
  .object({
    low: z.number().positive(),
    typical: z.number().positive(),
    high: z.number().positive(),
    /** e.g. "placeholder" or "measured: <camera>, <scene>, <date>". */
    provenance: z.string().trim().min(1),
  })
  .refine((entry) => entry.low <= entry.typical && entry.typical <= entry.high, {
    message: 'Expected low ≤ typical ≤ high',
  });

export const subStreamModelSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Use semantic versioning, e.g. 1.2.0'),
    lastUpdated: z.iso.date(),
    status: z.enum(['placeholder', 'validated']),
    notes: z.string(),
    sources: z.array(z.object({ id: z.string().min(1), description: z.string().min(1) })),
    mbpsByResolution: z.record(z.enum(SUB_STREAM_RESOLUTIONS), rangeEntrySchema),
  })
  .superRefine((model, ctx) => {
    if (model.status !== 'validated') {
      return;
    }
    for (const resolution of SUB_STREAM_RESOLUTIONS) {
      if (model.mbpsByResolution[resolution].provenance === PLACEHOLDER_PROVENANCE) {
        ctx.addIssue({
          code: 'custom',
          path: ['mbpsByResolution', resolution],
          message: 'Status is "validated" but this value is still a placeholder',
        });
      }
    }
  });

export type SubStreamModel = z.infer<typeof subStreamModelSchema>;

/** The active sub-stream model, validated when this module loads. */
export const SUB_STREAM_MODEL: SubStreamModel = subStreamModelSchema.parse(subStreamModelJson);

/** Whether sub-stream ranges come from validated data. Surface this in the UI. */
export const isSubStreamModelValidated: boolean = SUB_STREAM_MODEL.status === 'validated';

/** Per-camera sub-stream bitrate range in Mbps. */
export function subStreamBitrateRange(
  resolution: SubStreamResolution,
  model: SubStreamModel = SUB_STREAM_MODEL
): ValueRange {
  const { low, typical, high } = model.mbpsByResolution[resolution];
  return { low, typical, high };
}
