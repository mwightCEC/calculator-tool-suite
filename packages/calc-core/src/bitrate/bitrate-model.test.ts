import { describe, expect, it } from 'vitest';
import bitrateModelJson from '../data/bitrate-model.json';
import { BITRATE_MODEL, isBitrateModelValidated } from './bitrate-model';
import {
  bitrateModelSchema,
  findPlaceholderValues,
  PLACEHOLDER_PROVENANCE,
  type BitrateModel,
} from './bitrate-model-schema';

/** A deep copy of the shipped data, so tests can modify it safely. */
function shippedModel(): BitrateModel {
  return structuredClone(BITRATE_MODEL);
}

function markEveryValueMeasured(model: BitrateModel): BitrateModel {
  const measured = JSON.parse(
    JSON.stringify(model).replaceAll(
      `"provenance":"${PLACEHOLDER_PROVENANCE}"`,
      '"provenance":"measured: test fixture"'
    )
  ) as BitrateModel;
  return { ...measured, status: 'validated' };
}

describe('shipped bitrate-model.json', () => {
  it('passes schema validation', () => {
    expect(bitrateModelSchema.safeParse(bitrateModelJson).success).toBe(true);
  });

  it('has no placeholder values if its status is "validated"', () => {
    const placeholdersWhileValidated =
      BITRATE_MODEL.status === 'validated' ? findPlaceholderValues(BITRATE_MODEL) : [];
    expect(placeholdersWhileValidated).toEqual([]);
  });

  it('reports its validation status', () => {
    expect(isBitrateModelValidated).toBe(BITRATE_MODEL.status === 'validated');
  });

  it('defines the baseline at H.264, 30 fps, medium complexity', () => {
    expect(BITRATE_MODEL.reference).toEqual({
      codec: 'h264',
      frameRate: 30,
      sceneComplexity: 'medium',
    });
  });

  it('reserves an unused night/IR multiplier', () => {
    expect(BITRATE_MODEL).toHaveProperty('nightIrMultiplier');
  });
});

describe('bitrateModelSchema', () => {
  it('rejects "validated" while any value is still a placeholder', () => {
    const model = { ...markEveryValueMeasured(shippedModel()) };
    model.codecMultipliers.h265 = { value: 0.6, provenance: PLACEHOLDER_PROVENANCE };

    const result = bitrateModelSchema.safeParse(model);

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ['codecMultipliers', 'h265'] }),
    ]);
  });

  it('accepts "validated" once every value has real provenance', () => {
    expect(bitrateModelSchema.safeParse(markEveryValueMeasured(shippedModel())).success).toBe(true);
  });

  it('accepts a per-complexity uncertainty band', () => {
    const model = shippedModel();
    model.uncertaintyBand.bySceneComplexity = {
      high: { value: 0.5, provenance: PLACEHOLDER_PROVENANCE },
    };
    expect(bitrateModelSchema.safeParse(model).success).toBe(true);
  });

  it.each([
    ['a missing resolution', (m: BitrateModel) => Reflect.deleteProperty(m.baselineMbps, '8MP')],
    ['a zero multiplier', (m: BitrateModel) => (m.codecMultipliers.h264.value = 0)],
    ['a band of 100% or more', (m: BitrateModel) => (m.uncertaintyBand.default.value = 1)],
    ['a negative band', (m: BitrateModel) => (m.uncertaintyBand.default.value = -0.1)],
    ['an empty provenance', (m: BitrateModel) => (m.baselineMbps['4MP'].provenance = ' ')],
    ['a non-semver version', (m: BitrateModel) => (m.version = 'v1')],
    ['an invalid date', (m: BitrateModel) => (m.lastUpdated = '14/10/2026')],
    ['an unknown status', (m: BitrateModel) => Reflect.set(m, 'status', 'draft')],
  ])('rejects %s', (_label, mutate) => {
    const model = shippedModel();
    mutate(model);
    expect(bitrateModelSchema.safeParse(model).success).toBe(false);
  });
});

describe('findPlaceholderValues', () => {
  it('lists the dotted path of every placeholder value', () => {
    const paths = findPlaceholderValues(shippedModel());
    expect(paths).toContain('baselineMbps.4MP');
    expect(paths).toContain('frameRateScaling.exponent');
    expect(paths).toContain('uncertaintyBand.default');
  });

  it('returns nothing once every value has real provenance', () => {
    expect(findPlaceholderValues(markEveryValueMeasured(shippedModel()))).toEqual([]);
  });
});
