import { calculateStorage, RAID_LEVELS } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  createInitialStorageCalculatorState,
  storageCalculatorReducer,
  type StorageCalculatorAction,
} from '../_state/storage-calculator-state';
import {
  describeDriveArray,
  LARGE_ARRAY_DRIVES,
  LARGE_ARRAY_NOTE,
  MAX_DRIVE_TILES,
  RAID_DETAILS,
} from './drive-array';

function summaryAfter(...actions: StorageCalculatorAction[]) {
  const state = actions.reduce(storageCalculatorReducer, createInitialStorageCalculatorState());
  return describeDriveArray(calculateStorage(state));
}

const raid5 = { type: 'update-storage', changes: { raidLevel: 'raid5' } } as const;
const daysMode = { type: 'set-mode', mode: 'days-from-capacity' } as const;

describe('describeDriveArray', () => {
  it('recommends drives in storage-needed mode', () => {
    const summary = summaryAfter(raid5);
    expect(summary.title).toMatch(/^Recommended: \d+ × 14 TB drives$/);
    expect(summary.description).toBe(
      'RAID 5 (single parity) · 14 TB drive size as selected · sized for the high estimate'
    );
    expect(summary.faultTolerant).toBe(true);
  });

  it('says when known bitrates set the size', () => {
    const summary = summaryAfter(raid5, {
      type: 'set-bitrate-source',
      id: 'g1',
      source: 'manual',
    });
    expect(summary.description).toBe(
      'RAID 5 (single parity) · 14 TB drive size as selected · sized for the known bitrates'
    );
  });

  it('describes the entered drives in days-from-capacity mode', () => {
    expect(summaryAfter(daysMode, raid5)).toEqual(
      expect.objectContaining({
        title: 'RAID 5 configuration',
        description: '1 drive can fail without losing recordings.',
      })
    );
    expect(
      summaryAfter(daysMode, { type: 'update-storage', changes: { raidLevel: 'raid6' } })
        .description
    ).toBe('2 drives can fail without losing recordings.');
    expect(summaryAfter(daysMode)).toEqual(
      expect.objectContaining({
        title: 'Independent drives (no RAID)',
        description: 'A failed drive loses the recordings stored on it.',
        faultTolerant: false,
      })
    );
  });

  it('draws at most a fixed number of drive tiles', () => {
    const many = summaryAfter(daysMode, {
      type: 'update-storage',
      changes: { driveCount: MAX_DRIVE_TILES + 4 },
    });
    expect(many.driveCount).toBe(MAX_DRIVE_TILES + 4);
    expect(many.tilesShown).toBe(MAX_DRIVE_TILES);
  });

  it('notes that a large drive count is usually split up', () => {
    const drives = (driveCount: number) =>
      summaryAfter(daysMode, { type: 'update-storage', changes: { driveCount } }).note;
    expect(drives(LARGE_ARRAY_DRIVES)).toBeNull();
    expect(drives(LARGE_ARRAY_DRIVES + 1)).toBe(LARGE_ARRAY_NOTE);
  });

  it('shows no protection as a warning, only without RAID', () => {
    const warnings = RAID_LEVELS.filter((level) =>
      RAID_DETAILS[level].tradeoffs.some((tradeoff) => tradeoff.warning)
    );
    expect(warnings).toEqual(['none']);
  });

  it('lists a benefit and a drawback for every RAID level', () => {
    for (const level of RAID_LEVELS) {
      const { tradeoffs } = RAID_DETAILS[level];
      expect(tradeoffs.some((tradeoff) => tradeoff.benefit)).toBe(true);
      expect(tradeoffs.some((tradeoff) => !tradeoff.benefit)).toBe(true);
    }
  });
});
