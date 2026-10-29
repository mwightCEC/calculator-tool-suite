import { calculateBandwidth, checkLink } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  bandwidthCalculatorReducer,
  createInitialBandwidthCalculatorState,
  type BandwidthCalculatorAction,
  type BandwidthCalculatorState,
} from '../_state/bandwidth-calculator-state';
import {
  bandwidthSegments,
  buildMetricTiles,
  describeBandwidth,
  describeLinkLoad,
  describeRemoteViewing,
  describeViewing,
  describeWarning,
  formatLinkSpeed,
} from './result-summary';

function stateAfter(...actions: BandwidthCalculatorAction[]): BandwidthCalculatorState {
  return actions.reduce(bandwidthCalculatorReducer, createInitialBandwidthCalculatorState());
}

/** 10 cameras at a known 4 Mbps, so every figure is exact. */
const KNOWN_4_MBPS: BandwidthCalculatorAction[] = [
  { type: 'update-group', id: 'g1', changes: { cameraCount: 10 } },
  { type: 'set-bitrate-source', id: 'g1', source: 'known-average' },
  { type: 'update-group', id: 'g1', changes: { bitrate: { source: 'known-average', mbps: 4 } } },
];

const VIEWING_ON: BandwidthCalculatorAction = {
  type: 'update-remote-viewing',
  changes: { enabled: true },
};

describe('describeBandwidth', () => {
  it('is exact with known bitrates', () => {
    const state = stateAfter(...KNOWN_4_MBPS);
    // 10 × 4 Mbps + 10% overhead.
    expect(describeBandwidth(calculateBandwidth(state))).toEqual({
      value: '44 Mbps',
      likelyRange: null,
    });
  });

  it('marks estimates with "~" and gives the likely range', () => {
    const figure = describeBandwidth(calculateBandwidth(stateAfter()));
    expect(figure.value).toMatch(/^~[\d.]+ Mbps$/);
    expect(figure.likelyRange).toMatch(/^likely [\d.]+–[\d.]+ Mbps$/);
  });
});

describe('describeRemoteViewing and describeViewing', () => {
  it('describes remote viewing as "Off" when it is turned off', () => {
    const state = stateAfter(...KNOWN_4_MBPS);
    const result = calculateBandwidth(state);
    expect(result.remoteViewing).toBeNull();
    expect(describeViewing(state, result)).toBe('Off');
  });

  it('is exact at a known camera bitrate', () => {
    // 1 viewer × 4 cameras × 4 Mbps + 10% overhead.
    const viewing = calculateBandwidth(stateAfter(...KNOWN_4_MBPS, VIEWING_ON)).remoteViewing!;
    expect(describeRemoteViewing(viewing)).toEqual({ value: '17.6 Mbps', likelyRange: null });
  });

  it('marks an estimated camera bitrate with "~"', () => {
    const viewing = calculateBandwidth(stateAfter(VIEWING_ON)).remoteViewing!;
    expect(describeRemoteViewing(viewing).value).toMatch(/^~/);
  });

  it('is exact at a custom bitrate, even when the cameras are estimated', () => {
    const state = stateAfter({
      type: 'update-remote-viewing',
      changes: { enabled: true, bitrateSource: 'custom', customMbps: 0.5 },
    });
    // 1 viewer × 4 cameras × 0.5 Mbps + 10% overhead.
    expect(describeRemoteViewing(calculateBandwidth(state).remoteViewing!)).toEqual({
      value: '2.2 Mbps',
      likelyRange: null,
    });
  });

  it('describes viewers, capped cameras and the camera bitrate', () => {
    const state = stateAfter(
      { type: 'update-group', id: 'g1', changes: { cameraCount: 3 } },
      { type: 'update-remote-viewing', changes: { enabled: true, viewers: 2, camerasPerViewer: 4 } }
    );
    expect(describeViewing(state, calculateBandwidth(state))).toBe(
      '2 viewers × 3 cameras · Camera bitrate'
    );
  });

  it('uses singular nouns and names a custom bitrate', () => {
    const state = stateAfter({
      type: 'update-remote-viewing',
      changes: { enabled: true, camerasPerViewer: 1, bitrateSource: 'custom', customMbps: 0.5 },
    });
    expect(describeViewing(state, calculateBandwidth(state))).toBe(
      '1 viewer × 1 camera · Custom bitrate 0.5 Mbps'
    );
  });
});

describe('link text', () => {
  it('formats whole gigabits as Gbps and everything else as Mbps', () => {
    expect(formatLinkSpeed(1000)).toBe('1 Gbps');
    expect(formatLinkSpeed(10_000)).toBe('10 Gbps');
    expect(formatLinkSpeed(1500)).toBe('1,500 Mbps');
    expect(formatLinkSpeed(10)).toBe('10 Mbps');
  });

  it('describes the high load against capacity', () => {
    const check = checkLink('uplink', 100, { low: 30, typical: 40, high: 55 });
    expect(describeLinkLoad(check)).toBe('Up to 55 Mbps of 100 Mbps · 55%');
  });
});

describe('describeWarning', () => {
  it('is null when no link is over capacity', () => {
    const state = stateAfter(...KNOWN_4_MBPS, {
      type: 'update-network',
      changes: { uplinkMbps: 100 }, // 44 / 100 = 44%: OK
    });
    expect(describeWarning(calculateBandwidth(state))).toBeNull();
  });

  it('names every link over capacity', () => {
    const state = stateAfter(
      ...KNOWN_4_MBPS,
      { type: 'update-network', changes: { uplinkMbps: 10 } },
      { type: 'update-remote-viewing', changes: { enabled: true, siteUploadMbps: 0.5 } }
    );
    expect(describeWarning(calculateBandwidth(state))).toBe(
      'Traffic may exceed: Uplink, Site upload. Allow headroom for bursts and other traffic.'
    );
  });
});

describe('bandwidthSegments', () => {
  it('labels the default single group by its name', () => {
    const state = createInitialBandwidthCalculatorState();
    expect(bandwidthSegments(state, calculateBandwidth(state))[0]?.label).toBe('Camera group 1');
  });

  it('splits the estimate into groups and overhead that add up to the total', () => {
    const state = stateAfter(...KNOWN_4_MBPS, { type: 'add-group' });
    const result = calculateBandwidth(state);
    const segments = bandwidthSegments(state, result);

    // New groups are added at the top.
    expect(segments.map((segment) => segment.key)).toEqual(['g2', 'g1', 'overhead']);
    expect(segments[1]).toEqual({ key: 'g1', label: 'Camera group 1', mbps: 40, colorIndex: 0 });
    expect(segments[2]).toMatchObject({ label: 'Overhead', colorIndex: null });
    const total = segments.reduce((sum, segment) => sum + segment.mbps, 0);
    expect(total).toBeCloseTo(result.bandwidthMbps.typical);
  });

  it('gives a zero overhead segment at 0% overhead', () => {
    const state = stateAfter(...KNOWN_4_MBPS, { type: 'set-overhead', overheadPercent: 0 });
    const segments = bandwidthSegments(state, calculateBandwidth(state));
    expect(segments.at(-1)?.mbps).toBeCloseTo(0);
  });
});

describe('buildMetricTiles', () => {
  it('gives exact streams, overhead and per-camera figures for known bitrates', () => {
    const state = stateAfter(...KNOWN_4_MBPS);
    expect(buildMetricTiles(state, calculateBandwidth(state))).toEqual([
      { label: 'Camera streams', value: '40 Mbps', detail: null },
      { label: 'Overhead', value: '4 Mbps', detail: '10% allowance' },
      { label: 'Per camera', value: '4 Mbps', detail: 'average, before overhead' },
    ]);
  });

  it('marks estimates with "~" and gives the streams range', () => {
    const state = stateAfter();
    const [streams] = buildMetricTiles(state, calculateBandwidth(state));
    expect(streams?.value).toMatch(/^~/);
    expect(streams?.detail).toMatch(/Mbps$/);
  });
});
