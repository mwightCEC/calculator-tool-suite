import {
  BITRATE_SOURCES,
  CALCULATION_MODES,
  CODECS,
  RAID_LEVELS,
  RECORDING_MODES,
  RESOLUTIONS,
  SCENE_COMPLEXITIES,
} from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import {
  stateToV2Payload,
  V2_BITRATE_SOURCES,
  V2_CODECS,
  V2_MODES,
  V2_RAID_LEVELS,
  V2_RECORDING_MODES,
  V2_RESOLUTIONS,
  V2_SCENE_COMPLEXITIES,
} from './share-format-v2';
import {
  buildPlainUrl,
  buildShareUrl,
  decodeShareParams,
  encodeShareParams,
  encodeState,
  LEGACY_SHARE_FORMAT_VERSION,
  SHARE_FORMAT_VERSION,
  SHARE_STATE_PARAM,
  SHARE_VERSION_PARAM,
} from './share-link';
import {
  createInitialStorageCalculatorState,
  storageCalculatorReducer,
  type StorageCalculatorAction,
  type StorageCalculatorState,
} from './storage-calculator-state';

const PAGE = 'https://example.test/tools/storage';

/** A non-default state: two groups, days mode, a bitrate cap, a non-ASCII name and the late-added resolutions. */
function sampleState(): StorageCalculatorState {
  const actions: StorageCalculatorAction[] = [
    { type: 'add-group' },
    { type: 'set-mode', mode: 'days-from-capacity' },
    { type: 'set-bitrate-source', id: 'g1', source: 'bitrate-cap' },
    { type: 'update-group', id: 'g1', changes: { resolution: '960H' } },
    {
      type: 'update-group',
      id: 'g2',
      changes: { name: 'Lobby – Café 東', cameraCount: 3, resolution: 'nHD' },
    },
  ];
  return actions.reduce(storageCalculatorReducer, createInitialStorageCalculatorState());
}

/** Query parameters carrying a hand-built JSON payload, as an untrusted link might. */
function linkParams(version: string, payload: unknown): URLSearchParams {
  const base64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return new URLSearchParams({ [SHARE_VERSION_PARAM]: version, [SHARE_STATE_PARAM]: base64 });
}

/** A v2 payload for the sample state, ready to be tampered with. */
function v2Payload() {
  return stateToV2Payload(sampleState());
}

describe('encoding (v2)', () => {
  it('writes the current format version', () => {
    expect(encodeShareParams(sampleState()).get(SHARE_VERSION_PARAM)).toBe('2');
  });

  it('round-trips the state exactly', () => {
    const state = sampleState();
    expect(decodeShareParams(encodeShareParams(state))).toEqual({ status: 'loaded', state });
  });

  it('keeps non-ASCII group names', () => {
    const result = decodeShareParams(encodeShareParams(sampleState()));
    expect(result.status === 'loaded' && result.state.cameraGroups[1]?.name).toBe(
      'Lobby – Café 東'
    );
  });

  it('produces URL-safe text', () => {
    expect(encodeState(sampleState())).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('is several times shorter than the v1 format', () => {
    const v1Length = Buffer.from(JSON.stringify(sampleState())).toString('base64url').length;
    expect(encodeState(sampleState()).length * 4).toBeLessThan(v1Length);
  });

  it('does not store group ids, so they are renumbered on load', () => {
    const state = sampleState();
    const renumbered = {
      ...state,
      cameraGroups: state.cameraGroups.map((group, i) => ({ ...group, id: `g${i * 4 + 5}` })),
    };
    expect(encodeState(renumbered)).toBe(encodeState(state));

    const result = decodeShareParams(encodeShareParams(renumbered));
    expect(result.status === 'loaded' && result.state.cameraGroups.map((g) => g.id)).toEqual([
      'g1',
      'g2',
    ]);
  });

  it('keeps unused motion and schedule values so switching modes is lossless', () => {
    const state = sampleState();
    state.cameraGroups[0] = { ...state.cameraGroups[0]!, motionPercent: 45, scheduleHours: 9 };
    const result = decodeShareParams(encodeShareParams(state));
    expect(result.status === 'loaded' && result.state.cameraGroups[0]).toEqual(
      expect.objectContaining({ recordingMode: 'continuous', motionPercent: 45, scheduleHours: 9 })
    );
  });

  it('still encodes (rather than throws) if the state is somehow invalid', () => {
    const invalid = { ...sampleState(), cameraGroups: [] } as StorageCalculatorState;
    expect(() => encodeState(invalid)).not.toThrow();
  });
});

describe('v2 index tables', () => {
  // The tables are part of the link format. If calc-core's options change, these
  // tests fail: append new options to the tables, or create a new format version.
  it.each([
    ['modes', V2_MODES, CALCULATION_MODES],
    ['RAID levels', V2_RAID_LEVELS, RAID_LEVELS],
    ['resolutions', V2_RESOLUTIONS, RESOLUTIONS],
    ['codecs', V2_CODECS, CODECS],
    ['scene complexities', V2_SCENE_COMPLEXITIES, SCENE_COMPLEXITIES],
    ['recording modes', V2_RECORDING_MODES, RECORDING_MODES],
    ['bitrate sources', V2_BITRATE_SOURCES, BITRATE_SOURCES],
  ] as const)('cover every calc-core %s option', (_label, table, options) => {
    expect([...table].sort()).toEqual([...options].sort());
  });

  it('keep their published order (append only; reordering breaks existing links)', () => {
    expect({
      modes: V2_MODES,
      raid: V2_RAID_LEVELS,
      resolutions: V2_RESOLUTIONS,
      codecs: V2_CODECS,
      complexities: V2_SCENE_COMPLEXITIES,
      recording: V2_RECORDING_MODES,
      sources: V2_BITRATE_SOURCES,
    }).toEqual({
      modes: ['storage-needed', 'days-from-capacity'],
      raid: ['none', 'raid1', 'raid5', 'raid6', 'raid10'],
      resolutions: ['1MP', '2MP', '3MP', '4MP', '5MP', '6MP', '8MP', '12MP', 'nHD', '960H'],
      codecs: ['h264', 'h265', 'mjpeg'],
      complexities: ['low', 'medium', 'high'],
      recording: ['continuous', 'motion', 'schedule'],
      sources: ['estimate', 'known-average', 'bitrate-cap'],
    });
  });
});

describe('v1 links (still supported)', () => {
  it('open with the same calculation', () => {
    const state = sampleState();
    expect(decodeShareParams(linkParams(LEGACY_SHARE_FORMAT_VERSION, state))).toEqual({
      status: 'loaded',
      state,
    });
  });

  it.each([
    [
      'duplicate group ids',
      (state: StorageCalculatorState) => {
        state.cameraGroups[1] = { ...state.cameraGroups[1]!, id: state.cameraGroups[0]!.id };
        return state;
      },
    ],
    [
      'a removed codec',
      (state: StorageCalculatorState) => ({
        ...state,
        cameraGroups: [{ ...state.cameraGroups[0], codec: 'h265-smart' }],
      }),
    ],
    [
      'zero cameras',
      (state: StorageCalculatorState) => {
        state.cameraGroups[0] = { ...state.cameraGroups[0]!, cameraCount: 0 };
        return state;
      },
    ],
  ])('are rejected with %s', (_label, tamper) => {
    const params = linkParams(LEGACY_SHARE_FORMAT_VERSION, tamper(sampleState()));
    expect(decodeShareParams(params)).toEqual({ status: 'invalid' });
  });
});

describe('decodeShareParams', () => {
  it('reports "none" when the link carries no state', () => {
    expect(decodeShareParams(new URLSearchParams())).toEqual({ status: 'none' });
    expect(decodeShareParams(new URLSearchParams({ other: '1' }))).toEqual({ status: 'none' });
  });

  it('ignores a stray bitrate value on an Estimate group', () => {
    const payload = v2Payload();
    payload[2][1]![10] = 12.5; // group 2 uses Estimate
    const result = decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload));
    expect(result.status === 'loaded' && result.state.cameraGroups[1]?.bitrate).toEqual({
      source: 'estimate',
    });
  });

  it.each([
    [
      'a missing version',
      () => new URLSearchParams({ [SHARE_STATE_PARAM]: encodeState(sampleState()) }),
    ],
    ['an unknown version', () => linkParams('99', v2Payload())],
    ['text that is not base64', () => new URLSearchParams({ v: SHARE_FORMAT_VERSION, s: '%%%' })],
    [
      'base64 that is not JSON',
      () => new URLSearchParams({ v: SHARE_FORMAT_VERSION, s: 'aGVsbG8' }),
    ],
    ['bytes that are not UTF-8', () => new URLSearchParams({ v: SHARE_FORMAT_VERSION, s: '_w' })],
    ['a v1-style object sent as v2', () => linkParams(SHARE_FORMAT_VERSION, sampleState())],
    [
      'a group with a missing field',
      () => {
        const payload = v2Payload();
        return linkParams(SHARE_FORMAT_VERSION, [
          payload[0],
          payload[1],
          [payload[2][0]!.slice(0, 11)],
        ]);
      },
    ],
    [
      'an out-of-range codec index',
      () => {
        const payload = v2Payload();
        payload[2][0]![3] = V2_CODECS.length;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'an out-of-range mode index',
      () => {
        const payload = v2Payload();
        payload[0] = V2_MODES.length;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'a negative index',
      () => {
        const payload = v2Payload();
        payload[1][3] = -1;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'zero cameras',
      () => {
        const payload = v2Payload();
        payload[2][0]![1] = 0;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'no camera groups',
      () => {
        const payload = v2Payload();
        return linkParams(SHARE_FORMAT_VERSION, [payload[0], payload[1], []]);
      },
    ],
  ])('rejects %s', (_label, build) => {
    expect(decodeShareParams(build())).toEqual({ status: 'invalid' });
  });
});

describe('retired input mode', () => {
  // v2 links used to end with the Simple / Advanced input mode (0 Advanced, 1 Simple).
  it('leaves it out of new links', () => {
    expect(stateToV2Payload(sampleState())).toHaveLength(3);
  });

  it.each([
    ['Advanced', 0],
    ['Simple', 1],
  ])('ignores it in older %s links, keeping every group and setting', (_label, inputMode) => {
    const state = storageCalculatorReducer(sampleState(), {
      type: 'update-storage',
      changes: { raidLevel: 'raid5', reservePercent: 10 },
    });
    const payload = [...stateToV2Payload(state), inputMode];
    expect(decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload))).toEqual({
      status: 'loaded',
      state,
    });
  });
});

describe('buildShareUrl and buildPlainUrl', () => {
  it('adds the share parameters to the page URL', () => {
    const url = new URL(buildShareUrl(sampleState(), PAGE));
    expect(url.origin + url.pathname).toBe(PAGE);
    expect(url.searchParams.get(SHARE_VERSION_PARAM)).toBe(SHARE_FORMAT_VERSION);
    expect(url.searchParams.get(SHARE_STATE_PARAM)).toBe(encodeState(sampleState()));
  });

  it('replaces existing share parameters and keeps unrelated ones', () => {
    const url = new URL(buildShareUrl(sampleState(), `${PAGE}?utm=mail&v=1&s=old`));
    expect(url.searchParams.get('utm')).toBe('mail');
    expect(url.searchParams.getAll(SHARE_VERSION_PARAM)).toEqual([SHARE_FORMAT_VERSION]);
    expect(url.searchParams.getAll(SHARE_STATE_PARAM)).toEqual([encodeState(sampleState())]);
  });

  it('removes only the share parameters for a plain URL', () => {
    const plain = new URL(buildPlainUrl(`${PAGE}?utm=mail&v=2&s=abc`));
    expect(plain.searchParams.get('utm')).toBe('mail');
    expect(plain.searchParams.has(SHARE_VERSION_PARAM)).toBe(false);
    expect(plain.searchParams.has(SHARE_STATE_PARAM)).toBe(false);
  });
});
