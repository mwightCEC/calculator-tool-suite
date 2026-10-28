import { describe, expect, it } from 'vitest';
import {
  createDefaultVoltageDropInput,
  createVoltageDropGroup,
  voltageDropGroupSchema,
  voltageDropInputSchema,
} from './schema';

const valid = createDefaultVoltageDropInput();

describe('createDefaultVoltageDropInput', () => {
  it('passes the schema', () => {
    expect(voltageDropInputSchema.parse(valid)).toEqual(valid);
  });

  it('uses the agreed defaults', () => {
    expect(valid).toEqual({
      powerSupply: { kind: 'dc', volts: 12, ratedAmps: 5, reservePercent: 20 },
      deviceGroups: [
        {
          id: 'g1',
          name: 'Camera group 1',
          deviceCount: 4,
          load: { input: 'amps', amps: 0.5 },
          gauge: 'awg-18',
          cableLength: 100,
        },
      ],
      dropLimitPercent: 10,
      wireSystem: 'awg',
      cableLengthUnit: 'ft',
    });
  });
});

describe('voltageDropGroupSchema', () => {
  const group = createVoltageDropGroup('g1', 'Gate');

  it.each([
    ['load by watts', { load: { input: 'watts', watts: 24 } }],
    ['a metric wire size', { gauge: 'mm2-1.5' }],
    ['a 5000 run', { cableLength: 5000 }],
  ])('accepts %s', (_label, changes) => {
    expect(voltageDropGroupSchema.safeParse({ ...group, ...changes }).success).toBe(true);
  });

  it.each([
    ['zero devices', { deviceCount: 0 }],
    ['a current below 0.01 A', { load: { input: 'amps', amps: 0.001 } }],
    ['a current above 20 A', { load: { input: 'amps', amps: 21 } }],
    ['a power below 0.1 W', { load: { input: 'watts', watts: 0.05 } }],
    ['a power above 500 W', { load: { input: 'watts', watts: 501 } }],
    ['an unknown load input', { load: { input: 'class', poeClass: 3 } }],
    ['an unknown wire size', { gauge: 'awg-19' }],
    ['no cable length', { cableLength: null }],
    ['a zero cable length', { cableLength: 0 }],
    ['a cable length above 5000', { cableLength: 5001 }],
    ['a blank name', { name: '  ' }],
  ])('rejects %s', (_label, changes) => {
    expect(voltageDropGroupSchema.safeParse({ ...group, ...changes }).success).toBe(false);
  });
});

describe('voltageDropInputSchema', () => {
  const supply = valid.powerSupply;

  it('accepts a 24 V AC supply', () => {
    const input = { ...valid, powerSupply: { ...supply, kind: 'ac', volts: 24 } };
    expect(voltageDropInputSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    ['no device groups', { deviceGroups: [] }],
    ['an unknown length unit', { cableLengthUnit: 'yd' }],
    ['an unknown wire system', { wireSystem: 'swg' }],
    ['a wire size from the other system', { wireSystem: 'mm2' }],
    ['an unlisted drop limit', { dropLimitPercent: 3 }],
    ['an unknown supply kind', { powerSupply: { ...supply, kind: 'pulse' } }],
    ['a supply below 5 V', { powerSupply: { ...supply, volts: 4.9 } }],
    ['a supply above 60 V', { powerSupply: { ...supply, volts: 61 } }],
    ['a zero rating', { powerSupply: { ...supply, ratedAmps: 0 } }],
    ['a rating above 200 A', { powerSupply: { ...supply, ratedAmps: 201 } }],
    ['an unlisted reserve', { powerSupply: { ...supply, reservePercent: 15 } }],
  ])('rejects %s', (_label, changes) => {
    expect(voltageDropInputSchema.safeParse({ ...valid, ...changes }).success).toBe(false);
  });
});
