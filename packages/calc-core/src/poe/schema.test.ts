import { describe, expect, it } from 'vitest';
import {
  createDefaultPoeInput,
  createPoeDeviceGroup,
  poeDeviceGroupSchema,
  poeInputSchema,
} from './schema';

const valid = createDefaultPoeInput();

describe('createDefaultPoeInput', () => {
  it('passes the schema', () => {
    expect(poeInputSchema.parse(valid)).toEqual(valid);
  });

  it('uses the spec defaults', () => {
    expect(valid).toEqual({
      powerSource: { budgetWatts: 120, ports: 8, portStandard: 'at', reservePercent: 20 },
      deviceGroups: [
        {
          id: 'g1',
          name: 'Camera group 1',
          deviceCount: 4,
          power: { input: 'watts', watts: 6 },
          cableLength: null,
        },
      ],
      cableLengthUnit: 'ft',
    });
  });
});

describe('poeDeviceGroupSchema', () => {
  const group = createPoeDeviceGroup('g1', 'Lobby');

  it.each([
    ['power by class', { power: { input: 'class', poeClass: 4 } }],
    ['a cable length', { cableLength: 250 }],
  ])('accepts %s', (_label, changes) => {
    expect(poeDeviceGroupSchema.safeParse({ ...group, ...changes }).success).toBe(true);
  });

  it.each([
    ['zero devices', { deviceCount: 0 }],
    ['an unknown class', { power: { input: 'class', poeClass: 9 } }],
    ['a class given as watts', { power: { input: 'class', watts: 6 } }],
    ['a draw below 0.5 W', { power: { input: 'watts', watts: 0.4 } }],
    ['a draw above 90 W', { power: { input: 'watts', watts: 91 } }],
    ['an unknown power input', { power: { input: 'amps', amps: 1 } }],
    ['a zero cable length', { cableLength: 0 }],
    ['a cable length above 1000', { cableLength: 1001 }],
    ['a blank name', { name: '  ' }],
  ])('rejects %s', (_label, changes) => {
    expect(poeDeviceGroupSchema.safeParse({ ...group, ...changes }).success).toBe(false);
  });
});

describe('poeInputSchema', () => {
  it.each([
    ['no device groups', { deviceGroups: [] }],
    ['an unknown length unit', { cableLengthUnit: 'yd' }],
    ['a budget below 1 W', { powerSource: { ...valid.powerSource, budgetWatts: 0.5 } }],
    ['a budget above 2000 W', { powerSource: { ...valid.powerSource, budgetWatts: 2001 } }],
    ['zero ports', { powerSource: { ...valid.powerSource, ports: 0 } }],
    ['too many ports', { powerSource: { ...valid.powerSource, ports: 97 } }],
    ['fractional ports', { powerSource: { ...valid.powerSource, ports: 8.5 } }],
    ['an unknown port standard', { powerSource: { ...valid.powerSource, portStandard: 'bt' } }],
    ['an unlisted reserve', { powerSource: { ...valid.powerSource, reservePercent: 15 } }],
  ])('rejects %s', (_label, changes) => {
    expect(poeInputSchema.safeParse({ ...valid, ...changes }).success).toBe(false);
  });
});
