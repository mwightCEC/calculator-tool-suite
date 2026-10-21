import { describe, expect, it } from 'vitest';
import { groupColors } from '../../theme/palettes';
import { pickColorForInsert, pickGroupColor, repairGroupColors } from './group-colors';
import {
  addGroup,
  duplicateGroup,
  MAX_CAMERA_GROUPS,
  removeGroup,
  restoreGroup,
  type ListedGroup,
} from './group-list';

const PALETTE_SIZE = groupColors.length;
const colors = (groups: readonly ListedGroup[]) => groups.map((group) => group.colorIndex);
const withColors = (...indexes: number[]) => indexes.map((colorIndex) => ({ colorIndex }));

function hasNeighbourClash(list: readonly number[]): boolean {
  return list.some((color, index) => index > 0 && color === list[index - 1]);
}

const initial = (): ListedGroup[] => [{ id: 'g1', name: 'Camera group 1', colorIndex: 0 }];
const add = (groups: ListedGroup[]) => addGroup(groups, (fields) => fields);

/** Starts from one group and adds `count` more. */
function withAdded(count: number): ListedGroup[] {
  return Array.from({ length: count }).reduce<ListedGroup[]>((groups) => add(groups), initial());
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

describe('group list colour rules', () => {
  it('gives each duplicate of the same group a different colour (reported bug)', () => {
    const groups = ['g1', 'g1', 'g1'].reduce(
      (current, id) => duplicateGroup(current, id),
      withAdded(1)
    );
    expect(hasNeighbourClash(colors(groups))).toBe(false);
    expect(new Set(colors(groups)).size).toBe(groups.length);
  });

  it('re-colours a group that meets a same-coloured neighbour after a deletion', () => {
    // Seven groups wrap the palette: colours 0–5, then 0 again.
    const seven = withAdded(6);
    expect(colors(seven)).toEqual([0, 1, 2, 3, 4, 5, 0]);
    const groups = [2, 3, 4, 5, 6].reduce(
      (current, number) => removeGroup(current, `g${number}`),
      seven
    );
    expect(groups.map((group) => group.id)).toEqual(['g1', 'g7']);
    expect(colors(groups)[0]).toBe(0);
    expect(colors(groups)[1]).not.toBe(0);
  });

  it('keeps a restored group’s colour when it fits', () => {
    const three = withAdded(2);
    const removed = three[1]!;
    expect(restoreGroup(removeGroup(three, removed.id), removed, 1)).toEqual(three);
  });

  it('re-colours a restored group that would clash', () => {
    // g1(0) g2(1) g3(2): delete g2, re-colour g3 to 1 via a manual clash, then undo g2.
    const three = withAdded(2);
    const removed = three[1]!;
    const clashing = removeGroup(three, removed.id).map((group) =>
      group.id === 'g3' ? { ...group, colorIndex: removed.colorIndex } : group
    );
    const restored = restoreGroup(clashing, removed, 1);
    expect(hasNeighbourClash(colors(restored))).toBe(false);
    expect(restored.find((group) => group.id === 'g3')?.colorIndex).toBe(removed.colorIndex);
  });
});

describe('group list colour invariant (randomised)', () => {
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
      let groups = initial();
      const removed: { group: ListedGroup; index: number }[] = [];

      for (let step = 0; step < 60; step++) {
        const pick = groups[Math.floor(next() * groups.length)]!;
        const roll = next();
        if (roll < 0.3) {
          groups = add(groups);
        } else if (roll < 0.6) {
          groups = duplicateGroup(groups, pick.id);
        } else if (roll < 0.85 && groups.length > 1) {
          removed.push({ group: pick, index: groups.indexOf(pick) });
          groups = removeGroup(groups, pick.id);
        } else if (removed.length > 0) {
          const undo = removed.pop()!;
          groups = restoreGroup(groups, undo.group, undo.index);
        }

        if (hasNeighbourClash(colors(groups))) {
          clashes.push(`seed ${seed}, step ${step}: ${colors(groups).join(',')}`);
        }
        largest = Math.max(largest, groups.length);
      }
    }
    expect(clashes).toEqual([]);
    expect(largest).toBeLessThanOrEqual(MAX_CAMERA_GROUPS);
  });

  it('gives up to six added or duplicated groups all different colours', () => {
    const repeats: string[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const next = random(seed);
      let groups = initial();
      while (groups.length < PALETTE_SIZE) {
        const pick = groups[Math.floor(next() * groups.length)]!;
        groups = next() < 0.5 ? add(groups) : duplicateGroup(groups, pick.id);
      }
      if (new Set(colors(groups)).size !== PALETTE_SIZE) {
        repeats.push(`seed ${seed}: ${colors(groups).join(',')}`);
      }
    }
    expect(repeats).toEqual([]);
  });
});
