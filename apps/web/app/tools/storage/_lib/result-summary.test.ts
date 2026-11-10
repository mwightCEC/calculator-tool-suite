import { calculateStorage } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialStorageCalculatorState,
  storageCalculatorReducer,
  type StorageCalculatorAction,
  type StorageCalculatorState,
} from '../_state/storage-calculator-state';
import { buildSummaryItems } from './result-summary';

function stateAfter(...actions: StorageCalculatorAction[]): StorageCalculatorState {
  return actions.reduce(storageCalculatorReducer, createInitialStorageCalculatorState());
}

function summaryFor(state: StorageCalculatorState) {
  return buildSummaryItems(calculateStorage(state), state);
}

describe('buildSummaryItems', () => {
  it('lists drive capacity, then what the cameras record', () => {
    expect(summaryFor(createInitialStorageCalculatorState()).map((item) => item.label)).toEqual([
      'Recording capacity',
      'Usable capacity',
      'Raw capacity',
      'Total bitrate',
      'Daily recording',
      'Cameras',
    ]);
  });

  it('marks estimated recording figures as approximate, with their likely range', () => {
    const items = summaryFor(createInitialStorageCalculatorState());
    const bitrate = items.find((item) => item.label === 'Total bitrate');
    const daily = items.find((item) => item.label === 'Daily recording');
    expect(bitrate?.value).toMatch(/^~.* Mbps$/);
    expect(bitrate?.detail).toMatch(/^~.*–.* Mbps$/);
    expect(daily?.value).toMatch(/^~.* GB\/day$/);
    expect(daily?.detail).toMatch(/^~.*–.* GB\/day$/);
  });

  it('gives exact recording figures, without a range, when every bitrate is known', () => {
    const state = stateAfter(
      { type: 'update-group', id: 'g1', changes: { cameraCount: 10 } },
      { type: 'set-bitrate-source', id: 'g1', source: 'manual' },
      { type: 'update-group', id: 'g1', changes: { bitrate: { source: 'manual', mbps: 4 } } }
    );
    const bitrate = summaryFor(state).find((item) => item.label === 'Total bitrate');
    expect(bitrate).toEqual({ label: 'Total bitrate', value: '40 Mbps', detail: null });
  });

  it('describes the reserve, RAID level, drives and camera groups', () => {
    const state = stateAfter(
      { type: 'update-storage', changes: { raidLevel: 'raid5', reservePercent: 10 } },
      { type: 'add-group' }
    );
    const items = summaryFor(state);
    const detail = (label: string) => items.find((item) => item.label === label)?.detail;
    expect(detail('Recording capacity')).toBe('after 10% reserve');
    expect(detail('Usable capacity')).toMatch(/^RAID 5, \d+ drives$/);
    expect(detail('Raw capacity')).toMatch(/^\d+ × \d+ TB$/);
    expect(detail('Cameras')).toBe('in 2 groups');
  });

  it('uses the singular for one drive and one group', () => {
    const items = summaryFor(createInitialStorageCalculatorState());
    const detail = (label: string) => items.find((item) => item.label === label)?.detail;
    expect(detail('Usable capacity')).toBe('no RAID, 1 drive');
    expect(detail('Cameras')).toBe('in 1 group');
  });
});
