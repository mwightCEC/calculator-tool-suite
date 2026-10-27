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
  type RemoteViewing,
} from './schema';

/** 10 cameras × 4 Mbps VBR average. */
const LOBBY: BandwidthCameraGroup = {
  ...createBandwidthCameraGroup('g1', 'Lobby'),
  cameraCount: 10,
  bitrate: { source: 'known-average', mbps: 4 },
};

/** 5 cameras × 1 Mbps CBR. */
const PARKING: BandwidthCameraGroup = {
  ...createBandwidthCameraGroup('g2', 'Parking'),
  cameraCount: 5,
  bitrate: { source: 'bitrate-cap', mbps: 1 },
};

const VIEWING: RemoteViewing = {
  enabled: true,
  viewers: 2,
  camerasPerViewer: 4,
  bitrateSource: 'camera',
  customMbps: 0.5,
  siteUploadMbps: null,
};

/** Known bitrates only, remote viewing on at the camera bitrate, no overhead: every number is exact. */
function knownInput(changes: Partial<BandwidthInput> = {}): BandwidthInput {
  return {
    ...createDefaultBandwidthInput(),
    cameraGroups: [LOBBY, PARKING],
    remoteViewing: VIEWING,
    overheadPercent: 0,
    ...changes,
  };
}

const withViewing = (changes: Partial<RemoteViewing>) =>
  knownInput({ remoteViewing: { ...VIEWING, ...changes } });

function expectRangeClose(actual: ValueRange, expected: ValueRange) {
  expect(actual.low).toBeCloseTo(expected.low, 9);
  expect(actual.typical).toBeCloseTo(expected.typical, 9);
  expect(actual.high).toBeCloseTo(expected.high, 9);
}

describe('per-group usage', () => {
  const result = calculateBandwidth(knownInput());

  it('totals each group', () => {
    expect(result.groups.map((group) => group.groupId)).toEqual(['g1', 'g2']);
    expect(result.groups[0]?.perCameraMbps).toEqual(pointRange(4));
    expect(result.groups[0]?.totalMbps).toEqual(pointRange(40));
    expect(result.groups[1]?.totalMbps).toEqual(pointRange(5));
  });

  it('counts cameras and averages the bitrate per camera, weighted by camera count', () => {
    expect(result.totalCameras).toBe(15);
    expect(result.streamsMbps).toEqual(pointRange(45));
    expectRangeClose(result.averagePerCameraMbps, pointRange(3));
  });
});

describe('bandwidth estimate', () => {
  it('is the sum of camera streams', () => {
    expect(calculateBandwidth(knownInput()).bandwidthMbps).toEqual(pointRange(45));
  });

  it('applies the overhead allowance', () => {
    const result = calculateBandwidth(knownInput({ overheadPercent: 10 }));
    expectRangeClose(result.bandwidthMbps, pointRange(49.5));
    expect(result.streamsMbps).toEqual(pointRange(45));
  });

  it('carries the estimate range through for estimated groups', () => {
    const estimated = { ...LOBBY, bitrate: { source: 'estimate' } as const };
    const result = calculateBandwidth(knownInput({ cameraGroups: [estimated] }));
    const perCamera = estimateBitrateRange(estimated);
    expectRangeClose(result.bandwidthMbps, {
      low: perCamera.low * 10,
      typical: perCamera.typical * 10,
      high: perCamera.high * 10,
    });
    expect(result.bandwidthMbps.low).toBeLessThan(result.bandwidthMbps.high);
  });
});

describe('remote viewing', () => {
  it('is null when remote viewing is off', () => {
    expect(calculateBandwidth(withViewing({ enabled: false })).remoteViewing).toBeNull();
  });

  it('multiplies viewers × cameras × the average camera bitrate', () => {
    // 2 viewers × 4 cameras × 3 Mbps average.
    const viewing = calculateBandwidth(knownInput()).remoteViewing;
    expectRangeClose(viewing!.perCameraMbps, pointRange(3));
    expectRangeClose(viewing!.totalMbps, pointRange(24));
  });

  it('uses the custom bitrate when chosen', () => {
    const viewing = calculateBandwidth(withViewing({ bitrateSource: 'custom' })).remoteViewing;
    expect(viewing?.perCameraMbps).toEqual(pointRange(0.5));
    expect(viewing?.totalMbps).toEqual(pointRange(4));
  });

  it('caps cameras per viewer at the total camera count', () => {
    const viewing = calculateBandwidth(
      withViewing({ viewers: 1, camerasPerViewer: 64, bitrateSource: 'custom' })
    ).remoteViewing;
    expect(viewing?.viewedCamerasPerViewer).toBe(15);
    expect(viewing?.totalMbps).toEqual(pointRange(7.5));
  });

  it('applies the overhead allowance', () => {
    const result = calculateBandwidth(knownInput({ overheadPercent: 20 }));
    expectRangeClose(result.remoteViewing!.totalMbps, pointRange(24 * 1.2));
  });
});

describe('isEstimated', () => {
  it('is false when every group has an entered bitrate', () => {
    const result = calculateBandwidth(knownInput());
    expect(result.isEstimated).toBe(false);
    expect(isPointRange(result.bandwidthMbps)).toBe(true);
  });

  it('is true when a group is estimated', () => {
    const estimated = { ...LOBBY, bitrate: { source: 'estimate' } as const };
    expect(calculateBandwidth(knownInput({ cameraGroups: [estimated] })).isEstimated).toBe(true);
  });
});

describe('link checks', () => {
  it('are empty when no link is entered', () => {
    expect(calculateBandwidth(knownInput()).linkChecks).toEqual([]);
  });

  it('check the bandwidth estimate against the uplink, and remote viewing against site upload', () => {
    const result = calculateBandwidth({
      ...withViewing({ siteUploadMbps: 20 }),
      network: { uplinkMbps: 100 },
    });
    expect(result.linkChecks).toEqual([
      expect.objectContaining({ link: 'uplink', utilisation: 0.45, status: 'ok' }),
      expect.objectContaining({
        link: 'site-upload',
        utilisation: 24 / 20,
        status: 'over-capacity',
      }),
    ]);
  });

  it('skip the site upload check while remote viewing is off', () => {
    const result = calculateBandwidth(withViewing({ enabled: false, siteUploadMbps: 20 }));
    expect(result.linkChecks).toEqual([]);
  });

  it('use the high estimate', () => {
    const estimated = { ...LOBBY, bitrate: { source: 'estimate' as const } };
    const result = calculateBandwidth(
      knownInput({ cameraGroups: [estimated], network: { uplinkMbps: 100 } })
    );
    expect(result.linkChecks[0]?.utilisation).toBeCloseTo(result.bandwidthMbps.high / 100, 12);
  });
});

describe('model injection', () => {
  it('uses a supplied bitrate model', () => {
    const bitrateModel = structuredClone(BITRATE_MODEL);
    bitrateModel.baselineMbps['4MP'].value *= 2;
    const estimated = { ...LOBBY, bitrate: { source: 'estimate' as const } };
    const input = knownInput({ cameraGroups: [estimated] });

    const normal = calculateBandwidth(input);
    const custom = calculateBandwidth(input, { bitrateModel });
    expect(custom.streamsMbps.typical).toBeCloseTo(normal.streamsMbps.typical * 2, 9);
  });
});
