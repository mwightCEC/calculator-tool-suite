import {
  CABLE_LENGTH_UNITS,
  LOAD_INPUTS,
  SUPPLY_KINDS,
  WIRE_GAUGES,
  WIRE_SYSTEMS,
} from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { INPUT_MODES } from '../../../../lib/input-mode';
import { SHARE_STATE_PARAM, SHARE_VERSION_PARAM } from '../../../../lib/share/share-codec';
import {
  stateToV1Payload,
  V1_CABLE_LENGTH_UNITS,
  V1_INPUT_MODES,
  V1_LOAD_INPUTS,
  V1_SUPPLY_KINDS,
  V1_WIRE_GAUGES,
  V1_WIRE_SYSTEMS,
} from './share-format-v1';
import { buildShareUrl, decodeShareParams, encodeState, SHARE_FORMAT_VERSION } from './share-link';
import {
  createInitialVoltageDropCalculatorState,
  voltageDropCalculatorReducer,
  type VoltageDropCalculatorAction,
  type VoltageDropCalculatorState,
} from './voltage-drop-calculator-state';

const PAGE = 'https://example.test/tools/voltage-drop';

/** A non-default Advanced state touching every field, with a non-ASCII group name. */
function sampleState(): VoltageDropCalculatorState {
  const actions: VoltageDropCalculatorAction[] = [
    { type: 'set-input-mode', inputMode: 'advanced' },
    { type: 'add-group' },
    {
      type: 'update-supply',
      changes: { kind: 'ac', volts: 28, ratedAmps: 7.5, reservePercent: 10 },
    },
    { type: 'set-drop-limit', dropLimitPercent: 15 },
    { type: 'set-wire-system', wireSystem: 'mm2' },
    { type: 'set-cable-length-unit', unit: 'm' },
    { type: 'update-group', id: 'g1', changes: { deviceCount: 12, gauge: 'mm2-1.5' } },
    { type: 'set-load-input', id: 'g2', input: 'watts' },
    {
      type: 'update-group',
      id: 'g2',
      changes: {
        name: 'Lobby – Café 東',
        load: { input: 'watts', watts: 12.5 },
        cableLength: 42.5,
      },
    },
  ];
  return actions.reduce(voltageDropCalculatorReducer, createInitialVoltageDropCalculatorState());
}

/** Query parameters carrying a hand-built JSON payload, as an untrusted link might. */
function linkParams(version: string, payload: unknown): URLSearchParams {
  const base64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return new URLSearchParams({ [SHARE_VERSION_PARAM]: version, [SHARE_STATE_PARAM]: base64 });
}

function roundTrip(state: VoltageDropCalculatorState) {
  return decodeShareParams(new URL(buildShareUrl(state, PAGE)).searchParams);
}

describe('encoding (v1)', () => {
  it('writes the current format version', () => {
    const url = new URL(buildShareUrl(sampleState(), PAGE));
    expect(url.searchParams.get(SHARE_VERSION_PARAM)).toBe(SHARE_FORMAT_VERSION);
  });

  it('round-trips the state exactly', () => {
    const state = sampleState();
    expect(state.inputMode).toBe('advanced');
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('round-trips the default Simple state', () => {
    const state = createInitialVoltageDropCalculatorState();
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('produces URL-safe text', () => {
    expect(encodeState(sampleState())).toMatch(/^[\w-]+$/);
  });
});

describe('v1 index tables', () => {
  // The tables are part of the link format. If calc-core's options change, these
  // tests fail: append new options to the tables, or create a new format version.
  it.each([
    ['input modes', V1_INPUT_MODES, INPUT_MODES],
    ['supply kinds', V1_SUPPLY_KINDS, SUPPLY_KINDS],
    ['wire systems', V1_WIRE_SYSTEMS, WIRE_SYSTEMS],
    ['cable length units', V1_CABLE_LENGTH_UNITS, CABLE_LENGTH_UNITS],
    ['load inputs', V1_LOAD_INPUTS, LOAD_INPUTS],
    ['wire gauges', V1_WIRE_GAUGES, WIRE_GAUGES],
  ] as const)('cover every %s option', (_label, table, options) => {
    expect([...table].sort()).toEqual([...options].sort());
  });

  it('keep their published order (append only; reordering breaks existing links)', () => {
    expect({
      inputModes: V1_INPUT_MODES,
      kinds: V1_SUPPLY_KINDS,
      systems: V1_WIRE_SYSTEMS,
      units: V1_CABLE_LENGTH_UNITS,
      loads: V1_LOAD_INPUTS,
      gauges: V1_WIRE_GAUGES,
    }).toEqual({
      inputModes: ['advanced', 'simple'],
      kinds: ['dc', 'ac'],
      systems: ['awg', 'mm2'],
      units: ['ft', 'm'],
      loads: ['amps', 'watts'],
      gauges: [
        'awg-24',
        'awg-22',
        'awg-20',
        'awg-18',
        'awg-16',
        'awg-14',
        'awg-12',
        'awg-10',
        'mm2-0.5',
        'mm2-0.75',
        'mm2-1',
        'mm2-1.5',
        'mm2-2.5',
        'mm2-4',
        'mm2-6',
      ],
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
      'a Simple link that breaks Simple mode’s rules',
      tampered((payload) => {
        payload[0] = V1_INPUT_MODES.indexOf('simple');
      }),
    ],
    [
      'an out-of-range supply kind',
      tampered((payload) => {
        payload[1][0] = V1_SUPPLY_KINDS.length;
      }),
    ],
    [
      'a supply voltage above 60 V',
      tampered((payload) => {
        payload[1][1] = 120;
      }),
    ],
    [
      'a reserve that is not an option',
      tampered((payload) => {
        payload[1][3] = 15;
      }),
    ],
    [
      'a drop limit that is not an option',
      tampered((payload) => {
        payload[2] = 7;
      }),
    ],
    [
      'a wire size from the other system',
      tampered((payload) => {
        payload[5][0]![4] = V1_WIRE_GAUGES.indexOf('awg-18');
      }),
    ],
    [
      'a load above 500 W',
      tampered((payload) => {
        payload[5][1]![3] = 600;
      }),
    ],
    [
      'a zero cable length',
      tampered((payload) => {
        payload[5][0]![5] = 0;
      }),
    ],
    [
      'no device groups',
      tampered((payload) => {
        payload[5] = [];
      }),
    ],
  ])('rejects %s', (_label, params) => {
    expect(decodeShareParams(params())).toEqual({ status: 'invalid' });
  });
});
