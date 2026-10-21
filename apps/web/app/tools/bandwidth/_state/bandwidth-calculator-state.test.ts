import { bandwidthInputSchema } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { groupColors } from '../../../../theme/palettes';
import {
  bandwidthCalculatorReducer as reduce,
  bandwidthCalculatorStateSchema,
  createInitialBandwidthCalculatorState,
  type BandwidthCalculatorAction,
  type BandwidthCalculatorState,
} from './bandwidth-calculator-state';

const initial = () => createInitialBandwidthCalculatorState();

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

  it('uses the spec defaults: main only, 1 viewer × 4 cameras on the sub-stream, no checks, 10%', () => {
    const state = initial();
    expect(state.cameraGroups).toEqual([
      expect.objectContaining({
        id: 'g1',
        name: 'Camera group 1',
        colorIndex: 0,
        subStreamResolution: 'd1',
      }),
    ]);
    expect(state.recordedStreams).toBe('main');
    expect(state.remoteViewing).toEqual({ viewers: 1, camerasPerViewer: 4, stream: 'sub' });
    expect(state.network).toEqual({
      recorderLimitMbps: null,
      uplinkMbps: null,
      siteUploadMbps: null,
    });
    expect(state.overheadPercent).toBe(10);
  });
});

describe('group actions', () => {
  it('adds a Bandwidth group with a sub-stream and no recording fields', () => {
    const added = apply({ type: 'add-group' }).cameraGroups[1];
    expect(added).toEqual(
      expect.objectContaining({ id: 'g2', name: 'Camera group 2', colorIndex: 1 })
    );
    expect(added?.subStreamResolution).toBe('d1');
    expect(added).not.toHaveProperty('recordingMode');
  });

  it('stops at the group limit', () => {
    const actions = Array.from(
      { length: MAX_CAMERA_GROUPS + 2 },
      () => ({ type: 'add-group' }) as const
    );
    expect(apply(...actions).cameraGroups).toHaveLength(MAX_CAMERA_GROUPS);
  });

  it('duplicates a group after its source, keeping its sub-stream', () => {
    const state = apply(
      { type: 'update-group', id: 'g1', changes: { subStreamResolution: '720p' } },
      { type: 'add-group' },
      { type: 'duplicate-group', id: 'g1' }
    );
    expect(ids(state)).toEqual(['g1', 'g3', 'g2']);
    expect(state.cameraGroups[1]).toEqual(
      expect.objectContaining({ name: 'Camera group 1 copy', subStreamResolution: '720p' })
    );
  });

  it('removes a group and restores it in place (undo)', () => {
    const three = apply({ type: 'add-group' }, { type: 'add-group' });
    const removed = three.cameraGroups[1]!;
    const afterRemove = reduce(three, { type: 'remove-group', id: removed.id });
    expect(ids(afterRemove)).toEqual(['g1', 'g3']);
    expect(reduce(afterRemove, { type: 'restore-group', group: removed, index: 1 })).toEqual(three);
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
  it('sets the recorded streams', () => {
    expect(apply({ type: 'set-recorded-streams', recordedStreams: 'main-and-sub' })).toEqual(
      expect.objectContaining({ recordedStreams: 'main-and-sub' })
    );
  });

  it('merges remote viewing changes', () => {
    const state = apply({ type: 'update-remote-viewing', changes: { viewers: 3, stream: 'main' } });
    expect(state.remoteViewing).toEqual({ viewers: 3, camerasPerViewer: 4, stream: 'main' });
  });

  it('turns network checks on and off', () => {
    const on = apply({ type: 'update-network', changes: { uplinkMbps: 1000, siteUploadMbps: 20 } });
    expect(on.network).toEqual({ recorderLimitMbps: null, uplinkMbps: 1000, siteUploadMbps: 20 });
    const off = reduce(on, { type: 'update-network', changes: { uplinkMbps: null } });
    expect(off.network.uplinkMbps).toBeNull();
    expect(off.network.siteUploadMbps).toBe(20);
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
    reduce(before, { type: 'update-network', changes: { recorderLimitMbps: 80 } });
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
