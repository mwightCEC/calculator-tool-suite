import { calculateBandwidth, checkLink } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  bandwidthCalculatorReducer,
  createInitialBandwidthCalculatorState,
  type BandwidthCalculatorAction,
  type BandwidthCalculatorState,
} from '../_state/bandwidth-calculator-state';
import {
  describeIngest,
  describeLinkLoad,
  describeViewing,
  describeViewingUpload,
  describeWarning,
  formatLinkSpeed,
  ingestSegments,
} from './result-summary';

function stateAfter(...actions: BandwidthCalculatorAction[]): BandwidthCalculatorState {
  return actions.reduce(bandwidthCalculatorReducer, createInitialBandwidthCalculatorState());
}

/** 10 cameras at a known 4 Mbps, so main-stream figures are exact. */
const KNOWN_4_MBPS: BandwidthCalculatorAction[] = [
  { type: 'update-group', id: 'g1', changes: { cameraCount: 10 } },
  { type: 'set-bitrate-source', id: 'g1', source: 'known-average' },
  { type: 'update-group', id: 'g1', changes: { bitrate: { source: 'known-average', mbps: 4 } } },
];

const NO_VIEWERS: BandwidthCalculatorAction = {
  type: 'update-remote-viewing',
  changes: { viewers: 0 },
};

describe('describeIngest', () => {
  it('is exact with known bitrates and no estimated traffic', () => {
    const state = stateAfter(...KNOWN_4_MBPS, NO_VIEWERS);
    // 10 × 4 Mbps + 10% overhead.
    expect(describeIngest(calculateBandwidth(state))).toEqual({
      value: '44 Mbps',
      likelyRange: null,
    });
  });

  it('marks estimates with "~" and gives the likely range', () => {
    const figure = describeIngest(calculateBandwidth(stateAfter()));
    expect(figure.value).toMatch(/^~[\d.]+ Mbps$/);
    expect(figure.likelyRange).toMatch(/^likely [\d.]+–[\d.]+ Mbps$/);
  });
});

describe('describeViewingUpload and describeViewing', () => {
  it('shows zero upload and "No remote viewers" without viewers', () => {
    const state = stateAfter(...KNOWN_4_MBPS, NO_VIEWERS);
    const result = calculateBandwidth(state);
    expect(describeViewingUpload(result)).toEqual({ value: '0 Mbps', likelyRange: null });
    expect(describeViewing(state, result)).toBe('No remote viewers');
  });

  it('describes viewers, capped cameras and stream', () => {
    const state = stateAfter(
      { type: 'update-group', id: 'g1', changes: { cameraCount: 3 } },
      { type: 'update-remote-viewing', changes: { viewers: 2, camerasPerViewer: 4 } }
    );
    expect(describeViewing(state, calculateBandwidth(state))).toBe(
      '2 viewers × 3 cameras · Sub (grid)'
    );
  });

  it('uses singular nouns for one viewer and one camera', () => {
    const state = stateAfter({
      type: 'update-remote-viewing',
      changes: { viewers: 1, camerasPerViewer: 1, stream: 'main' },
    });
    expect(describeViewing(state, calculateBandwidth(state))).toBe(
      '1 viewer × 1 camera · Main (full screen)'
    );
  });
});

describe('link text', () => {
  it('formats whole gigabits as Gbps and everything else as Mbps', () => {
    expect(formatLinkSpeed(1000)).toBe('1 Gbps');
    expect(formatLinkSpeed(10_000)).toBe('10 Gbps');
    expect(formatLinkSpeed(1500)).toBe('1,500 Mbps');
    expect(formatLinkSpeed(250)).toBe('250 Mbps');
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
      changes: { recorderLimitMbps: 55 }, // 44 / 55 = 80%: caution only
    });
    expect(describeWarning(calculateBandwidth(state))).toBeNull();
  });

  it('names every link over capacity', () => {
    const state = stateAfter(...KNOWN_4_MBPS, {
      type: 'update-network',
      changes: { recorderLimitMbps: 40, uplinkMbps: 100, siteUploadMbps: 0.5 },
    });
    expect(describeWarning(calculateBandwidth(state))).toBe(
      'Traffic may exceed: Recorder limit, Site upload. Allow headroom for bursts and other traffic.'
    );
  });
});

describe('ingestSegments', () => {
  it('splits ingest into groups and overhead that add up to the total', () => {
    const state = stateAfter(...KNOWN_4_MBPS, { type: 'add-group' });
    const result = calculateBandwidth(state);
    const segments = ingestSegments(state, result);

    expect(segments.map((segment) => segment.key)).toEqual(['g1', 'g2', 'overhead']);
    expect(segments[0]).toEqual({ key: 'g1', label: 'Camera group 1', mbps: 40, colorIndex: 0 });
    expect(segments[2]).toMatchObject({ label: 'Overhead', colorIndex: null });
    const total = segments.reduce((sum, segment) => sum + segment.mbps, 0);
    expect(total).toBeCloseTo(result.ingestMbps.typical);
  });

  it('includes sub-streams only when they are recorded', () => {
    const mainOnly = stateAfter(...KNOWN_4_MBPS);
    const withSub = stateAfter(...KNOWN_4_MBPS, {
      type: 'set-recorded-streams',
      recordedStreams: 'main-and-sub',
    });
    const subTotal = calculateBandwidth(withSub).groups[0]?.subTotalMbps.typical ?? 0;

    expect(ingestSegments(mainOnly, calculateBandwidth(mainOnly))[0]?.mbps).toBe(40);
    expect(ingestSegments(withSub, calculateBandwidth(withSub))[0]?.mbps).toBeCloseTo(
      40 + subTotal
    );
  });

  it('gives a zero overhead segment at 0% overhead', () => {
    const state = stateAfter(...KNOWN_4_MBPS, { type: 'set-overhead', overheadPercent: 0 });
    const segments = ingestSegments(state, calculateBandwidth(state));
    expect(segments.at(-1)?.mbps).toBeCloseTo(0);
  });
});
