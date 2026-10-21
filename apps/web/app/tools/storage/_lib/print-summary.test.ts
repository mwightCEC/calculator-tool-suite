import { calculateStorage, isBitrateModelValidated } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialStorageCalculatorState,
  storageCalculatorReducer,
  type StorageCalculatorAction,
  type StorageCalculatorState,
} from '../_state/storage-calculator-state';
import { buildPrintSummary } from './print-summary';

function stateAfter(...actions: StorageCalculatorAction[]): StorageCalculatorState {
  return actions.reduce(storageCalculatorReducer, createInitialStorageCalculatorState());
}

function summarize(state: StorageCalculatorState) {
  return buildPrintSummary(state, calculateStorage(state));
}

/** Every group uses a known bitrate, so nothing is estimated. */
const KNOWN_ONLY = stateAfter(
  { type: 'update-group', id: 'g1', changes: { cameraCount: 10 } },
  { type: 'set-bitrate-source', id: 'g1', source: 'known-average' },
  {
    type: 'update-group',
    id: 'g1',
    changes: { bitrate: { source: 'known-average', mbps: 4 } },
  }
);

describe('buildPrintSummary', () => {
  it('summarises an estimated storage-needed calculation', () => {
    const summary = summarize(createInitialStorageCalculatorState());
    expect(summary.modeLabel).toBe('Storage needed');
    expect(summary.sourceLabel).toBe('Estimated');
    expect(summary.sizedForHigh).toBe(true);
    expect(summary.headline.likelyRange).toMatch(/^likely .+ TB$/);
    expect(summary.keyFigures.map((figure) => figure.label)).toEqual([
      'Total bitrate',
      'Daily write',
      'Retention target',
      'Usable capacity',
    ]);
    expect(summary.keyFigures[0]?.value).toMatch(/^~.+ Mbps \(.+\)$/);
  });

  it('shows exact values and no range when every bitrate is known', () => {
    const summary = summarize(KNOWN_ONLY);
    expect(summary.sourceLabel).toBe('From known bitrates');
    expect(summary.sizedForHigh).toBe(false);
    expect(summary.headline.likelyRange).toBeNull();
    expect(summary.keyFigures[0]?.value).toBe('40 Mbps');
    expect(summary.groups[0]).toEqual(
      expect.objectContaining({
        bitrate: '4 Mbps known average',
        scene: 'n/a (known bitrate)',
        totalMbps: '40 Mbps',
        perDay: '432 GB',
      })
    );
  });

  it('lists one camera group row per group, in order', () => {
    const summary = summarize(
      stateAfter(
        { type: 'add-group' },
        { type: 'update-group', id: 'g2', changes: { name: 'Parking lot' } }
      )
    );
    expect(summary.groups.map((group) => group.name)).toEqual(['Camera group 1', 'Parking lot']);
    expect(summary.groups[0]?.camera).toBe('4MP (1440p) · H.265 · 15 fps');
  });

  it('gives rows unique keys even when duplicated groups look identical', () => {
    const summary = summarize(
      stateAfter({ type: 'duplicate-group', id: 'g1' }, { type: 'duplicate-group', id: 'g1' })
    );
    const groupKeys = summary.groups.map((group) => group.key);
    const capacityKeys = summary.capacity.map((row) => row.key);
    expect(new Set(summary.groups.map((group) => group.name)).size).toBeLessThan(groupKeys.length);
    expect(new Set(groupKeys).size).toBe(groupKeys.length);
    expect(new Set(capacityKeys).size).toBe(capacityKeys.length);
  });

  it('breaks raw capacity down by group, reserve, parity and unused, plus the total', () => {
    const summary = summarize(KNOWN_ONLY);
    expect(summary.capacity.map((row) => row.label)).toEqual([
      'Footage: Camera group 1',
      'Reserve',
      'RAID parity',
      'Unused',
      'Raw capacity',
    ]);
    expect(summary.capacity.at(-1)).toEqual({
      key: 'total',
      label: 'Raw capacity',
      tb: '42 TB',
      share: '100%',
      isTotal: true,
    });
  });

  it('describes days-from-capacity retention as the worst case', () => {
    const summary = summarize(stateAfter({ type: 'set-mode', mode: 'days-from-capacity' }));
    const retention = summary.keyFigures.find((figure) => figure.label === 'Estimated retention');
    expect(retention?.value).toMatch(/^\d+ days worst case \(likely \d+–\d+\)$/);
    expect(summary.settings[0]).toEqual({ label: 'Drives', value: '4' });
    expect(summary.sizedForHigh).toBe(false);
  });

  it('lists storage settings for the mode', () => {
    expect(summarize(KNOWN_ONLY).settings).toEqual([
      { label: 'Retention target', value: '30 days' },
      { label: 'Drive size', value: '14 TB' },
      { label: 'RAID', value: 'RAID 5' },
      { label: 'Reserve', value: '10%' },
    ]);
  });

  it('adds estimate notes only when bitrates are estimated', () => {
    const estimated = summarize(createInitialStorageCalculatorState()).notes;
    const known = summarize(KNOWN_ONLY).notes;
    expect(known).toHaveLength(1);
    expect(known[0]).toMatch(/decimal TB/);
    expect(estimated.length).toBe(isBitrateModelValidated ? 2 : 3);
    expect(estimated.join(' ')).toMatch(/planning estimates/);
  });
});
