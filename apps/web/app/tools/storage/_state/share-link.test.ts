import { describe, expect, it } from 'vitest';
import {
  buildPlainUrl,
  buildShareUrl,
  decodeShareParams,
  encodeShareParams,
  encodeState,
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

/** A non-default state: two groups, days mode, a bitrate cap and a non-ASCII name. */
function sampleState(): StorageCalculatorState {
  const actions: StorageCalculatorAction[] = [
    { type: 'add-group' },
    { type: 'set-mode', mode: 'days-from-capacity' },
    { type: 'set-bitrate-source', id: 'g1', source: 'bitrate-cap' },
    { type: 'update-group', id: 'g2', changes: { name: 'Lobby – Café 東', cameraCount: 3 } },
  ];
  return actions.reduce(storageCalculatorReducer, createInitialStorageCalculatorState());
}

/** Query parameters with a hand-built JSON payload, as an untrusted link might carry. */
function paramsWithPayload(payload: unknown, version = SHARE_FORMAT_VERSION): URLSearchParams {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, 'utf8').toString('base64url');
  return new URLSearchParams({ [SHARE_VERSION_PARAM]: version, [SHARE_STATE_PARAM]: base64 });
}

describe('encode and decode', () => {
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

  it('gives the same link for the same state regardless of key order', () => {
    const state = sampleState();
    const reversedKeys = Object.fromEntries(
      Object.entries({
        ...state,
        cameraGroups: state.cameraGroups.map((group) =>
          Object.fromEntries(Object.entries(group).toReversed())
        ),
      }).toReversed()
    ) as StorageCalculatorState;
    expect(JSON.stringify(reversedKeys)).not.toBe(JSON.stringify(state));
    expect(encodeState(reversedKeys)).toBe(encodeState(state));
  });

  it('still encodes (rather than throws) if the state is somehow invalid', () => {
    const invalid = { ...sampleState(), cameraGroups: [] } as StorageCalculatorState;
    expect(() => encodeState(invalid)).not.toThrow();
  });
});

describe('decodeShareParams', () => {
  it('reports "none" when the link carries no state', () => {
    expect(decodeShareParams(new URLSearchParams())).toEqual({ status: 'none' });
    expect(decodeShareParams(new URLSearchParams({ other: '1' }))).toEqual({ status: 'none' });
  });

  it.each([
    [
      'a missing version',
      () => new URLSearchParams({ [SHARE_STATE_PARAM]: encodeState(sampleState()) }),
    ],
    ['an unknown version', () => paramsWithPayload(sampleState(), '99')],
    ['text that is not base64', () => new URLSearchParams({ v: SHARE_FORMAT_VERSION, s: '%%%' })],
    [
      'base64 that is not JSON',
      () => new URLSearchParams({ v: SHARE_FORMAT_VERSION, s: 'aGVsbG8' }),
    ],
    ['bytes that are not UTF-8', () => new URLSearchParams({ v: SHARE_FORMAT_VERSION, s: '_w' })],
    ['JSON that fails the schema', () => paramsWithPayload({ mode: 'storage-needed' })],
    [
      'zero cameras',
      () => {
        const state = sampleState();
        state.cameraGroups[0] = { ...state.cameraGroups[0]!, cameraCount: 0 };
        return paramsWithPayload(state);
      },
    ],
    [
      'duplicate group ids',
      () => {
        const state = sampleState();
        state.cameraGroups[1] = { ...state.cameraGroups[1]!, id: state.cameraGroups[0]!.id };
        return paramsWithPayload(state);
      },
    ],
    [
      'a removed codec',
      () => {
        const state = sampleState();
        return paramsWithPayload({
          ...state,
          cameraGroups: [{ ...state.cameraGroups[0], codec: 'h265-smart' }],
        });
      },
    ],
  ])('rejects %s', (_label, build) => {
    expect(decodeShareParams(build())).toEqual({ status: 'invalid' });
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
    const url = new URL(buildShareUrl(sampleState(), `${PAGE}?utm=mail&v=0&s=old`));
    expect(url.searchParams.get('utm')).toBe('mail');
    expect(url.searchParams.getAll(SHARE_STATE_PARAM)).toEqual([encodeState(sampleState())]);
  });

  it('removes only the share parameters for a plain URL', () => {
    const plain = new URL(buildPlainUrl(`${PAGE}?utm=mail&v=1&s=abc`));
    expect(plain.searchParams.get('utm')).toBe('mail');
    expect(plain.searchParams.has(SHARE_VERSION_PARAM)).toBe(false);
    expect(plain.searchParams.has(SHARE_STATE_PARAM)).toBe(false);
  });
});
