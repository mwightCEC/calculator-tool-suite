import { describe, expect, it } from 'vitest';
import {
  bandwidthCameraGroupSchema,
  bandwidthInputSchema,
  createBandwidthCameraGroup,
  createDefaultBandwidthInput,
  type RemoteViewing,
} from './schema';

const valid = createDefaultBandwidthInput();

const viewing = (changes: Partial<Record<keyof RemoteViewing, unknown>>) => ({
  remoteViewing: { ...valid.remoteViewing, ...changes },
});

describe('createDefaultBandwidthInput', () => {
  it('passes the schema', () => {
    expect(bandwidthInputSchema.parse(valid)).toEqual(valid);
  });

  it('uses the defaults: remote viewing off, no checks, 10% overhead', () => {
    expect(valid).toEqual(
      expect.objectContaining({
        remoteViewing: {
          enabled: false,
          viewers: 1,
          camerasPerViewer: 4,
          bitrateSource: 'camera',
          customMbps: 2,
          siteUploadMbps: null,
        },
        network: { uplinkMbps: null },
        overheadPercent: 10,
      })
    );
    expect(valid.cameraGroups).toEqual([
      expect.objectContaining({ id: 'g1', name: 'Camera group 1' }),
    ]);
  });
});

describe('bandwidthCameraGroupSchema', () => {
  it('has no recording-mode fields (network traffic is continuous)', () => {
    const group = createBandwidthCameraGroup('g1', 'Lobby');
    expect(group).not.toHaveProperty('recordingMode');
    const parsed = bandwidthCameraGroupSchema.parse({ ...group, recordingMode: 'motion' });
    expect(parsed).not.toHaveProperty('recordingMode');
  });

  it('rejects zero cameras', () => {
    const group = { ...createBandwidthCameraGroup('g1', 'Lobby'), cameraCount: 0 };
    expect(bandwidthCameraGroupSchema.safeParse(group).success).toBe(false);
  });
});

describe('bandwidthInputSchema', () => {
  it('accepts remote viewing with a custom bitrate and a site upload speed', () => {
    const input = {
      ...valid,
      ...viewing({ enabled: true, bitrateSource: 'custom', customMbps: 0.5, siteUploadMbps: 20 }),
    };
    expect(bandwidthInputSchema.safeParse(input).success).toBe(true);
  });

  it.each([10, 100, 1000, 10_000])('accepts a %i Mbps uplink', (uplinkMbps) => {
    const input = { ...valid, network: { uplinkMbps } };
    expect(bandwidthInputSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    ['no camera groups', { cameraGroups: [] }],
    ['zero viewers', viewing({ viewers: 0 })],
    ['too many viewers', viewing({ viewers: 101 })],
    ['zero cameras per viewer', viewing({ camerasPerViewer: 0 })],
    ['an unknown viewing bitrate source', viewing({ bitrateSource: 'sub' })],
    ['a custom bitrate below 0.1 Mbps', viewing({ customMbps: 0 })],
    ['a custom bitrate above 100 Mbps', viewing({ customMbps: 101 })],
    ['a negative site upload', viewing({ siteUploadMbps: -5 })],
    ['a missing enabled flag', viewing({ enabled: undefined })],
    ['an unlisted uplink speed', { network: { uplinkMbps: 500 } }],
    ['an unlisted overhead', { overheadPercent: 15 }],
  ])('rejects %s', (_label, changes) => {
    expect(bandwidthInputSchema.safeParse({ ...valid, ...changes }).success).toBe(false);
  });
});
