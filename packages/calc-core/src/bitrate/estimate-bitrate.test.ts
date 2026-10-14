import { describe, expect, it } from 'vitest';
import { CODECS, FRAME_RATES, RESOLUTIONS, SCENE_COMPLEXITIES } from '../options';
import { BITRATE_MODEL } from './bitrate-model';
import {
  estimateBitrateRange,
  estimateTypicalBitrateMbps,
  uncertaintyBandFor,
} from './estimate-bitrate';

// Expectations are derived from the data file so replacing the numbers needs no test edits.
const model = BITRATE_MODEL;
const REFERENCE = { ...model.reference, resolution: '4MP' } as const;
const base4mp = model.baselineMbps['4MP'].value;

describe('estimateTypicalBitrateMbps', () => {
  it.each(RESOLUTIONS)('returns the %s baseline at the reference point', (resolution) => {
    expect(estimateTypicalBitrateMbps({ ...REFERENCE, resolution })).toBeCloseTo(
      model.baselineMbps[resolution].value
    );
  });

  it.each(CODECS)('applies the %s codec multiplier', (codec) => {
    const relative = model.codecMultipliers[codec].value / model.codecMultipliers.h264.value;
    expect(estimateTypicalBitrateMbps({ ...REFERENCE, codec })).toBeCloseTo(base4mp * relative);
  });

  it.each(FRAME_RATES)('scales %d fps by (fps / reference)^exponent', (frameRate) => {
    const factor = (frameRate / model.reference.frameRate) ** model.frameRateScaling.exponent.value;
    expect(estimateTypicalBitrateMbps({ ...REFERENCE, frameRate })).toBeCloseTo(base4mp * factor);
  });

  it.each(SCENE_COMPLEXITIES)('applies the %s complexity multiplier', (sceneComplexity) => {
    const relative =
      model.sceneComplexityMultipliers[sceneComplexity].value /
      model.sceneComplexityMultipliers.medium.value;
    expect(estimateTypicalBitrateMbps({ ...REFERENCE, sceneComplexity })).toBeCloseTo(
      base4mp * relative
    );
  });

  it('combines all factors multiplicatively', () => {
    const input = {
      resolution: '8MP',
      codec: 'h265',
      frameRate: 15,
      sceneComplexity: 'high',
    } as const;
    const expected =
      model.baselineMbps['8MP'].value *
      model.codecMultipliers.h265.value *
      (15 / model.reference.frameRate) ** model.frameRateScaling.exponent.value *
      model.sceneComplexityMultipliers.high.value;
    expect(estimateTypicalBitrateMbps(input)).toBeCloseTo(expected, 10);
  });
});

describe('estimateBitrateRange', () => {
  it('spreads low and high by the uncertainty band around the typical value', () => {
    const band = model.uncertaintyBand.default.value;
    const range = estimateBitrateRange(REFERENCE);
    expect(range.typical).toBeCloseTo(base4mp);
    expect(range.low).toBeCloseTo(base4mp * (1 - band));
    expect(range.high).toBeCloseTo(base4mp * (1 + band));
  });

  it('uses a per-complexity band when the data file provides one', () => {
    const custom = structuredClone(model);
    custom.uncertaintyBand.bySceneComplexity = {
      high: { value: 0.5, provenance: 'measured: test fixture' },
    };

    expect(uncertaintyBandFor('high', custom)).toBe(0.5);
    expect(uncertaintyBandFor('low', custom)).toBe(custom.uncertaintyBand.default.value);

    const range = estimateBitrateRange({ ...REFERENCE, sceneComplexity: 'high' }, custom);
    expect(range.low).toBeCloseTo(range.typical * 0.5);
    expect(range.high).toBeCloseTo(range.typical * 1.5);
  });

  it('reads coefficients from the supplied model', () => {
    const doubled = structuredClone(model);
    doubled.baselineMbps['4MP'].value = base4mp * 2;
    expect(estimateBitrateRange(REFERENCE, doubled).typical).toBeCloseTo(base4mp * 2);
  });
});
