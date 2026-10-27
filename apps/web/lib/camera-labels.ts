import {
  BITRATE_SOURCES,
  CODECS,
  FRAME_RATES,
  RESOLUTIONS,
  SCENE_COMPLEXITIES,
  type BitrateSource,
  type Codec,
  type Resolution,
  type SceneComplexity,
} from '@cctv/calc-core';

// Display labels for camera group options shared by every calculator.
// calc-core owns the values; the UI owns the words.

export const RESOLUTION_LABELS: Record<Resolution, string> = {
  nHD: '640×360 (nHD)',
  '960H': '960×480 (960H)',
  '1MP': '1MP (720p)',
  '2MP': '2MP (1080p)',
  '3MP': '3MP',
  '4MP': '4MP (1440p)',
  '5MP': '5MP',
  '6MP': '6MP',
  '8MP': '8MP (4K)',
  '12MP': '12MP',
};

export const CODEC_LABELS: Record<Codec, string> = {
  h264: 'H.264',
  h265: 'H.265',
  mjpeg: 'MJPEG',
};

export const SCENE_COMPLEXITY_LABELS: Record<SceneComplexity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const BITRATE_SOURCE_LABELS: Record<BitrateSource, string> = {
  estimate: 'Estimate',
  'known-average': 'VBR',
  'bitrate-cap': 'CBR',
};

/** Option list for OptionButtons or Select from an ordered value list and its labels. */
export function toOptions<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }));
}

export const SCENE_COMPLEXITY_OPTIONS = toOptions(SCENE_COMPLEXITIES, SCENE_COMPLEXITY_LABELS);
export const BITRATE_SOURCE_OPTIONS = toOptions(BITRATE_SOURCES, BITRATE_SOURCE_LABELS);

// Select data (Mantine Select values are strings).
export const RESOLUTION_SELECT_DATA = toOptions(RESOLUTIONS, RESOLUTION_LABELS);
export const CODEC_SELECT_DATA = toOptions(CODECS, CODEC_LABELS);
export const FRAME_RATE_SELECT_DATA = FRAME_RATES.map((fps) => ({
  value: String(fps),
  label: `${fps} fps`,
}));

/** Maps a Select string back to one of the allowed option values, if it is one. */
export function parseOption<T extends string | number>(
  allowed: readonly T[],
  value: string | null
): T | undefined {
  return allowed.find((option) => String(option) === value);
}
