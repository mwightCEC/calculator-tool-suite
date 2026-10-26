import { CABLE_LENGTH_UNITS, PORT_STANDARDS, POWER_INPUTS } from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { INPUT_MODES } from '../../../../lib/input-mode';
import { SHARE_STATE_PARAM, SHARE_VERSION_PARAM } from '../../../../lib/share/share-codec';
import {
  createInitialPoeCalculatorState,
  poeCalculatorReducer,
  type PoeCalculatorAction,
  type PoeCalculatorState,
} from './poe-calculator-state';
import {
  stateToV1Payload,
  V1_CABLE_LENGTH_UNITS,
  V1_INPUT_MODES,
  V1_PORT_STANDARDS,
  V1_POWER_INPUTS,
} from './share-format-v1';
import { buildShareUrl, decodeShareParams, encodeState, SHARE_FORMAT_VERSION } from './share-link';

const PAGE = 'https://example.test/tools/poe-budget';

/** A non-default Advanced state touching every field, with a non-ASCII group name. */
function sampleState(): PoeCalculatorState {
  const actions: PoeCalculatorAction[] = [
    { type: 'set-input-mode', inputMode: 'advanced' },
    { type: 'add-group' },
    {
      type: 'update-switch',
      changes: { budgetWatts: 370.5, ports: 24, portStandard: 'bt-type3', reservePercent: 10 },
    },
    { type: 'update-group', id: 'g1', changes: { deviceCount: 12, cableLength: 250 } },
    { type: 'set-power-input', id: 'g2', input: 'class' },
    {
      type: 'update-group',
      id: 'g2',
      changes: { name: 'Lobby – Café 東', power: { input: 'class', poeClass: 6 } },
    },
    { type: 'set-cable-length-unit', unit: 'm' },
  ];
  return actions.reduce(poeCalculatorReducer, createInitialPoeCalculatorState());
}

/** Query parameters carrying a hand-built JSON payload, as an untrusted link might. */
function linkParams(version: string, payload: unknown): URLSearchParams {
  const base64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return new URLSearchParams({ [SHARE_VERSION_PARAM]: version, [SHARE_STATE_PARAM]: base64 });
}

function roundTrip(state: PoeCalculatorState) {
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

  it('round-trips the default Simple state', () => {
    const state = createInitialPoeCalculatorState();
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('produces URL-safe text', () => {
    expect(encodeState(sampleState())).toMatch(/^[\w-]+$/);
  });

  it('stores a missing cable length as 0 and reads it back as not given', () => {
    const payload = stateToV1Payload(sampleState());
    expect(payload[2].map((group) => group[4])).toEqual([76.2, 0]);
    const result = decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload));
    expect(result.status === 'loaded' && result.state.deviceGroups[1]?.cableLength).toBeNull();
  });
});

describe('v1 index tables', () => {
  // The tables are part of the link format. If calc-core's options change, these
  // tests fail: append new options to the tables, or create a new format version.
  it.each([
    ['port standards', V1_PORT_STANDARDS, PORT_STANDARDS],
    ['power inputs', V1_POWER_INPUTS, POWER_INPUTS],
    ['cable length units', V1_CABLE_LENGTH_UNITS, CABLE_LENGTH_UNITS],
    ['input modes', V1_INPUT_MODES, INPUT_MODES],
  ] as const)('cover every %s option', (_label, table, options) => {
    expect([...table].sort()).toEqual([...options].sort());
  });

  it('keep their published order (append only; reordering breaks existing links)', () => {
    expect({
      standards: V1_PORT_STANDARDS,
      inputs: V1_POWER_INPUTS,
      units: V1_CABLE_LENGTH_UNITS,
      inputModes: V1_INPUT_MODES,
    }).toEqual({
      standards: ['af', 'at', 'bt-type3', 'bt-type4'],
      inputs: ['watts', 'class'],
      units: ['ft', 'm'],
      inputModes: ['advanced', 'simple'],
    });
  });
});

describe('input mode', () => {
  it('opens links without an input mode in Advanced', () => {
    const withoutInputMode = stateToV1Payload(sampleState()).slice(0, 3);
    expect(decodeShareParams(linkParams(SHARE_FORMAT_VERSION, withoutInputMode))).toEqual({
      status: 'loaded',
      state: sampleState(),
    });
  });

  it('rejects a Simple link that breaks Simple mode’s rules', () => {
    const payload = stateToV1Payload(sampleState());
    payload[3] = V1_INPUT_MODES.indexOf('simple');
    expect(decodeShareParams(linkParams(SHARE_FORMAT_VERSION, payload))).toEqual({
      status: 'invalid',
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
    expect(result.status === 'loaded' && result.state.deviceGroups.map((g) => g.id)).toEqual([
      'g1',
      'g2',
    ]);
  });

  /** A v1 payload with one change applied, as a tampered or broken link might carry. */
  const tampered = (change: (payload: ReturnType<typeof stateToV1Payload>) => void) => () => {
    const payload = stateToV1Payload(sampleState());
    change(payload);
    return linkParams(SHARE_FORMAT_VERSION, payload);
  };

  it.each([
    ['an unknown version', () => linkParams('99', stateToV1Payload(sampleState()))],
    ['a state object instead of an array', () => linkParams(SHARE_FORMAT_VERSION, sampleState())],
    [
      'an out-of-range port standard',
      tampered((payload) => {
        payload[0][2] = V1_PORT_STANDARDS.length;
      }),
    ],
    [
      'a reserve that is not an option',
      tampered((payload) => {
        payload[0][3] = 15;
      }),
    ],
    [
      'an unknown PoE class',
      tampered((payload) => {
        payload[2][1]![3] = 9;
      }),
    ],
    [
      'a draw above 90 W',
      tampered((payload) => {
        payload[2][0]![3] = 120;
      }),
    ],
    [
      'a negative cable length',
      tampered((payload) => {
        payload[2][0]![4] = -10;
      }),
    ],
    [
      'no device groups',
      tampered((payload) => {
        payload[2] = [];
      }),
    ],
  ])('rejects %s', (_label, params) => {
    expect(decodeShareParams(params())).toEqual({ status: 'invalid' });
  });
});
