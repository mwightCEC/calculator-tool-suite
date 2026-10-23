import {
  BITRATE_SOURCES,
  CODECS,
  RECORDED_STREAMS,
  RESOLUTIONS,
  SCENE_COMPLEXITIES,
  SUB_STREAM_RESOLUTIONS,
  VIEWING_STREAMS,
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
  stateToV1Payload,
  V1_BITRATE_SOURCES,
  V1_CODECS,
  V1_RECORDED_STREAMS,
  V1_RESOLUTIONS,
  V1_SCENE_COMPLEXITIES,
  V1_SUB_STREAM_RESOLUTIONS,
  V1_VIEWING_STREAMS,
} from './share-format-v1';
import { buildShareUrl, decodeShareParams, encodeState, SHARE_FORMAT_VERSION } from './share-link';

const PAGE = 'https://example.test/tools/bandwidth';

/** A non-default state touching every section, with a non-ASCII group name and the late-added resolutions. */
function sampleState(): BandwidthCalculatorState {
  const actions: BandwidthCalculatorAction[] = [
    { type: 'add-group' },
    { type: 'set-bitrate-source', id: 'g1', source: 'bitrate-cap' },
    { type: 'update-group', id: 'g1', changes: { resolution: '960H' } },
    {
      type: 'update-group',
      id: 'g2',
      changes: {
        name: 'Lobby – Café 東',
        cameraCount: 3,
        resolution: 'nHD',
        subStreamResolution: '720p',
      },
    },
    { type: 'set-recorded-streams', recordedStreams: 'main-and-sub' },
    { type: 'update-remote-viewing', changes: { viewers: 3, camerasPerViewer: 9, stream: 'main' } },
    { type: 'update-network', changes: { recorderLimitMbps: 160, uplinkMbps: 1000 } },
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

describe('encoding (v1)', () => {
  it('writes the current format version', () => {
    const url = new URL(buildShareUrl(sampleState(), PAGE));
    expect(url.searchParams.get(SHARE_VERSION_PARAM)).toBe(SHARE_FORMAT_VERSION);
  });

  it('round-trips the state exactly', () => {
    const state = sampleState();
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('round-trips the default state, with every check off', () => {
    const state = createInitialBandwidthCalculatorState();
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('produces URL-safe text', () => {
    expect(encodeState(sampleState())).toMatch(/^[\w-]+$/);
  });

  it('stores an off check as 0 and reads it back as off', () => {
    const payload = stateToV1Payload(sampleState());
    expect(payload[2]).toEqual([160, 1000, 0]);
    const result = decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload));
    expect(result.status === 'loaded' && result.state.network.siteUploadMbps).toBeNull();
  });
});

describe('v1 index tables', () => {
  // The tables are part of the link format. If calc-core's options change, these
  // tests fail: append new options to the tables, or create a new format version.
  it.each([
    ['recorded streams', V1_RECORDED_STREAMS, RECORDED_STREAMS],
    ['viewing streams', V1_VIEWING_STREAMS, VIEWING_STREAMS],
    ['resolutions', V1_RESOLUTIONS, RESOLUTIONS],
    ['codecs', V1_CODECS, CODECS],
    ['scene complexities', V1_SCENE_COMPLEXITIES, SCENE_COMPLEXITIES],
    ['sub-stream resolutions', V1_SUB_STREAM_RESOLUTIONS, SUB_STREAM_RESOLUTIONS],
    ['bitrate sources', V1_BITRATE_SOURCES, BITRATE_SOURCES],
  ] as const)('cover every calc-core %s option', (_label, table, options) => {
    expect([...table].sort()).toEqual([...options].sort());
  });

  it('keep their published order (append only; reordering breaks existing links)', () => {
    expect({
      recorded: V1_RECORDED_STREAMS,
      viewing: V1_VIEWING_STREAMS,
      resolutions: V1_RESOLUTIONS,
      codecs: V1_CODECS,
      complexities: V1_SCENE_COMPLEXITIES,
      subStreams: V1_SUB_STREAM_RESOLUTIONS,
      sources: V1_BITRATE_SOURCES,
    }).toEqual({
      recorded: ['main', 'main-and-sub'],
      viewing: ['sub', 'main'],
      resolutions: ['1MP', '2MP', '3MP', '4MP', '5MP', '6MP', '8MP', '12MP', 'nHD', '960H'],
      codecs: ['h264', 'h265', 'mjpeg'],
      complexities: ['low', 'medium', 'high'],
      subStreams: ['d1', '720p', '1080p'],
      sources: ['estimate', 'known-average', 'bitrate-cap'],
    });
  });
});

describe('decodeShareParams', () => {
  it('reports "none" when the link carries no state', () => {
    expect(decodeShareParams(new URLSearchParams())).toEqual({ status: 'none' });
  });

  it('re-creates group ids as g1, g2, …', () => {
    const payload = stateToV1Payload(sampleState());
    const result = decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload));
    expect(result.status === 'loaded' && result.state.cameraGroups.map((g) => g.id)).toEqual([
      'g1',
      'g2',
    ]);
  });

  it.each([
    ['an unknown version', () => linkParams('99', stateToV1Payload(sampleState()))],
    ['a Storage-style object', () => linkParams(SHARE_FORMAT_VERSION, sampleState())],
    [
      'an out-of-range sub-stream index',
      () => {
        const payload = stateToV1Payload(sampleState());
        payload[4][0]![6] = V1_SUB_STREAM_RESOLUTIONS.length;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'an uplink speed that is not an option',
      () => {
        const payload = stateToV1Payload(sampleState());
        payload[2][1] = 250;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'an overhead that is not an option',
      () => {
        const payload = stateToV1Payload(sampleState());
        payload[3] = 15;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'a negative link capacity',
      () => {
        const payload = stateToV1Payload(sampleState());
        payload[2][0] = -5;
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
    [
      'no camera groups',
      () => {
        const payload = stateToV1Payload(sampleState());
        payload[4] = [];
        return linkParams(SHARE_FORMAT_VERSION, payload);
      },
    ],
  ])('rejects %s', (_label, params) => {
    expect(decodeShareParams(params())).toEqual({ status: 'invalid' });
  });
});
