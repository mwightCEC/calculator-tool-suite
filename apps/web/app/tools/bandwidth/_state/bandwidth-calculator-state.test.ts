import { bandwidthInputSchema } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { groupColors } from '../../../../theme/palettes';
import {
  bandwidthCalculatorReducer as reduce,
  bandwidthCalculatorStateSchema,
  createInitialBandwidthCalculatorState,
  describeSwitchToSimple,
  SIMPLE_BANDWIDTH_SETTINGS,
  type BandwidthCalculatorAction,
  type BandwidthCalculatorState,
} from './bandwidth-calculator-state';

/** The default state switched to Advanced, so every setting can change. */
const initial = () =>
  reduce(createInitialBandwidthCalculatorState(), {
    type: 'set-input-mode',
    inputMode: 'advanced',
  });

/** Applies actions in order, starting from the initial state. */
function apply(...actions: BandwidthCalculatorAction[]): BandwidthCalculatorState {
  return actions.reduce(reduce, initial());
}

const ids = (state: BandwidthCalculatorState) => state.cameraGroups.map((group) => group.id);
const colors = (state: BandwidthCalculatorState) =>
  state.cameraGroups.map((group) => group.colorIndex);

describe('initial state', () => {
  it('passes the state schema and calc-core’s input schema', () => {
    expect(bandwidthCalculatorStateSchema.safeParse(initial()).success).toBe(true);
    expect(bandwidthInputSchema.safeParse(initial()).success).toBe(true);
  });

  it('uses the defaults: remote viewing off, no checks, 10%', () => {
    const state = initial();
    expect(state.cameraGroups).toEqual([
      expect.objectContaining({ id: 'g1', name: 'Camera group 1', colorIndex: 0 }),
    ]);
    expect(state.remoteViewing).toEqual({
      enabled: false,
      viewers: 1,
      camerasPerViewer: 4,
      bitrateSource: 'camera',
      customMbps: 2,
      siteUploadMbps: null,
    });
    expect(state.network).toEqual({ uplinkMbps: null });
    expect(state.overheadPercent).toBe(10);
  });
});

describe('input mode', () => {
  const simple = createInitialBandwidthCalculatorState;
  /** Advanced, with three groups and every hidden setting changed. */
  const busy = () =>
    apply(
      { type: 'add-group' },
      { type: 'add-group' },
      { type: 'update-group', id: 'g1', changes: { name: 'Lobby' } },
      {
        type: 'update-remote-viewing',
        changes: { enabled: true, viewers: 2, camerasPerViewer: 9, siteUploadMbps: 50 },
      },
      { type: 'update-network', changes: { uplinkMbps: 1000 } },
      { type: 'set-overhead', overheadPercent: 20 }
    );

  it('starts new visitors in Simple mode, whose fixed settings are the defaults', () => {
    const state = simple();
    expect(state.inputMode).toBe('simple');
    expect(state.remoteViewing.enabled).toBe(false);
    expect(state.network.uplinkMbps).toBeNull();
    expect(state.overheadPercent).toBe(SIMPLE_BANDWIDTH_SETTINGS.overheadPercent);
  });

  it('keeps the first group and turns remote viewing off when switching to Simple', () => {
    const state = reduce(busy(), { type: 'set-input-mode', inputMode: 'simple' });
    expect(state.inputMode).toBe('simple');
    expect(state.cameraGroups).toEqual([busy().cameraGroups[0]]);
    // The remote viewing settings are kept for switching back; only the switch turns off.
    expect(state.remoteViewing).toEqual({ ...busy().remoteViewing, enabled: false });
    expect(state.network).toEqual({ uplinkMbps: null });
    expect(state.overheadPercent).toBe(10);
    expect(bandwidthCalculatorStateSchema.safeParse(state).success).toBe(true);
  });

  it('describes what switching to Simple changes, for the Undo message', () => {
    expect(describeSwitchToSimple(busy())).toEqual([
      'removed 2 camera groups',
      'remote viewing turned off',
      'uplink check turned off',
      'overhead set to 10%',
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
    expect(reduce(state, { type: 'set-input-mode', inputMode: 'advanced' })).toEqual({
      ...state,
      inputMode: 'advanced',
    });
  });

  it('keeps Simple mode within its rules whatever the action', () => {
    const state = simple();
    const actions: BandwidthCalculatorAction[] = [
      { type: 'add-group' },
      { type: 'duplicate-group', id: 'g1' },
      { type: 'restore-groups', groups: busy().cameraGroups },
      { type: 'update-remote-viewing', changes: { enabled: true } },
      { type: 'update-network', changes: { uplinkMbps: 1000 } },
      { type: 'set-overhead', overheadPercent: 20 },
    ];
    for (const action of actions) {
      const next = reduce(state, action);
      expect(next.inputMode).toBe('simple');
      expect(bandwidthCalculatorStateSchema.safeParse(next).success).toBe(true);
    }
  });

  it('rejects a Simple state that breaks the rules in the schema', () => {
    const twoGroups = { ...simple(), cameraGroups: busy().cameraGroups.slice(0, 2) };
    const withOverhead = { ...simple(), overheadPercent: 20 };
    const withViewing = {
      ...simple(),
      remoteViewing: { ...simple().remoteViewing, enabled: true },
    };
    expect(bandwidthCalculatorStateSchema.safeParse(twoGroups).success).toBe(false);
    expect(bandwidthCalculatorStateSchema.safeParse(withOverhead).success).toBe(false);
    expect(bandwidthCalculatorStateSchema.safeParse(withViewing).success).toBe(false);
  });
});

describe('group actions', () => {
  it('adds a Bandwidth group with no recording fields', () => {
    const added = apply({ type: 'add-group' }).cameraGroups[1];
    expect(added).toEqual(
      expect.objectContaining({ id: 'g2', name: 'Camera group 2', colorIndex: 1 })
    );
    expect(added).not.toHaveProperty('recordingMode');
  });

  it('stops at the group limit', () => {
    const actions = Array.from(
      { length: MAX_CAMERA_GROUPS + 2 },
      () => ({ type: 'add-group' }) as const
    );
    expect(apply(...actions).cameraGroups).toHaveLength(MAX_CAMERA_GROUPS);
  });

  it('duplicates a group after its source, keeping its settings', () => {
    const state = apply(
      { type: 'update-group', id: 'g1', changes: { resolution: '8MP' } },
      { type: 'add-group' },
      { type: 'duplicate-group', id: 'g1' }
    );
    expect(ids(state)).toEqual(['g1', 'g3', 'g2']);
    expect(state.cameraGroups[1]).toEqual(
      expect.objectContaining({ name: 'Camera group 1 copy', resolution: '8MP' })
    );
  });

  it('removes a group and restores it in place (undo)', () => {
    const three = apply({ type: 'add-group' }, { type: 'add-group' });
    const removed = three.cameraGroups[1]!;
    const afterRemove = reduce(three, { type: 'remove-group', id: removed.id });
    expect(ids(afterRemove)).toEqual(['g1', 'g3']);
    expect(reduce(afterRemove, { type: 'restore-group', group: removed, index: 1 })).toEqual(three);
  });

  it('clears to the single default group and restores the previous groups (undo)', () => {
    const edited = apply(
      { type: 'add-group' },
      { type: 'update-group', id: 'g1', changes: { cameraCount: 3 } },
      { type: 'set-overhead', overheadPercent: 20 }
    );
    const cleared = reduce(edited, { type: 'clear-groups' });
    expect(cleared.cameraGroups).toEqual(initial().cameraGroups);
    expect(cleared.overheadPercent).toBe(20);
    expect(reduce(cleared, { type: 'restore-groups', groups: edited.cameraGroups })).toEqual(
      edited
    );
  });

  it('returns the same state when nothing changes', () => {
    const state = initial();
    expect(reduce(state, { type: 'remove-group', id: 'g1' })).toBe(state);
    expect(reduce(state, { type: 'duplicate-group', id: 'nope' })).toBe(state);
    expect(reduce(state, { type: 'update-group', id: 'nope', changes: { cameraCount: 2 } })).toBe(
      state
    );
  });

  it('prefills an entered bitrate when leaving Estimate', () => {
    const bitrate = apply({ type: 'set-bitrate-source', id: 'g1', source: 'bitrate-cap' })
      .cameraGroups[0]?.bitrate;
    expect(bitrate?.source).toBe('bitrate-cap');
    expect(bitrate && 'mbps' in bitrate && bitrate.mbps).toBeGreaterThan(0);
  });
});

describe('system settings', () => {
  it('merges remote viewing changes', () => {
    const state = apply({
      type: 'update-remote-viewing',
      changes: { enabled: true, viewers: 3, bitrateSource: 'custom', customMbps: 0.5 },
    });
    expect(state.remoteViewing).toEqual({
      enabled: true,
      viewers: 3,
      camerasPerViewer: 4,
      bitrateSource: 'custom',
      customMbps: 0.5,
      siteUploadMbps: null,
    });
  });

  it('keeps remote viewing settings while it is turned off', () => {
    const on = apply({
      type: 'update-remote-viewing',
      changes: { enabled: true, viewers: 3, siteUploadMbps: 20 },
    });
    const off = reduce(on, { type: 'update-remote-viewing', changes: { enabled: false } });
    expect(off.remoteViewing).toEqual({ ...on.remoteViewing, enabled: false });
  });

  it('turns the uplink check on and off', () => {
    const on = apply({ type: 'update-network', changes: { uplinkMbps: 10 } });
    expect(on.network).toEqual({ uplinkMbps: 10 });
    const off = reduce(on, { type: 'update-network', changes: { uplinkMbps: null } });
    expect(off.network.uplinkMbps).toBeNull();
  });

  it('sets the overhead allowance', () => {
    expect(apply({ type: 'set-overhead', overheadPercent: 20 }).overheadPercent).toBe(20);
  });
});

describe('load-state', () => {
  it('replaces the state and repairs clashing colours', () => {
    const base = apply({ type: 'add-group' }, { type: 'add-group' });
    const shared: BandwidthCalculatorState = {
      ...base,
      overheadPercent: 0,
      cameraGroups: base.cameraGroups.map((group) => ({ ...group, colorIndex: 2 })),
    };
    const state = reduce(initial(), { type: 'load-state', state: shared });
    expect(state.overheadPercent).toBe(0);
    expect(
      colors(state).some((color, index) => index > 0 && color === colors(state)[index - 1])
    ).toBe(false);
  });
});

describe('reducer purity', () => {
  it('does not mutate the previous state', () => {
    const before = apply({ type: 'add-group' });
    const snapshot = structuredClone(before);
    reduce(before, { type: 'duplicate-group', id: 'g1' });
    reduce(before, { type: 'remove-group', id: 'g2' });
    reduce(before, { type: 'update-remote-viewing', changes: { viewers: 5 } });
    reduce(before, { type: 'update-network', changes: { uplinkMbps: 100 } });

    expect(before).toEqual(snapshot);
  });
});

describe('bandwidthCalculatorStateSchema', () => {
  it('rejects duplicate group ids', () => {
    const state = apply({ type: 'add-group' });
    state.cameraGroups[1] = { ...state.cameraGroups[1]!, id: 'g1' };
    expect(bandwidthCalculatorStateSchema.safeParse(state).success).toBe(false);
  });

  it('rejects a colour index outside the palette', () => {
    const state = initial();
    state.cameraGroups[0] = { ...state.cameraGroups[0]!, colorIndex: groupColors.length };
    expect(bandwidthCalculatorStateSchema.safeParse(state).success).toBe(false);
  });

  it('rejects more groups than the limit', () => {
    const group = initial().cameraGroups[0]!;
    const tooMany = Array.from({ length: MAX_CAMERA_GROUPS + 1 }, (_, index) => ({
      ...group,
      id: `g${index + 1}`,
    }));
    expect(
      bandwidthCalculatorStateSchema.safeParse({ ...initial(), cameraGroups: tooMany }).success
    ).toBe(false);
  });
});
