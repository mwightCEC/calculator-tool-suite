import {
  OVERHEAD_PERCENTS,
  RECORDED_STREAMS,
  SUB_STREAM_RESOLUTIONS,
  UPLINK_SPEEDS_MBPS,
  VIEWING_STREAMS,
  type LinkKind,
  type LinkStatus,
  type RecordedStreams,
  type SubStreamResolution,
  type UplinkSpeedMbps,
  type ViewingStream,
} from '@cctv/calc-core';
import { toOptions } from '../../../../lib/camera-labels';

// Display labels for Bandwidth-only options. Camera group labels live in lib/camera-labels.

export const SUB_STREAM_RESOLUTION_LABELS: Record<SubStreamResolution, string> = {
  d1: 'D1',
  '720p': '720p',
  '1080p': '1080p',
};

export const RECORDED_STREAMS_LABELS: Record<RecordedStreams, string> = {
  main: 'Main only',
  'main-and-sub': 'Main + sub',
};

export const VIEWING_STREAM_LABELS: Record<ViewingStream, string> = {
  sub: 'Sub (grid)',
  main: 'Main (full screen)',
};

export const UPLINK_LABELS: Record<UplinkSpeedMbps, string> = {
  10: '10 Mbps',
  100: '100 Mbps',
  1000: '1 Gbps (1000 Mbps)',
  10_000: '10 Gbps',
};

export const SUB_STREAM_RESOLUTION_OPTIONS = toOptions(
  SUB_STREAM_RESOLUTIONS,
  SUB_STREAM_RESOLUTION_LABELS
);
export const RECORDED_STREAMS_OPTIONS = toOptions(RECORDED_STREAMS, RECORDED_STREAMS_LABELS);
export const VIEWING_STREAM_OPTIONS = toOptions(VIEWING_STREAMS, VIEWING_STREAM_LABELS);

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
  'recorder-limit': 'Recorder limit',
  uplink: 'Uplink',
  'site-upload': 'Site upload',
};

export const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  ok: 'OK',
  caution: 'Caution',
  'over-capacity': 'Over capacity',
};
