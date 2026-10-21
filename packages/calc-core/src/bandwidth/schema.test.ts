import { describe, expect, it } from 'vitest';
import {
  bandwidthCameraGroupSchema,
  bandwidthInputSchema,
  createBandwidthCameraGroup,
  createDefaultBandwidthInput,
} from './schema';

const valid = createDefaultBandwidthInput();

describe('createDefaultBandwidthInput', () => {
  it('passes the schema', () => {
    expect(bandwidthInputSchema.parse(valid)).toEqual(valid);
  });

  it('uses the spec defaults', () => {
    expect(valid).toEqual(
      expect.objectContaining({
        recordedStreams: 'main',
        remoteViewing: { viewers: 1, camerasPerViewer: 4, stream: 'sub' },
        network: { recorderLimitMbps: null, uplinkMbps: null, siteUploadMbps: null },
        overheadPercent: 10,
      })
    );
    expect(valid.cameraGroups).toEqual([
      expect.objectContaining({ id: 'g1', name: 'Camera group 1', subStreamResolution: 'd1' }),
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

  it.each([
    ['an unknown sub-stream resolution', { subStreamResolution: '4K' }],
    ['zero cameras', { cameraCount: 0 }],
    ['a missing sub-stream resolution', { subStreamResolution: undefined }],
  ])('rejects %s', (_label, changes) => {
    const group = { ...createBandwidthCameraGroup('g1', 'Lobby'), ...changes };
    expect(bandwidthCameraGroupSchema.safeParse(group).success).toBe(false);
  });
});

describe('bandwidthInputSchema', () => {
  it('accepts entered link capacities', () => {
    const input = {
      ...valid,
      network: { recorderLimitMbps: 160, uplinkMbps: 1000, siteUploadMbps: 20 },
    };
    expect(bandwidthInputSchema.safeParse(input).success).toBe(true);
  });

  it('accepts zero remote viewers', () => {
    const input = { ...valid, remoteViewing: { ...valid.remoteViewing, viewers: 0 } };
    expect(bandwidthInputSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    ['no camera groups', { cameraGroups: [] }],
    ['an unknown recorded-streams option', { recordedStreams: 'sub' }],
    ['negative viewers', { remoteViewing: { viewers: -1, camerasPerViewer: 4, stream: 'sub' } }],
    ['too many viewers', { remoteViewing: { viewers: 101, camerasPerViewer: 4, stream: 'sub' } }],
    [
      'zero cameras per viewer',
      { remoteViewing: { viewers: 1, camerasPerViewer: 0, stream: 'sub' } },
    ],
    [
      'an unknown viewing stream',
      { remoteViewing: { viewers: 1, camerasPerViewer: 4, stream: 'hd' } },
    ],
    [
      'an unlisted uplink speed',
      { network: { recorderLimitMbps: null, uplinkMbps: 500, siteUploadMbps: null } },
    ],
    [
      'a zero recorder limit',
      { network: { recorderLimitMbps: 0, uplinkMbps: null, siteUploadMbps: null } },
    ],
    [
      'a negative site upload',
      { network: { recorderLimitMbps: null, uplinkMbps: null, siteUploadMbps: -5 } },
    ],
    ['an unlisted overhead', { overheadPercent: 15 }],
  ])('rejects %s', (_label, changes) => {
    expect(bandwidthInputSchema.safeParse({ ...valid, ...changes }).success).toBe(false);
  });
});
