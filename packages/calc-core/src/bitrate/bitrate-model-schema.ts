import { z } from 'zod';
import { CODECS, FRAME_RATES, RESOLUTIONS, SCENE_COMPLEXITIES } from '../options';

/** Provenance value marking a coefficient that has not been validated. */
export const PLACEHOLDER_PROVENANCE = 'placeholder';

/** One coefficient plus where it came from, e.g. "measured: <model>, <scene>, <date>". */
const coefficientSchema = z.object({
  value: z.number().positive(),
  provenance: z.string().trim().min(1),
});

/** Fractional half-width of the uncertainty band, e.g. 0.3 for ±30%. */
const bandSchema = coefficientSchema.extend({
  value: z.number().min(0).lt(1),
});

export const bitrateModelSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Use semantic versioning, e.g. 1.2.0'),
    lastUpdated: z.iso.date(),
    status: z.enum(['placeholder', 'validated']),
    notes: z.string(),
    sources: z.array(z.object({ id: z.string().min(1), description: z.string().min(1) })),
    /** The point at which baselineMbps is defined. */
    reference: z.object({
      codec: z.enum(CODECS),
      frameRate: z.literal(FRAME_RATES),
      sceneComplexity: z.enum(SCENE_COMPLEXITIES),
    }),
    baselineMbps: z.record(z.enum(RESOLUTIONS), coefficientSchema),
    codecMultipliers: z.record(z.enum(CODECS), coefficientSchema),
    frameRateScaling: z.object({ exponent: coefficientSchema }),
    sceneComplexityMultipliers: z.record(z.enum(SCENE_COMPLEXITIES), coefficientSchema),
    uncertaintyBand: z.object({
      default: bandSchema,
      bySceneComplexity: z.partialRecord(z.enum(SCENE_COMPLEXITIES), bandSchema),
    }),
    /** Reserved for a future night/IR adjustment; unused today. */
    nightIrMultiplier: coefficientSchema.nullable(),
  })
  .superRefine((model, ctx) => {
    if (model.status !== 'validated') {
      return;
    }
    for (const path of findPlaceholderValues(model)) {
      ctx.addIssue({
        code: 'custom',
        path: path.split('.'),
        message: 'Status is "validated" but this value is still a placeholder',
      });
    }
  });

export type BitrateModel = z.infer<typeof bitrateModelSchema>;

interface Coefficient {
  value: number;
  provenance: string;
}

function isCoefficient(node: unknown): node is Coefficient {
  return typeof node === 'object' && node !== null && 'value' in node && 'provenance' in node;
}

/** Dotted paths of every coefficient whose provenance is still "placeholder". */
export function findPlaceholderValues(node: unknown, path: string[] = []): string[] {
  if (isCoefficient(node)) {
    return node.provenance === PLACEHOLDER_PROVENANCE ? [path.join('.')] : [];
  }
  if (typeof node !== 'object' || node === null) {
    return [];
  }
  return Object.entries(node).flatMap(([key, child]) =>
    findPlaceholderValues(child, [...path, key])
  );
}
