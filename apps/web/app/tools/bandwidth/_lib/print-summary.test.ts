import { calculateBandwidth } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  bandwidthCalculatorReducer,
  createInitialBandwidthCalculatorState,
  type BandwidthCalculatorAction,
  type BandwidthCalculatorState,
} from '../_state/bandwidth-calculator-state';
import { buildPrintSummary } from './print-summary';

function stateAfter(...actions: BandwidthCalculatorAction[]): BandwidthCalculatorState {
  return actions.reduce(bandwidthCalculatorReducer, createInitialBandwidthCalculatorState());
}

function summarize(state: BandwidthCalculatorState) {
  return buildPrintSummary(state, calculateBandwidth(state));
}

/** 10 cameras at a known 4 Mbps, recording main only, nobody viewing: nothing is estimated. */
const KNOWN_ONLY: BandwidthCalculatorAction[] = [
  { type: 'update-group', id: 'g1', changes: { cameraCount: 10 } },
  { type: 'set-bitrate-source', id: 'g1', source: 'known-average' },
  { type: 'update-group', id: 'g1', changes: { bitrate: { source: 'known-average', mbps: 4 } } },
  { type: 'update-remote-viewing', changes: { viewers: 0 } },
];

describe('buildPrintSummary', () => {
  it('gives exact figures and no estimate notes when every bitrate is known', () => {
    const summary = summarize(stateAfter(...KNOWN_ONLY));

    expect(summary.ingest).toEqual({ value: '44 Mbps', likelyRange: null });
    expect(summary.sourceLabel).toBe('From known bitrates');
    expect(summary.keyFigures).toContainEqual({ label: 'Main streams', value: '40 Mbps' });
    expect(summary.keyFigures).toContainEqual({ label: 'Remote viewing upload', value: '0 Mbps' });
    expect(summary.notes).toHaveLength(1);
    expect(summary.notes[0]).toMatch(/up to 70% is OK, up to 90% is a caution/);
  });

  it('marks estimates and explains them', () => {
    const summary = summarize(stateAfter());

    expect(summary.sourceLabel).toBe('Estimated');
    expect(summary.ingest.value).toMatch(/^~/);
    expect(summary.groups[0]?.bitrate).toMatch(/^~[\d.]+ Mbps est\. \([\d.]+–[\d.]+\)$/);
    expect(summary.groups[0]?.scene).toBe('Medium');
    expect(summary.notes.length).toBeGreaterThan(1);
  });

  it('lists one row per link check, with the over-capacity warning', () => {
    const summary = summarize(
      stateAfter(...KNOWN_ONLY, {
        type: 'update-network',
        changes: { recorderLimitMbps: 40, uplinkMbps: 1000 },
      })
    );

    expect(summary.links).toEqual([
      {
        key: 'recorder-limit',
        link: 'Recorder limit',
        capacity: '40 Mbps',
        load: 'Up to 44 Mbps',
        utilisation: '110%',
        status: 'Over capacity',
      },
      {
        key: 'uplink',
        link: 'Uplink',
        capacity: '1 Gbps',
        load: 'Up to 44 Mbps',
        utilisation: '4%',
        status: 'OK',
      },
    ]);
    expect(summary.warning).toMatch(/^Traffic may exceed: Recorder limit\./);
  });

  it('has no link rows when no checks are entered', () => {
    expect(summarize(stateAfter()).links).toEqual([]);
  });

  it('describes groups, sub-streams and settings', () => {
    const summary = summarize(
      stateAfter(
        ...KNOWN_ONLY,
        { type: 'duplicate-group', id: 'g1' },
        { type: 'set-recorded-streams', recordedStreams: 'main-and-sub' }
      )
    );

    expect(summary.groups.map((group) => group.key)).toEqual(['g1', 'g2']);
    expect(summary.groups[0]).toMatchObject({
      cameras: '10',
      camera: '4MP (1440p) · H.265 · 15 fps',
      scene: 'n/a (known bitrate)',
      subStream: 'D1',
      bitrate: '4 Mbps known average',
      mainTotal: '40 Mbps',
    });
    expect(summary.keyFigures.map((figure) => figure.label)).toContain('Sub-streams (recorded)');
    expect(summary.settings).toEqual([
      { label: 'Recorded streams', value: 'Main + sub' },
      { label: 'Remote viewing', value: 'No remote viewers' },
      { label: 'Overhead', value: '10%' },
    ]);
  });
});
