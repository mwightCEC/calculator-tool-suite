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

/** 10 cameras at a known 4 Mbps, remote viewing off: nothing is estimated. */
const KNOWN_ONLY: BandwidthCalculatorAction[] = [
  { type: 'update-group', id: 'g1', changes: { cameraCount: 10 } },
  { type: 'set-bitrate-source', id: 'g1', source: 'known-average' },
  { type: 'update-group', id: 'g1', changes: { bitrate: { source: 'known-average', mbps: 4 } } },
];

describe('buildPrintSummary', () => {
  it('names each group, including the default single group', () => {
    const single = summarize(createInitialBandwidthCalculatorState());
    expect(single.groups.map((group) => group.name)).toEqual(['Camera group 1']);
  });

  it('gives exact figures and no estimate notes when every bitrate is known', () => {
    const summary = summarize(stateAfter(...KNOWN_ONLY));

    expect(summary.bandwidth).toEqual({ value: '44 Mbps', likelyRange: null });
    expect(summary.sourceLabel).toBe('From known bitrates');
    expect(summary.keyFigures).toEqual([
      { label: 'Camera streams (before overhead)', value: '40 Mbps' },
      { label: 'Per camera (average)', value: '4 Mbps' },
      { label: 'Cameras', value: '10' },
    ]);
    expect(summary.notes).toHaveLength(1);
    expect(summary.notes[0]).toMatch(/up to 70% is OK, up to 90% is a caution/);
  });

  it('marks estimates and explains them', () => {
    const summary = summarize(stateAfter());

    expect(summary.sourceLabel).toBe('Estimated');
    expect(summary.bandwidth.value).toMatch(/^~/);
    expect(summary.groups[0]?.bitrate).toMatch(/^~[\d.]+ Mbps est\. \([\d.]+–[\d.]+\)$/);
    expect(summary.groups[0]?.scene).toBe('Medium');
    expect(summary.notes.length).toBeGreaterThan(1);
  });

  it('lists one row per link check, with the over-capacity warning', () => {
    const summary = summarize(
      stateAfter(
        ...KNOWN_ONLY,
        { type: 'update-network', changes: { uplinkMbps: 1000 } },
        // 1 viewer × 4 cameras × 4 Mbps + 10% = 17.6 Mbps.
        { type: 'update-remote-viewing', changes: { enabled: true, siteUploadMbps: 16 } }
      )
    );

    expect(summary.links).toEqual([
      {
        key: 'uplink',
        link: 'Uplink',
        capacity: '1 Gbps',
        load: 'Up to 44 Mbps',
        utilisation: '4%',
        status: 'OK',
      },
      {
        key: 'site-upload',
        link: 'Site upload',
        capacity: '16 Mbps',
        load: 'Up to 17.6 Mbps',
        utilisation: '110%',
        status: 'Over capacity',
      },
    ]);
    expect(summary.warning).toMatch(/^Traffic may exceed: Site upload\./);
  });

  it('has no link rows when no checks are entered', () => {
    expect(summarize(stateAfter()).links).toEqual([]);
  });

  it('describes groups and settings', () => {
    const summary = summarize(stateAfter(...KNOWN_ONLY, { type: 'duplicate-group', id: 'g1' }));

    expect(summary.groups.map((group) => group.key)).toEqual(['g1', 'g2']);
    expect(summary.groups[0]).toMatchObject({
      cameras: '10',
      camera: '4MP (1440p) · H.265 · 15 fps',
      scene: 'n/a (known bitrate)',
      bitrate: '4 Mbps VBR average',
      total: '40 Mbps',
    });
    expect(summary.settings).toEqual([
      { label: 'Remote viewing', value: 'Off' },
      { label: 'Overhead', value: '10%' },
    ]);
  });

  it('adds the remote viewing figure and settings when remote viewing is on', () => {
    const summary = summarize(
      stateAfter(...KNOWN_ONLY, {
        type: 'update-remote-viewing',
        changes: { enabled: true, viewers: 2, bitrateSource: 'custom', customMbps: 1 },
      })
    );

    // 2 viewers × 4 cameras × 1 Mbps + 10% overhead.
    expect(summary.keyFigures[0]).toEqual({ label: 'Remote viewing bandwidth', value: '8.8 Mbps' });
    expect(summary.settings[0]).toEqual({
      label: 'Remote viewing',
      value: '2 viewers × 4 cameras · Custom bitrate 1 Mbps',
    });
  });
});
