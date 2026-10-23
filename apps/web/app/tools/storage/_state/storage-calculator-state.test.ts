import { MAX_GROUP_NAME_LENGTH } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { groupColors } from '../../../../theme/palettes';
import {
  createInitialStorageCalculatorState,
  describeSwitchToSimple,
  storageCalculatorReducer as reduce,
  storageCalculatorStateSchema,
  type StorageCalculatorAction,
  type StorageCalculatorState,
} from './storage-calculator-state';

/** The default state switched to Advanced, so groups can be added. */
const initial = () =>
  reduce(createInitialStorageCalculatorState(), { type: 'set-input-mode', inputMode: 'advanced' });

/** Applies actions in order, starting from the initial state. */
function apply(...actions: StorageCalculatorAction[]): StorageCalculatorState {
  return actions.reduce(reduce, initial());
}

const names = (state: StorageCalculatorState) => state.cameraGroups.map((group) => group.name);
const ids = (state: StorageCalculatorState) => state.cameraGroups.map((group) => group.id);

describe('initial state', () => {
  it('passes the state schema', () => {
    expect(storageCalculatorStateSchema.safeParse(initial()).success).toBe(true);
  });

  it('starts with one group using the first palette colour', () => {
    expect(initial().cameraGroups).toEqual([
      expect.objectContaining({ id: 'g1', name: 'Camera group 1', colorIndex: 0 }),
    ]);
  });

  it('defaults to no RAID and no reserve', () => {
    expect(initial().storage).toEqual(
      expect.objectContaining({ raidLevel: 'none', reservePercent: 0 })
    );
  });
});

describe('input mode', () => {
  const simple = createInitialStorageCalculatorState;
  /** Advanced, with three groups, RAID 5 and a 10% reserve. */
  const busy = () =>
    apply(
      { type: 'add-group' },
      { type: 'add-group' },
      { type: 'update-group', id: 'g1', changes: { name: 'Lobby', cameraCount: 3 } },
      { type: 'update-storage', changes: { raidLevel: 'raid5', reservePercent: 10 } }
    );

  it('starts new visitors in Simple mode', () => {
    expect(simple().inputMode).toBe('simple');
  });

  it('keeps only the first group and resets RAID and reserve when switching to Simple', () => {
    const state = reduce(busy(), { type: 'set-input-mode', inputMode: 'simple' });
    expect(state.inputMode).toBe('simple');
    expect(state.cameraGroups).toEqual([busy().cameraGroups[0]]);
    expect(state.storage).toEqual(
      expect.objectContaining({ raidLevel: 'none', reservePercent: 0 })
    );
    expect(storageCalculatorStateSchema.safeParse(state).success).toBe(true);
  });

  it('describes what switching to Simple changes, for the Undo message', () => {
    expect(describeSwitchToSimple(busy())).toEqual([
      'removed 2 camera groups',
      'RAID set to none',
      'reserve set to 0%',
    ]);
    expect(describeSwitchToSimple(apply({ type: 'add-group' }))).toEqual([
      'removed 1 camera group',
    ]);
    expect(describeSwitchToSimple(initial())).toEqual([]);
    expect(describeSwitchToSimple(simple())).toEqual([]);
  });

  it('undoes a switch by loading the previous state', () => {
    const before = busy();
    const switched = reduce(before, { type: 'set-input-mode', inputMode: 'simple' });
    expect(reduce(switched, { type: 'load-state', state: before })).toEqual(before);
  });

  it('keeps everything when switching to Advanced', () => {
    const state = simple();
    const advanced = reduce(state, { type: 'set-input-mode', inputMode: 'advanced' });
    expect(advanced).toEqual({ ...state, inputMode: 'advanced' });
    expect(reduce(advanced, { type: 'set-input-mode', inputMode: 'advanced' })).toBe(advanced);
  });

  it('keeps Simple mode within its rules whatever the action', () => {
    const state = simple();
    const group = state.cameraGroups[0]!;
    const actions: StorageCalculatorAction[] = [
      { type: 'add-group' },
      { type: 'duplicate-group', id: group.id },
      { type: 'restore-groups', groups: busy().cameraGroups },
      { type: 'update-storage', changes: { raidLevel: 'raid6', reservePercent: 15 } },
    ];
    for (const action of actions) {
      const next = reduce(state, action);
      expect(next.cameraGroups).toHaveLength(1);
      expect(next.storage).toEqual(
        expect.objectContaining({ raidLevel: 'none', reservePercent: 0 })
      );
    }
  });

  it('rejects a Simple state with several groups or RAID in the schema', () => {
    const twoGroups = { ...simple(), cameraGroups: busy().cameraGroups.slice(0, 2) };
    const withRaid = { ...simple(), storage: { ...simple().storage, raidLevel: 'raid5' } };
    expect(storageCalculatorStateSchema.safeParse(twoGroups).success).toBe(false);
    expect(storageCalculatorStateSchema.safeParse(withRaid).success).toBe(false);
  });
});

describe('add-group', () => {
  it('adds a numbered group with the next palette colour', () => {
    const state = apply({ type: 'add-group' });
    expect(state.cameraGroups[1]).toEqual(
      expect.objectContaining({ id: 'g2', name: 'Camera group 2', colorIndex: 1 })
    );
  });

  it('wraps around the palette', () => {
    const actions = Array.from(
      { length: groupColors.length },
      () => ({ type: 'add-group' }) as const
    );
    const state = apply(...actions);
    expect(state.cameraGroups.at(-1)?.colorIndex).toBe(0);
  });

  it('uses the next unused number after a deletion', () => {
    const state = apply(
      { type: 'add-group' },
      { type: 'add-group' },
      { type: 'remove-group', id: 'g2' },
      { type: 'add-group' }
    );
    expect(ids(state)).toEqual(['g1', 'g3', 'g4']);
  });

  it('stops at the group limit', () => {
    const actions = Array.from(
      { length: MAX_CAMERA_GROUPS + 3 },
      () => ({ type: 'add-group' }) as const
    );
    expect(apply(...actions).cameraGroups).toHaveLength(MAX_CAMERA_GROUPS);
  });
});

describe('duplicate-group', () => {
  it('inserts a copy after its source with a new id and colour', () => {
    const state = apply({ type: 'add-group' }, { type: 'duplicate-group', id: 'g1' });
    expect(ids(state)).toEqual(['g1', 'g3', 'g2']);
    expect(state.cameraGroups[1]).toEqual(
      expect.objectContaining({ name: 'Camera group 1 copy', colorIndex: 2 })
    );
  });

  it('keeps the copied settings', () => {
    const state = apply(
      { type: 'update-group', id: 'g1', changes: { cameraCount: 12, codec: 'mjpeg' } },
      { type: 'duplicate-group', id: 'g1' }
    );
    expect(state.cameraGroups[1]).toEqual(
      expect.objectContaining({ cameraCount: 12, codec: 'mjpeg' })
    );
  });

  it('keeps the name within the maximum length', () => {
    const longName = 'x'.repeat(MAX_GROUP_NAME_LENGTH);
    const state = apply(
      { type: 'update-group', id: 'g1', changes: { name: longName } },
      { type: 'duplicate-group', id: 'g1' }
    );
    expect(state.cameraGroups[1]?.name).toHaveLength(MAX_GROUP_NAME_LENGTH);
  });

  it('ignores unknown ids and the group limit', () => {
    const state = initial();
    expect(reduce(state, { type: 'duplicate-group', id: 'nope' })).toBe(state);

    const full = apply(
      ...Array.from({ length: MAX_CAMERA_GROUPS }, () => ({ type: 'add-group' }) as const)
    );
    expect(reduce(full, { type: 'duplicate-group', id: 'g1' })).toBe(full);
  });
});

describe('remove-group and restore-group', () => {
  it('removes a group', () => {
    const state = apply({ type: 'add-group' }, { type: 'remove-group', id: 'g1' });
    expect(ids(state)).toEqual(['g2']);
  });

  it('never removes the last group', () => {
    const state = initial();
    expect(reduce(state, { type: 'remove-group', id: 'g1' })).toBe(state);
  });

  it('restores a removed group at its original position (undo)', () => {
    const three = apply({ type: 'add-group' }, { type: 'add-group' });
    const removed = three.cameraGroups[1]!;
    const undo: StorageCalculatorAction[] = [
      { type: 'remove-group', id: removed.id },
      { type: 'restore-group', group: removed, index: 1 },
    ];
    const state = undo.reduce(reduce, three);
    expect(state).toEqual(three);
  });

  it('clamps the restore position to the end of the list', () => {
    const two = apply({ type: 'add-group' });
    const removed = two.cameraGroups[0]!;
    const undo: StorageCalculatorAction[] = [
      { type: 'remove-group', id: removed.id },
      { type: 'restore-group', group: removed, index: 99 },
    ];
    const state = undo.reduce(reduce, two);
    expect(ids(state)).toEqual(['g2', 'g1']);
  });

  it('does not restore a group that is already present', () => {
    const state = initial();
    const group = state.cameraGroups[0]!;
    expect(reduce(state, { type: 'restore-group', group, index: 0 })).toBe(state);
  });
});

describe('clear-groups and restore-groups', () => {
  const edited = apply(
    { type: 'add-group' },
    { type: 'update-group', id: 'g1', changes: { cameraCount: 3 } },
    { type: 'update-storage', changes: { retentionDays: 60 } }
  );

  it('resets the groups to the single default group and keeps the storage settings', () => {
    const cleared = reduce(edited, { type: 'clear-groups' });
    expect(cleared.cameraGroups).toEqual(initial().cameraGroups);
    expect(cleared.storage).toBe(edited.storage);
  });

  it('puts the previous groups back (undo)', () => {
    const cleared = reduce(edited, { type: 'clear-groups' });
    expect(reduce(cleared, { type: 'restore-groups', groups: edited.cameraGroups })).toEqual(
      edited
    );
  });
});

describe('update-group and set-bitrate-source', () => {
  it('changes only the targeted group', () => {
    const state = apply(
      { type: 'add-group' },
      { type: 'update-group', id: 'g2', changes: { name: 'Lobby', cameraCount: 3 } }
    );
    expect(names(state)).toEqual(['Camera group 1', 'Lobby']);
    expect(state.cameraGroups[0]?.cameraCount).toBe(initial().cameraGroups[0]?.cameraCount);
    expect(state.cameraGroups[1]?.cameraCount).toBe(3);
  });

  it('prefills an entered bitrate when leaving Estimate', () => {
    const state = apply({ type: 'set-bitrate-source', id: 'g1', source: 'bitrate-cap' });
    const bitrate = state.cameraGroups[0]?.bitrate;
    expect(bitrate?.source).toBe('bitrate-cap');
    expect(bitrate && 'mbps' in bitrate && bitrate.mbps).toBeGreaterThan(0);
  });

  it('returns to the estimate', () => {
    const state = apply(
      { type: 'set-bitrate-source', id: 'g1', source: 'known-average' },
      { type: 'set-bitrate-source', id: 'g1', source: 'estimate' }
    );
    expect(state.cameraGroups[0]?.bitrate).toEqual({ source: 'estimate' });
  });
});

describe('set-mode and update-storage', () => {
  it('switches the calculation mode', () => {
    expect(apply({ type: 'set-mode', mode: 'days-from-capacity' }).mode).toBe('days-from-capacity');
  });

  it('snaps the drive count to the new RAID level', () => {
    const state = apply(
      { type: 'update-storage', changes: { driveCount: 5 } },
      { type: 'update-storage', changes: { raidLevel: 'raid10' } }
    );
    expect(state.storage.driveCount).toBe(6);
  });

  it('raises a drive count below the RAID minimum', () => {
    const state = apply({ type: 'update-storage', changes: { raidLevel: 'raid6', driveCount: 2 } });
    expect(state.storage.driveCount).toBe(4);
  });

  it('keeps other storage settings', () => {
    const state = apply({ type: 'update-storage', changes: { reservePercent: 15 } });
    expect(state.storage).toEqual({ ...initial().storage, reservePercent: 15 });
  });
});

describe('load-state', () => {
  it('replaces the state and keeps the drive count valid', () => {
    const loaded: StorageCalculatorState = {
      ...initial(),
      mode: 'days-from-capacity',
      storage: { ...initial().storage, raidLevel: 'raid10', driveCount: 5 },
    };
    const state = reduce(initial(), { type: 'load-state', state: loaded });
    expect(state.mode).toBe('days-from-capacity');
    expect(state.storage.driveCount).toBe(6);
  });

  it('repairs clashing colours when loading a shared state', () => {
    const base = apply({ type: 'add-group' }, { type: 'add-group' });
    const shared: StorageCalculatorState = {
      ...base,
      cameraGroups: base.cameraGroups.map((group) => ({ ...group, colorIndex: 4 })),
    };
    const colors = reduce(base, { type: 'load-state', state: shared }).cameraGroups.map(
      (group) => group.colorIndex
    );
    expect(colors.some((color, index) => index > 0 && color === colors[index - 1])).toBe(false);
  });
});

describe('reducer purity', () => {
  it('does not mutate the previous state', () => {
    const before = apply({ type: 'add-group' });
    const snapshot = structuredClone(before);
    reduce(before, { type: 'duplicate-group', id: 'g1' });
    reduce(before, { type: 'remove-group', id: 'g2' });
    reduce(before, { type: 'update-storage', changes: { raidLevel: 'raid6' } });
    expect(before).toEqual(snapshot);
  });
});

describe('storageCalculatorStateSchema', () => {
  it('rejects duplicate group ids', () => {
    const state = apply({ type: 'add-group' });
    state.cameraGroups[1] = { ...state.cameraGroups[1]!, id: 'g1' };
    expect(storageCalculatorStateSchema.safeParse(state).success).toBe(false);
  });

  it('rejects a colour index outside the palette', () => {
    const state = initial();
    state.cameraGroups[0] = { ...state.cameraGroups[0]!, colorIndex: groupColors.length };
    expect(storageCalculatorStateSchema.safeParse(state).success).toBe(false);
  });

  it('rejects more groups than the limit', () => {
    const group = initial().cameraGroups[0]!;
    const tooMany = Array.from({ length: MAX_CAMERA_GROUPS + 1 }, (_, index) => ({
      ...group,
      id: `g${index + 1}`,
    }));
    expect(
      storageCalculatorStateSchema.safeParse({ ...initial(), cameraGroups: tooMany }).success
    ).toBe(false);
  });
});
