import { describe, expect, it } from 'vitest';
import { createBandwidthCameraGroup } from '../bandwidth/schema';
import { createCameraGroup } from '../model/defaults';
import type { CameraGroup, GroupBitrate } from '../model/schema';
import { BITRATE_INPUT_MAX_MBPS, BITRATE_INPUT_MIN_MBPS } from '../options';
import { BITRATE_MODEL } from './bitrate-model';
import type { BitrateModel } from './bitrate-model-schema';
import { estimateBitrateRange, estimateTypicalBitrateMbps } from './estimate-bitrate';
import { cameraBitrateRange, changeBitrateSource } from './group-bitrate';

function group(overrides: Partial<CameraGroup> = {}): CameraGroup {
  return { ...createCameraGroup('g', 'Group'), ...overrides };
}

/** A copy of the shipped model with a chosen 4MP baseline, for clamp tests. */
function withBaseline4mp(mbps: number): BitrateModel {
  const model = structuredClone(BITRATE_MODEL);
  model.baselineMbps['4MP'].value = mbps;
  return model;
}

describe('cameraBitrateRange', () => {
  it('uses the model range for Estimate', () => {
    const estimated = group({ bitrate: { source: 'estimate' } });
    expect(cameraBitrateRange(estimated)).toEqual(estimateBitrateRange(estimated));
  });

  it.each(['known-average', 'bitrate-cap'] as const)('collapses %s to one value', (source) => {
    expect(cameraBitrateRange(group({ bitrate: { source, mbps: 8 } }))).toEqual({
      low: 8,
      typical: 8,
      high: 8,
    });
  });
});

describe('changeBitrateSource', () => {
  it.each(['known-average', 'bitrate-cap'] as const)(
    'prefills %s with the typical estimate, rounded to 0.1 Mbps',
    (source) => {
      const estimated = group({ bitrate: { source: 'estimate' } });
      const expected = Math.round(estimateTypicalBitrateMbps(estimated) * 10) / 10;
      expect(changeBitrateSource(estimated, source)).toEqual({ source, mbps: expected });
    }
  );

  it('keeps the entered value when switching between Known average and Bitrate cap', () => {
    const known = group({ bitrate: { source: 'known-average', mbps: 7.3 } });
    expect(changeBitrateSource(known, 'bitrate-cap')).toEqual({ source: 'bitrate-cap', mbps: 7.3 });
  });

  it('drops the entered value when switching back to Estimate', () => {
    const capped = group({ bitrate: { source: 'bitrate-cap', mbps: 7.3 } });
    expect(changeBitrateSource(capped, 'estimate')).toEqual<GroupBitrate>({ source: 'estimate' });
  });

  it('clamps the prefill to the allowed input range', () => {
    const estimated = group({ resolution: '4MP' });

    expect(
      changeBitrateSource(estimated, 'bitrate-cap', { model: withBaseline4mp(10_000) })
    ).toEqual({
      source: 'bitrate-cap',
      mbps: BITRATE_INPUT_MAX_MBPS,
    });
    expect(
      changeBitrateSource(estimated, 'known-average', { model: withBaseline4mp(0.001) })
    ).toEqual({
      source: 'known-average',
      mbps: BITRATE_INPUT_MIN_MBPS,
    });
  });

  it('accepts a Bandwidth group, which has no recording fields', () => {
    const bandwidthGroup = createBandwidthCameraGroup('g', 'Group');
    expect(changeBitrateSource(bandwidthGroup, 'known-average')).toEqual({
      source: 'known-average',
      mbps: Math.round(estimateTypicalBitrateMbps(bandwidthGroup) * 10) / 10,
    });
  });

  it('respects a lower ceiling, e.g. a camera preset maximum', () => {
    const estimated = group({ resolution: '4MP' });
    expect(
      changeBitrateSource(estimated, 'bitrate-cap', { maxMbps: 5, model: withBaseline4mp(50) })
    ).toEqual({ source: 'bitrate-cap', mbps: 5 });
  });
});
