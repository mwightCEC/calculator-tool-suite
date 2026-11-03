import {
  CABLE_LENGTH_UNITS,
  DORI_LEVELS,
  RESOLUTIONS,
  SENSOR_FORMATS,
  SOLVE_FOR,
} from '@cctv/calc-core';
import { describe, expect, it } from 'vitest';
import { SHARE_STATE_PARAM, SHARE_VERSION_PARAM } from '../../../../lib/share/share-codec';
import {
  createInitialLensFovCalculatorState,
  lensFovCalculatorReducer,
  type LensFovCalculatorAction,
  type LensFovCalculatorState,
} from './lens-fov-calculator-state';
import {
  stateToV1Payload,
  V1_DORI_LEVELS,
  V1_LENGTH_UNITS,
  V1_RESOLUTIONS,
  V1_SENSOR_FORMATS,
  V1_SOLVE_FOR,
} from './share-format-v1';
import { buildShareUrl, decodeShareParams, encodeState, SHARE_FORMAT_VERSION } from './share-link';

const PAGE = 'https://example.test/tools/lens-fov';

function stateAfter(...actions: LensFovCalculatorAction[]): LensFovCalculatorState {
  return actions.reduce(lensFovCalculatorReducer, createInitialLensFovCalculatorState());
}

/** Tiers and types, solving for distance to a DORI level, in metres. */
const presetState = () =>
  stateAfter(
    { type: 'set-resolution', resolution: '8MP' },
    { type: 'set-sensor', sensor: '1/1.8' },
    { type: 'set-focal-length', focalLengthMm: 12.5 },
    { type: 'set-solve-for', solveFor: 'distance' },
    { type: 'set-dori-target', level: 'identification' },
    { type: 'set-length-unit', unit: 'm' },
    { type: 'set-distance', distance: 14.2 }
  );

/** Custom sizes and a custom density. */
const customState = () =>
  stateAfter(
    { type: 'set-resolution', resolution: 'custom' },
    { type: 'set-custom-resolution', changes: { width: 2688, height: 1520 } },
    { type: 'set-sensor', sensor: 'custom' },
    { type: 'set-custom-sensor', changes: { widthMm: 5.12 } },
    { type: 'set-custom-density', density: 80 }
  );

/** Query parameters carrying a hand-built JSON payload, as an untrusted link might. */
function linkParams(version: string, payload: unknown): URLSearchParams {
  const base64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return new URLSearchParams({ [SHARE_VERSION_PARAM]: version, [SHARE_STATE_PARAM]: base64 });
}

function roundTrip(state: LensFovCalculatorState) {
  return decodeShareParams(new URL(buildShareUrl(state, PAGE)).searchParams);
}

describe('encoding (v1)', () => {
  it('writes the current format version', () => {
    const url = new URL(buildShareUrl(presetState(), PAGE));
    expect(url.searchParams.get(SHARE_VERSION_PARAM)).toBe(SHARE_FORMAT_VERSION);
  });

  it.each([
    ['tiers, a DORI target and metres', presetState],
    ['custom sizes and a custom density', customState],
    ['the defaults', createInitialLensFovCalculatorState],
  ])('round-trips %s exactly', (_label, make) => {
    const state = make();
    expect(roundTrip(state)).toEqual({ status: 'loaded', state });
  });

  it('writes a short, URL-safe positional array', () => {
    expect(stateToV1Payload(presetState())).toEqual([8, 7, 12.5, 1, 14.2, 3, 1]);
    expect(stateToV1Payload(customState())).toEqual([
      [2688, 1520],
      [5.12, 3.18],
      2.8,
      0,
      30,
      [80],
      0,
    ]);
    expect(encodeState(customState())).toMatch(/^[\w-]+$/);
  });
});

describe('v1 index tables', () => {
  // The tables are part of the link format. If calc-core's options change, these
  // tests fail: append new options to the tables, or create a new format version.
  it.each([
    ['resolutions', V1_RESOLUTIONS, RESOLUTIONS],
    ['sensor types', V1_SENSOR_FORMATS, SENSOR_FORMATS],
    ['solve-for modes', V1_SOLVE_FOR, SOLVE_FOR],
    ['DORI levels', V1_DORI_LEVELS, DORI_LEVELS],
    ['length units', V1_LENGTH_UNITS, CABLE_LENGTH_UNITS],
  ] as const)('cover every %s option', (_label, table, options) => {
    expect([...table].sort()).toEqual([...options].sort());
  });

  it('keep their published order (append only; reordering breaks existing links)', () => {
    expect({
      resolutions: V1_RESOLUTIONS,
      sensors: V1_SENSOR_FORMATS,
      modes: V1_SOLVE_FOR,
      levels: V1_DORI_LEVELS,
      units: V1_LENGTH_UNITS,
    }).toEqual({
      resolutions: ['nHD', '960H', '1MP', '2MP', '3MP', '4MP', '5MP', '6MP', '8MP', '12MP'],
      sensors: ['1/4', '1/3', '1/2.9', '1/2.8', '1/2.7', '1/2.5', '1/2', '1/1.8', '1/1.2'],
      modes: ['coverage', 'distance'],
      levels: ['detection', 'observation', 'recognition', 'identification'],
      units: ['ft', 'm'],
    });
  });
});

describe('decodeShareParams', () => {
  it('reports "none" when the link carries no state', () => {
    expect(decodeShareParams(new URLSearchParams())).toEqual({ status: 'none' });
  });

  /** A v1 payload with one item replaced, as a tampered or broken link might carry. */
  const tampered = (position: number, value: unknown) => () => {
    const payload: unknown[] = stateToV1Payload(presetState());
    payload[position] = value;
    return linkParams(SHARE_FORMAT_VERSION, payload);
  };

  it.each([
    ['an unknown version', () => linkParams('99', stateToV1Payload(presetState()))],
    ['a state object instead of an array', () => linkParams(SHARE_FORMAT_VERSION, presetState())],
    ['an out-of-range resolution', tampered(0, V1_RESOLUTIONS.length)],
    ['a custom image below 160 px', tampered(0, [100, 1080])],
    ['an out-of-range sensor type', tampered(1, V1_SENSOR_FORMATS.length)],
    ['a custom sensor above 50 mm', tampered(1, [60, 3])],
    ['a lens below 0.8 mm', tampered(2, 0.5)],
    ['an unknown mode', tampered(3, 2)],
    ['a zero distance', tampered(4, 0)],
    ['an out-of-range DORI level', tampered(5, V1_DORI_LEVELS.length)],
    ['a custom density above 10000', tampered(5, [20_000])],
    ['an unknown length unit', tampered(6, 2)],
    ['a missing item', () => linkParams(SHARE_FORMAT_VERSION, [8, 7, 12.5, 1, 14.2, 3])],
  ])('rejects %s', (_label, params) => {
    expect(decodeShareParams(params())).toEqual({ status: 'invalid' });
  });
});
