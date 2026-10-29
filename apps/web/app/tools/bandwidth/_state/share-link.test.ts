import {
  BITRATE_SOURCES,
  CODECS,
  RESOLUTIONS,
  SCENE_COMPLEXITIES,
  VIEWING_BITRATE_SOURCES,
} from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { SHARE_STATE_PARAM, SHARE_VERSION_PARAM } from '../../../../lib/share/share-codec';
import {
  bandwidthCalculatorReducer,
  createInitialBandwidthCalculatorState,
  type BandwidthCalculatorAction,
  type BandwidthCalculatorState,
} from './bandwidth-calculator-state';
import {
  stateToV2Payload,
  V2_BITRATE_SOURCES,
  V2_CODECS,
  V2_RESOLUTIONS,
  V2_SCENE_COMPLEXITIES,
  V2_VIEWING_BITRATE_SOURCES,
} from './share-format-v2';
import { buildShareUrl, decodeShareParams, encodeState, SHARE_FORMAT_VERSION } from './share-link';

const PAGE = 'https://example.test/tools/bandwidth';

/** A non-default state touching every section, with a non-ASCII group name and the late-added resolutions. */
function sampleState(): BandwidthCalculatorState {
  const actions: BandwidthCalculatorAction[] = [
    // Duplicating puts g2 after g1, so ids match list order as they do after decoding.
    { type: 'duplicate-group', id: 'g1' },
    { type: 'set-bitrate-source', id: 'g1', source: 'bitrate-cap' },
    { type: 'update-group', id: 'g1', changes: { resolution: '960H' } },
    {
      type: 'update-group',
      id: 'g2',
      changes: { name: 'Lobby – Café 東', cameraCount: 3, resolution: 'nHD' },
    },
    {
      type: 'update-remote-viewing',
      changes: {
        enabled: true,
        viewers: 3,
        camerasPerViewer: 9,
        bitrateSource: 'custom',
        customMbps: 0.7,
        siteUploadMbps: 50,
      },
    },
    { type: 'update-network', changes: { uplinkMbps: 1000 } },
    { type: 'set-overhead', overheadPercent: 20 },
  ];
  return actions.reduce(bandwidthCalculatorReducer, createInitialBandwidthCalculatorState());
}

/** Query parameters carrying a hand-built JSON payload, as an untrusted link might. */
function linkParams(version: string, payload: unknown): URLSearchParams {
  const base64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return new URLSearchParams({ [SHARE_VERSION_PARAM]: version, [SHARE_STATE_PARAM]: base64 });
}

function roundTrip(state: BandwidthCalculatorState) {
  return decodeShareParams(new URL(buildShareUrl(state, PAGE)).searchParams);
}

describe('retired input mode', () => {
  // v2 links used to end with the Simple / Advanced input mode (0 Advanced, 1 Simple).
  it('leaves it out of new links', () => {
    expect(stateToV2Payload(sampleState())).toHaveLength(4);
  });

  it.each([
    ['Advanced', 0],
    ['Simple', 1],
  ])('ignores it in older %s links, keeping every group and setting', (_label, inputMode) => {
    const state = sampleState();
    const payload = [...stateToV2Payload(state), inputMode];
    expect(decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload))).toEqual({
      status: 'loaded',
      state,
    });
  });
});

describe('encoding (v2)', () => {
  it('writes format version 2', () => {
    const url = new URL(buildShareUrl(sampleState(), PAGE));
    expect(url.searchParams.get(SHARE_VERSION_PARAM)).toBe('2');
    expect(SHARE_FORMAT_VERSION).toBe('2');
  });

  it('round-trips the state exactly', () => {
    const state = sampleState();
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('round-trips the default state, with remote viewing and every check off', () => {
    const state = createInitialBandwidthCalculatorState();
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('round-trips remote viewing turned off with its settings kept', () => {
    const state = bandwidthCalculatorReducer(sampleState(), {
      type: 'update-remote-viewing',
      changes: { enabled: false },
    });
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('produces URL-safe text', () => {
    expect(encodeState(sampleState())).toMatch(/^[\w-]+$/);
  });

  it('stores an off check as 0 and reads it back as off', () => {
    const state = bandwidthCalculatorReducer(sampleState(), {
      type: 'update-remote-viewing',
      changes: { siteUploadMbps: null },
    });
    const payload = stateToV2Payload(state);
    expect(payload[0][5]).toBe(0);
    expect(payload[1]).toEqual([1000]);
    const result = decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload));
    expect(result.status === 'loaded' && result.state.remoteViewing.siteUploadMbps).toBeNull();
  });
});

describe('v2 index tables', () => {
  // The tables are part of the link format. If calc-core's options change, these
  // tests fail: append new options to the tables, or create a new format version.
  it.each([
    ['viewing bitrate sources', V2_VIEWING_BITRATE_SOURCES, VIEWING_BITRATE_SOURCES],
    ['resolutions', V2_RESOLUTIONS, RESOLUTIONS],
    ['codecs', V2_CODECS, CODECS],
    ['scene complexities', V2_SCENE_COMPLEXITIES, SCENE_COMPLEXITIES],
    ['bitrate sources', V2_BITRATE_SOURCES, BITRATE_SOURCES],
  ] as const)('cover every calc-core %s option', (_label, table, options) => {
    expect([...table].sort()).toEqual([...options].sort());
  });

  it('keep their published order (append only; reordering breaks existing links)', () => {
    expect({
      viewing: V2_VIEWING_BITRATE_SOURCES,
      resolutions: V2_RESOLUTIONS,
      codecs: V2_CODECS,
      complexities: V2_SCENE_COMPLEXITIES,
      sources: V2_BITRATE_SOURCES,
    }).toEqual({
      viewing: ['camera', 'custom'],
      resolutions: ['1MP', '2MP', '3MP', '4MP', '5MP', '6MP', '8MP', '12MP', 'nHD', '960H'],
      codecs: ['h264', 'h265', 'mjpeg'],
      complexities: ['low', 'medium', 'high'],
      sources: ['estimate', 'known-average', 'bitrate-cap'],
    });
  });
});

describe('decodeShareParams', () => {
  it('reports "none" when the link carries no state', () => {
    expect(decodeShareParams(new URLSearchParams())).toEqual({ status: 'none' });
  });

  it('re-creates group ids as g1, g2, …', () => {
    const payload = stateToV2Payload(sampleState());
    const result = decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload));
    expect(result.status === 'loaded' && result.state.cameraGroups.map((g) => g.id)).toEqual([
      'g1',
      'g2',
    ]);
  });

  /** A v2 payload of the sample state with one change, as a link. */
  function changedLink(change: (payload: ReturnType<typeof stateToV2Payload>) => void) {
    return () => {
      const payload = stateToV2Payload(sampleState());
      change(payload);
      return linkParams(SHARE_FORMAT_VERSION, payload);
    };
  }

  it.each([
    ['an unknown version', () => linkParams('99', stateToV2Payload(sampleState()))],
    ['a v1 link (no longer read)', () => linkParams('1', [0, [1, 4, 0], [0, 0, 0], 10, [], 0])],
    ['a Storage-style object', () => linkParams(SHARE_FORMAT_VERSION, sampleState())],
    [
      'an enabled flag other than 0 or 1',
      changedLink((payload) => {
        payload[0][0] = 2;
      }),
    ],
    [
      'zero viewers',
      changedLink((payload) => {
        payload[0][1] = 0;
      }),
    ],
    [
      'an out-of-range viewing bitrate source',
      changedLink((payload) => {
        payload[0][3] = V2_VIEWING_BITRATE_SOURCES.length;
      }),
    ],
    [
      'a custom bitrate above the limit',
      changedLink((payload) => {
        payload[0][4] = 500;
      }),
    ],
    [
      'a negative site upload',
      changedLink((payload) => {
        payload[0][5] = -5;
      }),
    ],
    [
      'an uplink speed that is not an option',
      changedLink((payload) => {
        payload[1][0] = 250;
      }),
    ],
    [
      'an overhead that is not an option',
      changedLink((payload) => {
        payload[2] = 15;
      }),
    ],
    [
      'no camera groups',
      changedLink((payload) => {
        payload[3] = [];
      }),
    ],
  ])('rejects %s', (_label, params) => {
    expect(decodeShareParams(params())).toEqual({ status: 'invalid' });
  });
});
