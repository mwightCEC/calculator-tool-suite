import { describe, expect, it } from 'vitest';
import { groupColors } from '../../../../theme/palettes';
import { pickColorForInsert, pickGroupColor, repairGroupColors } from './group-colors';
import {
  createInitialStorageCalculatorState,
  MAX_CAMERA_GROUPS,
  storageCalculatorReducer as reduce,
  type StorageCalculatorAction,
  type StorageCalculatorState,
} from './storage-calculator-state';

const PALETTE_SIZE = groupColors.length;
const colors = (state: StorageCalculatorState) =>
  state.cameraGroups.map((group) => group.colorIndex);
const withColors = (...indexes: number[]) => indexes.map((colorIndex) => ({ colorIndex }));

function hasNeighbourClash(list: readonly number[]): boolean {
  return list.some((color, index) => index > 0 && color === list[index - 1]);
}

function apply(...actions: StorageCalculatorAction[]): StorageCalculatorState {
  return actions.reduce(reduce, createInitialStorageCalculatorState());
}

describe('pickGroupColor', () => {
  it('continues the palette after the group above when everything is equally used', () => {
    expect(pickGroupColor({ previous: 0, used: [0] })).toBe(1);
    expect(pickGroupColor({ previous: PALETTE_SIZE - 1, used: [0, 1, 2, 3, 4, 5] })).toBe(0);
  });

  it('avoids both neighbours', () => {
    expect(pickGroupColor({ previous: 0, next: 1, used: [0, 1] })).toBe(2);
  });

  it('prefers a colour nobody uses yet', () => {
    expect(pickGroupColor({ previous: 0, next: 2, used: [0, 1, 2, 3] })).toBe(4);
  });

  it('starts at the first colour when there is nothing above', () => {
    expect(pickGroupColor({ used: [] })).toBe(0);
    expect(pickGroupColor({ next: 0, used: [0] })).toBe(1);
  });
});

describe('pickColorForInsert', () => {
  it('looks at the groups on either side of the insert position', () => {
    expect(pickColorForInsert(withColors(0, 1), 1)).toBe(2);
    expect(pickColorForInsert(withColors(0, 1), 2)).toBe(2);
    expect(pickColorForInsert(withColors(0, 1), 0)).not.toBe(0);
  });
});

describe('repairGroupColors', () => {
  it('re-colours only the second of two clashing neighbours', () => {
    const groups = withColors(0, 0, 1);
    const repaired = repairGroupColors(groups);
    expect(repaired[0]).toBe(groups[0]);
    expect(repaired[2]).toBe(groups[2]);
    expect(repaired[1]!.colorIndex).toBe(2);
  });

  it('returns groups without clashes unchanged', () => {
    const groups = withColors(0, 1, 0, 1);
    expect(repairGroupColors(groups)).toEqual(groups);
  });

  it('fixes a run of identical colours', () => {
    expect(
      hasNeighbourClash(repairGroupColors(withColors(3, 3, 3, 3, 3)).map((g) => g.colorIndex))
    ).toBe(false);
  });
});

describe('reducer colour rules', () => {
  it('gives each duplicate of the same group a different colour (reported bug)', () => {
    const state = apply(
      { type: 'add-group' },
      { type: 'duplicate-group', id: 'g1' },
      { type: 'duplicate-group', id: 'g1' },
      { type: 'duplicate-group', id: 'g1' }
    );
    expect(hasNeighbourClash(colors(state))).toBe(false);
    expect(new Set(colors(state)).size).toBe(state.cameraGroups.length);
  });

  it('re-colours a group that meets a same-coloured neighbour after a deletion', () => {
    // Seven groups wrap the palette: colours 0–5, then 0 again.
    const seven = apply(...Array.from({ length: 6 }, () => ({ type: 'add-group' }) as const));
    expect(colors(seven)).toEqual([0, 1, 2, 3, 4, 5, 0]);
    const state = [2, 3, 4, 5, 6].reduce<StorageCalculatorState>(
      (current, number) => reduce(current, { type: 'remove-group', id: `g${number}` }),
      seven
    );
    expect(state.cameraGroups.map((group) => group.id)).toEqual(['g1', 'g7']);
    expect(colors(state)[0]).toBe(0);
    expect(colors(state)[1]).not.toBe(0);
  });

  it('keeps a restored group’s colour when it fits', () => {
    const three = apply({ type: 'add-group' }, { type: 'add-group' });
    const removed = three.cameraGroups[1]!;
    const afterUndo = reduce(reduce(three, { type: 'remove-group', id: removed.id }), {
      type: 'restore-group',
      group: removed,
      index: 1,
    });
    expect(afterUndo).toEqual(three);
  });

  it('re-colours a restored group that would clash', () => {
    // g1(0) g2(1) g3(2): delete g2, re-colour g3 to 1 via a manual clash, then undo g2.
    const three = apply({ type: 'add-group' }, { type: 'add-group' });
    const removed = three.cameraGroups[1]!;
    const afterDelete = reduce(three, { type: 'remove-group', id: removed.id });
    const clashing: StorageCalculatorState = {
      ...afterDelete,
      cameraGroups: afterDelete.cameraGroups.map((group) =>
        group.id === 'g3' ? { ...group, colorIndex: removed.colorIndex } : group
      ),
    };
    const restored = reduce(clashing, { type: 'restore-group', group: removed, index: 1 });
    expect(hasNeighbourClash(colors(restored))).toBe(false);
    expect(restored.cameraGroups.find((group) => group.id === 'g3')?.colorIndex).toBe(
      removed.colorIndex
    );
  });

  it('repairs clashing colours when loading a shared state', () => {
    const base = apply({ type: 'add-group' }, { type: 'add-group' });
    const shared: StorageCalculatorState = {
      ...base,
      cameraGroups: base.cameraGroups.map((group) => ({ ...group, colorIndex: 4 })),
    };
    expect(hasNeighbourClash(colors(reduce(base, { type: 'load-state', state: shared })))).toBe(
      false
    );
  });
});

describe('reducer colour invariant (randomised)', () => {
  /** Small deterministic generator so failures are reproducible. */
  function random(seed: number) {
    let value = seed;
    return () => {
      value = (value * 1_103_515_245 + 12_345) % 2_147_483_648;
      return value / 2_147_483_648;
    };
  }

  it('never puts two same-coloured groups next to each other', () => {
    // Every clash is recorded with its seed and step, so a failure is reproducible.
    const clashes: string[] = [];
    let largest = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const next = random(seed);
      let state = createInitialStorageCalculatorState();
      const removed: { group: StorageCalculatorState['cameraGroups'][number]; index: number }[] =
        [];

      for (let step = 0; step < 60; step++) {
        const groups = state.cameraGroups;
        const pick = groups[Math.floor(next() * groups.length)]!;
        const roll = next();
        if (roll < 0.3) {
          state = reduce(state, { type: 'add-group' });
        } else if (roll < 0.6) {
          state = reduce(state, { type: 'duplicate-group', id: pick.id });
        } else if (roll < 0.85 && groups.length > 1) {
          removed.push({ group: pick, index: groups.indexOf(pick) });
          state = reduce(state, { type: 'remove-group', id: pick.id });
        } else if (removed.length > 0) {
          const undo = removed.pop()!;
          state = reduce(state, { type: 'restore-group', group: undo.group, index: undo.index });
        }

        if (hasNeighbourClash(colors(state))) {
          clashes.push(`seed ${seed}, step ${step}: ${colors(state).join(',')}`);
        }
        largest = Math.max(largest, state.cameraGroups.length);
      }
    }
    expect(clashes).toEqual([]);
    expect(largest).toBeLessThanOrEqual(MAX_CAMERA_GROUPS);
  });

  it('gives up to six added or duplicated groups all different colours', () => {
    const repeats: string[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const next = random(seed);
      let state = createInitialStorageCalculatorState();
      while (state.cameraGroups.length < PALETTE_SIZE) {
        const groups = state.cameraGroups;
        const pick = groups[Math.floor(next() * groups.length)]!;
        state =
          next() < 0.5
            ? reduce(state, { type: 'add-group' })
            : reduce(state, { type: 'duplicate-group', id: pick.id });
      }
      if (new Set(colors(state)).size !== PALETTE_SIZE) {
        repeats.push(`seed ${seed}: ${colors(state).join(',')}`);
      }
    }
    expect(repeats).toEqual([]);
  });
});
