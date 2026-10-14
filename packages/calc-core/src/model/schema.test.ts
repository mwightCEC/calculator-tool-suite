import { describe, expect, it } from 'vitest';
import { createDefaultStorageCalculationInput } from './defaults';
import { cameraGroupSchema, storageCalculationInputSchema, storageSettingsSchema } from './schema';

const validInput = createDefaultStorageCalculationInput();
const validGroup = validInput.cameraGroups[0]!;

describe('storageCalculationInputSchema', () => {
  it('accepts the default input', () => {
    expect(storageCalculationInputSchema.parse(validInput)).toEqual(validInput);
  });

  it('requires at least one camera group', () => {
    expect(
      storageCalculationInputSchema.safeParse({ ...validInput, cameraGroups: [] }).success
    ).toBe(false);
  });

  it('rejects an unknown mode', () => {
    expect(storageCalculationInputSchema.safeParse({ ...validInput, mode: 'other' }).success).toBe(
      false
    );
  });
});

describe('cameraGroupSchema', () => {
  it('trims the group name', () => {
    expect(cameraGroupSchema.parse({ ...validGroup, name: '  Lobby  ' }).name).toBe('Lobby');
  });

  it.each([
    [{ source: 'estimate' }],
    [{ source: 'known-average', mbps: 3.5 }],
    [{ source: 'bitrate-cap', mbps: 0.1 }],
    [{ source: 'bitrate-cap', mbps: 100 }],
  ])('accepts bitrate %o', (bitrate) => {
    expect(cameraGroupSchema.parse({ ...validGroup, bitrate }).bitrate).toEqual(bitrate);
  });

  it('drops a stray value from an Estimate bitrate', () => {
    const parsed = cameraGroupSchema.parse({
      ...validGroup,
      bitrate: { source: 'estimate', mbps: 9 },
    });
    expect(parsed.bitrate).toEqual({ source: 'estimate' });
  });

  it.each([
    ['an empty name', { name: '   ' }],
    ['zero cameras', { cameraCount: 0 }],
    ['a fractional camera count', { cameraCount: 2.5 }],
    ['an unknown resolution', { resolution: '10MP' }],
    ['an unknown codec', { codec: 'av1' }],
    ['an unlisted frame rate', { frameRate: 12 }],
    ['an unknown scene complexity', { sceneComplexity: 'extreme' }],
    ['an unknown recording mode', { recordingMode: 'event' }],
    ['motion below 5%', { motionPercent: 0 }],
    ['motion off the 5% step', { motionPercent: 33 }],
    ['motion above 100%', { motionPercent: 105 }],
    ['zero schedule hours', { scheduleHours: 0 }],
    ['more than 24 schedule hours', { scheduleHours: 25 }],
    ['an unknown bitrate source', { bitrate: { source: 'guess' } }],
    ['a known average without a value', { bitrate: { source: 'known-average' } }],
    ['a bitrate cap below 0.1 Mbps', { bitrate: { source: 'bitrate-cap', mbps: 0.05 } }],
    ['a known average above 100 Mbps', { bitrate: { source: 'known-average', mbps: 101 } }],
    ['the old override field instead of bitrate', { bitrate: undefined, bitrateOverrideMbps: 4 }],
  ])('rejects %s', (_label, overrides) => {
    expect(cameraGroupSchema.safeParse({ ...validGroup, ...overrides }).success).toBe(false);
  });
});

describe('storageSettingsSchema', () => {
  it.each([
    ['zero retention days', { retentionDays: 0 }],
    ['zero drives', { driveCount: 0 }],
    ['an unlisted drive size', { driveSizeTb: 5 }],
    ['an unknown RAID level', { raidLevel: 'raid50' }],
    ['an unlisted reserve', { reservePercent: 20 }],
  ])('rejects %s', (_label, overrides) => {
    expect(storageSettingsSchema.safeParse({ ...validInput.storage, ...overrides }).success).toBe(
      false
    );
  });
});
