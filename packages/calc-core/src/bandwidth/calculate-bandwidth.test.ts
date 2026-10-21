import { describe, expect, it } from 'vitest';
import { BITRATE_MODEL } from '../bitrate/bitrate-model';
import { estimateBitrateRange } from '../bitrate/estimate-bitrate';
import { isPointRange, pointRange, type ValueRange } from '../range';
import { calculateBandwidth } from './calculate-bandwidth';
import {
  createBandwidthCameraGroup,
  createDefaultBandwidthInput,
  type BandwidthCameraGroup,
  type BandwidthInput,
} from './schema';
import { SUB_STREAM_MODEL, subStreamBitrateRange } from './sub-stream-model';

/** 10 cameras × 4 Mbps known average, D1 sub-streams. */
const LOBBY: BandwidthCameraGroup = {
  ...createBandwidthCameraGroup('g1', 'Lobby'),
  cameraCount: 10,
  bitrate: { source: 'known-average', mbps: 4 },
  subStreamResolution: 'd1',
};

/** 5 cameras × 2 Mbps cap, 720p sub-streams. */
const PARKING: BandwidthCameraGroup = {
  ...createBandwidthCameraGroup('g2', 'Parking'),
  cameraCount: 5,
  bitrate: { source: 'bitrate-cap', mbps: 2 },
  subStreamResolution: '720p',
};

/** Known bitrates only, main streams viewed, no overhead: every number is exact. */
function knownInput(changes: Partial<BandwidthInput> = {}): BandwidthInput {
  return {
    ...createDefaultBandwidthInput(),
    cameraGroups: [LOBBY, PARKING],
    remoteViewing: { viewers: 2, camerasPerViewer: 4, stream: 'main' },
    overheadPercent: 0,
    ...changes,
  };
}

const sub = (resolution: 'd1' | '720p' | '1080p') => SUB_STREAM_MODEL.mbpsByResolution[resolution];

function expectRangeClose(actual: ValueRange, expected: ValueRange) {
  expect(actual.low).toBeCloseTo(expected.low, 9);
  expect(actual.typical).toBeCloseTo(expected.typical, 9);
  expect(actual.high).toBeCloseTo(expected.high, 9);
}

describe('per-group usage', () => {
  const result = calculateBandwidth(knownInput());

  it('totals main and sub-streams for each group', () => {
    expect(result.groups.map((group) => group.groupId)).toEqual(['g1', 'g2']);
    expect(result.groups[0]?.mainTotalMbps).toEqual(pointRange(40));
    expect(result.groups[1]?.mainTotalMbps).toEqual(pointRange(10));
    expectRangeClose(result.groups[0]!.subTotalMbps, {
      low: sub('d1').low * 10,
      typical: sub('d1').typical * 10,
      high: sub('d1').high * 10,
    });
  });

  it('counts cameras and averages the main stream per camera', () => {
    expect(result.totalCameras).toBe(15);
    expectRangeClose(result.averageMainPerCameraMbps, pointRange(50 / 15));
  });
});

describe('recorder ingest', () => {
  it('is the sum of main streams when only main streams are recorded', () => {
    expect(calculateBandwidth(knownInput()).ingestMbps).toEqual(pointRange(50));
  });

  it('adds sub-streams when they are recorded too', () => {
    const result = calculateBandwidth(knownInput({ recordedStreams: 'main-and-sub' }));
    const subTypical = sub('d1').typical * 10 + sub('720p').typical * 5;
    expect(result.ingestMbps.typical).toBeCloseTo(50 + subTypical, 9);
    expect(result.ingestMbps.high).toBeCloseTo(50 + sub('d1').high * 10 + sub('720p').high * 5, 9);
  });

  it('applies the overhead allowance', () => {
    const result = calculateBandwidth(knownInput({ overheadPercent: 10 }));
    expectRangeClose(result.ingestMbps, pointRange(55));
  });

  it('carries the estimate range through for estimated groups', () => {
    const estimated = { ...LOBBY, bitrate: { source: 'estimate' } as const };
    const result = calculateBandwidth(knownInput({ cameraGroups: [estimated] }));
    const perCamera = estimateBitrateRange(estimated);
    expectRangeClose(result.ingestMbps, {
      low: perCamera.low * 10,
      typical: perCamera.typical * 10,
      high: perCamera.high * 10,
    });
    expect(result.ingestMbps.low).toBeLessThan(result.ingestMbps.high);
  });
});

describe('remote viewing upload', () => {
  it('multiplies viewers × cameras × the busiest group’s main-stream rate', () => {
    // Busiest main stream is the Lobby (4 Mbps): 2 viewers × 4 cameras × 4 Mbps.
    const result = calculateBandwidth(knownInput());
    expect(result.viewingPerCameraMbps).toEqual(pointRange(4));
    expect(result.viewingUploadMbps).toEqual(pointRange(32));
  });

  it('uses the busiest group’s sub-stream rate for sub-stream viewing', () => {
    const result = calculateBandwidth(
      knownInput({ remoteViewing: { viewers: 2, camerasPerViewer: 4, stream: 'sub' } })
    );
    // Parking's 720p sub-stream is busier than the Lobby's D1.
    expect(result.viewingPerCameraMbps).toEqual(subStreamBitrateRange('720p'));
    expectRangeClose(result.viewingUploadMbps, {
      low: sub('720p').low * 8,
      typical: sub('720p').typical * 8,
      high: sub('720p').high * 8,
    });
  });

  it('caps cameras per viewer at the total camera count', () => {
    const result = calculateBandwidth(
      knownInput({ remoteViewing: { viewers: 1, camerasPerViewer: 64, stream: 'main' } })
    );
    expect(result.viewedCamerasPerViewer).toBe(15);
    expect(result.viewingUploadMbps).toEqual(pointRange(60));
  });

  it('is zero with no remote viewers', () => {
    const result = calculateBandwidth(
      knownInput({ remoteViewing: { viewers: 0, camerasPerViewer: 4, stream: 'main' } })
    );
    expect(result.viewingPerCameraMbps).toBeNull();
    expect(result.viewingUploadMbps).toEqual(pointRange(0));
  });

  it('applies the overhead allowance', () => {
    const result = calculateBandwidth(knownInput({ overheadPercent: 20 }));
    expectRangeClose(result.viewingUploadMbps, pointRange(32 * 1.2));
  });
});

describe('isEstimated', () => {
  it('is false when every counted stream comes from entered bitrates', () => {
    const result = calculateBandwidth(knownInput());
    expect(result.isEstimated).toBe(false);
    expect(isPointRange(result.ingestMbps)).toBe(true);
  });

  it.each([
    [
      'a main stream is estimated',
      { cameraGroups: [{ ...LOBBY, bitrate: { source: 'estimate' as const } }] },
    ],
    ['sub-streams are recorded', { recordedStreams: 'main-and-sub' as const }],
    [
      'viewers watch sub-streams',
      { remoteViewing: { viewers: 1, camerasPerViewer: 4, stream: 'sub' as const } },
    ],
  ])('is true when %s', (_label, changes) => {
    expect(calculateBandwidth(knownInput(changes)).isEstimated).toBe(true);
  });

  it('ignores sub-streams nobody records or watches', () => {
    const result = calculateBandwidth(
      knownInput({ remoteViewing: { viewers: 0, camerasPerViewer: 4, stream: 'sub' } })
    );
    expect(result.isEstimated).toBe(false);
  });
});

describe('link checks', () => {
  it('are empty when no link is entered', () => {
    expect(calculateBandwidth(knownInput()).linkChecks).toEqual([]);
  });

  it('check ingest against the recorder limit and uplink, and viewing against site upload', () => {
    const result = calculateBandwidth(
      knownInput({
        network: { recorderLimitMbps: 64, uplinkMbps: 100, siteUploadMbps: 30 },
      })
    );
    expect(result.linkChecks).toEqual([
      expect.objectContaining({ link: 'recorder-limit', utilisation: 50 / 64, status: 'caution' }),
      expect.objectContaining({ link: 'uplink', utilisation: 0.5, status: 'ok' }),
      expect.objectContaining({
        link: 'site-upload',
        utilisation: 32 / 30,
        status: 'over-capacity',
      }),
    ]);
  });

  it('only include the links entered', () => {
    const result = calculateBandwidth(
      knownInput({ network: { recorderLimitMbps: null, uplinkMbps: 1000, siteUploadMbps: null } })
    );
    expect(result.linkChecks.map((check) => check.link)).toEqual(['uplink']);
  });

  it('use the high estimate', () => {
    const estimated = { ...LOBBY, bitrate: { source: 'estimate' as const } };
    const result = calculateBandwidth(
      knownInput({
        cameraGroups: [estimated],
        network: { recorderLimitMbps: 100, uplinkMbps: null, siteUploadMbps: null },
      })
    );
    expect(result.linkChecks[0]?.utilisation).toBeCloseTo(result.ingestMbps.high / 100, 12);
  });
});

describe('model injection', () => {
  it('uses supplied bitrate and sub-stream models', () => {
    const bitrateModel = structuredClone(BITRATE_MODEL);
    bitrateModel.baselineMbps['4MP'].value *= 2;
    const subStreamModel = structuredClone(SUB_STREAM_MODEL);
    subStreamModel.mbpsByResolution.d1 = { low: 5, typical: 5, high: 5, provenance: 'test' };
    const estimated = { ...LOBBY, bitrate: { source: 'estimate' as const } };
    const input = knownInput({ cameraGroups: [estimated], recordedStreams: 'main-and-sub' });

    const normal = calculateBandwidth(input);
    const custom = calculateBandwidth(input, { bitrateModel, subStreamModel });
    expect(custom.mainTotalMbps.typical).toBeCloseTo(normal.mainTotalMbps.typical * 2, 9);
    expect(custom.subTotalMbps).toEqual(pointRange(50));
  });
});
