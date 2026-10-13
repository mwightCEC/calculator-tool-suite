import { describe, expect, it } from 'vitest';
import { CODECS, RESOLUTIONS, SCENE_COMPLEXITIES } from '../options';
import { estimateBitrateMbps, isBitrateEstimateValidated } from './estimate-bitrate';
import { PLACEHOLDER_BITRATE_MODEL } from './placeholder-bitrate-coefficients';

const REFERENCE = { codec: 'h264', frameRate: 30, sceneComplexity: 'medium' } as const;

describe('estimateBitrateMbps (placeholder model)', () => {
  it.each([
    ['1MP', 2],
    ['2MP', 4],
    ['3MP', 5],
    ['4MP', 6],
    ['5MP', 7],
    ['6MP', 8],
    ['8MP', 12],
    ['12MP', 16],
  ] as const)('%s at H.264, 30 fps, medium complexity is %d Mbps', (resolution, expected) => {
    expect(estimateBitrateMbps({ ...REFERENCE, resolution })).toBe(expected);
  });

  it.each([
    ['h264', 6],
    ['h264-smart', 3.6],
    ['h265', 3.6],
    ['h265-smart', 2.1],
    ['mjpeg', 30],
  ] as const)('applies the %s codec factor', (codec, expected) => {
    expect(estimateBitrateMbps({ ...REFERENCE, resolution: '4MP', codec })).toBeCloseTo(expected);
  });

  it('scales frame rate by (fps / 30)^0.85', () => {
    const at15 = estimateBitrateMbps({ ...REFERENCE, resolution: '4MP', frameRate: 15 });
    expect(at15).toBeCloseTo(6 * 0.5 ** 0.85, 10);
    expect(at15).toBeCloseTo(3.3287, 4);
  });

  it.each([
    ['low', 3.6],
    ['medium', 6],
    ['high', 9],
  ] as const)('applies the %s scene complexity factor', (sceneComplexity, expected) => {
    expect(estimateBitrateMbps({ ...REFERENCE, resolution: '4MP', sceneComplexity })).toBeCloseTo(
      expected
    );
  });

  it('combines all factors multiplicatively', () => {
    const estimate = estimateBitrateMbps({
      resolution: '4MP',
      codec: 'h265',
      frameRate: 15,
      sceneComplexity: 'low',
    });
    expect(estimate).toBeCloseTo(6 * 0.6 * 0.5 ** 0.85 * 0.6, 10);
  });

  it('has a positive coefficient for every option', () => {
    const model = PLACEHOLDER_BITRATE_MODEL;
    for (const resolution of RESOLUTIONS) {
      expect(model.baseH264MbpsAt30Fps[resolution]).toBeGreaterThan(0);
    }
    for (const codec of CODECS) {
      expect(model.codecFactor[codec]).toBeGreaterThan(0);
    }
    for (const complexity of SCENE_COMPLEXITIES) {
      expect(model.complexityFactor[complexity]).toBeGreaterThan(0);
    }
  });

  it('is flagged as unvalidated until real data replaces the placeholders', () => {
    expect(PLACEHOLDER_BITRATE_MODEL.validated).toBe(false);
    expect(isBitrateEstimateValidated).toBe(false);
  });
});
