import { describe, expect, it } from 'vitest';
import subStreamModelJson from '../data/sub-stream-model.json';
import { SUB_STREAM_RESOLUTIONS } from './options';
import {
  isSubStreamModelValidated,
  SUB_STREAM_MODEL,
  subStreamBitrateRange,
  subStreamModelSchema,
  type SubStreamModel,
} from './sub-stream-model';

function shippedModel(): SubStreamModel {
  return structuredClone(SUB_STREAM_MODEL);
}

describe('shipped sub-stream-model.json', () => {
  it('passes schema validation', () => {
    expect(subStreamModelSchema.safeParse(subStreamModelJson).success).toBe(true);
  });

  it('covers every sub-stream resolution with low ≤ typical ≤ high', () => {
    for (const resolution of SUB_STREAM_RESOLUTIONS) {
      const { low, typical, high } = SUB_STREAM_MODEL.mbpsByResolution[resolution];
      expect(low).toBeLessThanOrEqual(typical);
      expect(typical).toBeLessThanOrEqual(high);
    }
  });

  it('reports its validation status', () => {
    expect(isSubStreamModelValidated).toBe(SUB_STREAM_MODEL.status === 'validated');
  });
});

describe('subStreamModelSchema', () => {
  it('rejects "validated" while a value is still a placeholder', () => {
    const model = { ...shippedModel(), status: 'validated' };
    const result = subStreamModelSchema.safeParse(model);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      SUB_STREAM_RESOLUTIONS.map((resolution) => `mbpsByResolution.${resolution}`)
    );
  });

  it('accepts "validated" once every value has real provenance', () => {
    const model = shippedModel();
    for (const resolution of SUB_STREAM_RESOLUTIONS) {
      model.mbpsByResolution[resolution].provenance = 'measured: test fixture';
    }
    expect(subStreamModelSchema.safeParse({ ...model, status: 'validated' }).success).toBe(true);
  });

  it.each([
    ['low above typical', (m: SubStreamModel) => (m.mbpsByResolution.d1.low = 0.9)],
    ['typical above high', (m: SubStreamModel) => (m.mbpsByResolution['720p'].typical = 9)],
    ['a zero value', (m: SubStreamModel) => (m.mbpsByResolution['1080p'].low = 0)],
    [
      'a missing resolution',
      (m: SubStreamModel) => Reflect.deleteProperty(m.mbpsByResolution, 'd1'),
    ],
    ['an empty provenance', (m: SubStreamModel) => (m.mbpsByResolution.d1.provenance = ' ')],
    ['a non-semver version', (m: SubStreamModel) => (m.version = 'v1')],
  ])('rejects %s', (_label, mutate) => {
    const model = shippedModel();
    mutate(model);
    expect(subStreamModelSchema.safeParse(model).success).toBe(false);
  });
});

describe('subStreamBitrateRange', () => {
  it('returns the range for a resolution from the data file', () => {
    const { low, typical, high } = SUB_STREAM_MODEL.mbpsByResolution['720p'];
    expect(subStreamBitrateRange('720p')).toEqual({ low, typical, high });
  });

  it('reads from a supplied model', () => {
    const model = shippedModel();
    model.mbpsByResolution.d1 = { low: 1, typical: 2, high: 3, provenance: 'measured: test' };
    expect(subStreamBitrateRange('d1', model)).toEqual({ low: 1, typical: 2, high: 3 });
  });
});
