import {
  OVERHEAD_PERCENTS,
  UPLINK_SPEEDS_MBPS,
  VIEWING_BITRATE_SOURCES,
  type LinkKind,
  type LinkStatus,
  type UplinkSpeedMbps,
  type ViewingBitrateSource,
} from '@cctv/calc-core';
import { toOptions } from '../../../../lib/camera-labels';

// Display labels for Bandwidth-only options. Camera group labels live in lib/camera-labels.

export const VIEWING_BITRATE_SOURCE_LABELS: Record<ViewingBitrateSource, string> = {
  camera: 'Camera bitrate',
  custom: 'Custom bitrate',
};

export const UPLINK_LABELS: Record<UplinkSpeedMbps, string> = {
  10: '10 Mbps',
  100: '100 Mbps',
  1000: '1 Gbps (1000 Mbps)',
  10_000: '10 Gbps',
};

export const VIEWING_BITRATE_SOURCE_OPTIONS = toOptions(
  VIEWING_BITRATE_SOURCES,
  VIEWING_BITRATE_SOURCE_LABELS
);

// OptionButtons values are strings, so numeric options are keyed by their string form.
export const UPLINK_OFF = 'off';
export const UPLINK_OPTIONS = [
  { value: UPLINK_OFF, label: 'Off' },
  ...UPLINK_SPEEDS_MBPS.map((mbps) => ({ value: String(mbps), label: UPLINK_LABELS[mbps] })),
];
export const OVERHEAD_OPTIONS = OVERHEAD_PERCENTS.map((percent) => ({
  value: String(percent),
  label: `${percent}%`,
}));

export const LINK_LABELS: Record<LinkKind, string> = {
  uplink: 'Uplink',
  'site-upload': 'Site upload',
};

export const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  ok: 'OK',
  caution: 'Caution',
  'over-capacity': 'Over capacity',
};
