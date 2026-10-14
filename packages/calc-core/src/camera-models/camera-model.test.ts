import { describe, expect, it } from 'vitest';
import {
  cameraModelSchema,
  maxMainStreamBitrateMbps,
  typicalBitrateMbpsFor,
  type CameraModel,
} from './camera-model';

/**
 * Test fixture only, from the CE-VX80ARS5C spec values in the project handoff.
 * Not product data: displayName and productUrl are stand-ins, and typicalBitrate
 * is null because the spec sheet publishes only the configurable range.
 */
const CE_VX80ARS5C: CameraModel = {
  manufacturer: 'Clinton Electronics',
  modelNumber: 'CE-VX80ARS5C',
  displayName: 'CE-VX80ARS5C',
  productUrl: 'https://www.clintonelectronics.com/',
  mainStream: { widthPx: 2592, heightPx: 1944, resolution: '5MP' },
  supportedCodecs: ['h264', 'h265', 'mjpeg'],
  maxFrameRate: 30,
  rateControlModes: ['CBR', 'VBR', 'VBR+'],
  mainStreamBitrateKbps: { min: 512, max: 15_000 },
  typicalBitrate: null,
  power: {
    poeStandard: 'IEEE 802.3af',
    poeClass: null,
    watts: { day: 3.9, night: 5.4, max: 6.6 },
  },
  lens: { focalLengthMm: { min: 2.7, max: 13.5 }, maxApertureFNumber: 1.4 },
  fieldOfViewDeg: { horizontal: { min: 32, max: 106 }, vertical: null, diagonal: null },
  networkPortMbps: 100,
};

function fixture(changes: Partial<CameraModel> = {}): CameraModel {
  return { ...structuredClone(CE_VX80ARS5C), ...changes };
}

describe('cameraModelSchema', () => {
  it('accepts the CE-VX80ARS5C fixture', () => {
    expect(cameraModelSchema.parse(CE_VX80ARS5C)).toEqual(CE_VX80ARS5C);
  });

  it('accepts typical bitrates per codec with provenance', () => {
    const withTypical = fixture({
      typicalBitrate: [{ codec: 'h265', mbps: 2.5, provenance: 'measured: test fixture' }],
    });
    expect(cameraModelSchema.safeParse(withTypical).success).toBe(true);
  });

  it.each([
    ['an unknown codec', { supportedCodecs: ['av1'] }],
    ['no codecs', { supportedCodecs: [] }],
    ['an inverted bitrate range', { mainStreamBitrateKbps: { min: 15_000, max: 512 } }],
    ['an invalid product URL', { productUrl: 'clintonelectronics' }],
    ['an empty typical bitrate list', { typicalBitrate: [] }],
    [
      'a typical bitrate without provenance',
      { typicalBitrate: [{ codec: 'h265', mbps: 2.5, provenance: '' }] },
    ],
    ['an unknown resolution tier', { mainStream: { widthPx: 1, heightPx: 1, resolution: '7MP' } }],
  ])('rejects %s', (_label, changes) => {
    expect(cameraModelSchema.safeParse({ ...CE_VX80ARS5C, ...changes }).success).toBe(false);
  });
});

describe('maxMainStreamBitrateMbps', () => {
  it('converts the spec-sheet ceiling from kbps to Mbps', () => {
    expect(maxMainStreamBitrateMbps(CE_VX80ARS5C)).toBe(15);
  });
});

describe('typicalBitrateMbpsFor', () => {
  it('returns null when no typical data has been supplied', () => {
    expect(typicalBitrateMbpsFor(CE_VX80ARS5C, 'h265')).toBeNull();
  });

  it('never falls back to the configurable range', () => {
    const { min, max } = CE_VX80ARS5C.mainStreamBitrateKbps;
    const result = typicalBitrateMbpsFor(CE_VX80ARS5C, 'h264');
    expect(result).not.toBe(min / 1000);
    expect(result).not.toBe(max / 1000);
  });

  it('returns the matching codec entry, or null for other codecs', () => {
    const withTypical = fixture({
      typicalBitrate: [{ codec: 'h265', mbps: 2.5, provenance: 'measured: test fixture' }],
    });
    expect(typicalBitrateMbpsFor(withTypical, 'h265')).toBe(2.5);
    expect(typicalBitrateMbpsFor(withTypical, 'h264')).toBeNull();
  });
});
