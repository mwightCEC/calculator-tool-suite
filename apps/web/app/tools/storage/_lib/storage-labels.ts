import {
  BITRATE_SOURCES,
  CALCULATION_MODES,
  CODECS,
  DRIVE_SIZES_TB,
  FRAME_RATES,
  RAID_LEVELS,
  RECORDING_MODES,
  RESERVE_PERCENTS,
  RESOLUTIONS,
  SCENE_COMPLEXITIES,
  type BitrateSource,
  type CalculationMode,
  type Codec,
  type RaidLevel,
  type RecordingMode,
  type Resolution,
  type SceneComplexity,
} from '@cctv/calc-core';

// Display labels for calc-core option values. calc-core owns the values; the UI owns the words.

export const CALCULATION_MODE_LABELS: Record<CalculationMode, string> = {
  'storage-needed': 'Storage needed',
  'days-from-capacity': 'Days from capacity',
};

export const RESOLUTION_LABELS: Record<Resolution, string> = {
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
  'h264-smart': 'H.264 smart',
  h265: 'H.265',
  'h265-smart': 'H.265 smart',
  mjpeg: 'MJPEG',
};

export const SCENE_COMPLEXITY_LABELS: Record<SceneComplexity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const RECORDING_MODE_LABELS: Record<RecordingMode, string> = {
  continuous: 'Continuous',
  motion: 'Motion',
  schedule: 'Schedule',
};

export const BITRATE_SOURCE_LABELS: Record<BitrateSource, string> = {
  estimate: 'Estimate',
  'known-average': 'Known average',
  'bitrate-cap': 'Bitrate cap',
};

export const RAID_LABELS: Record<RaidLevel, string> = {
  none: 'None',
  raid1: 'RAID 1',
  raid5: 'RAID 5',
  raid6: 'RAID 6',
  raid10: 'RAID 10',
};

/** Option list for OptionButtons from an ordered value list and its labels. */
function toOptions<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }));
}

export const CALCULATION_MODE_OPTIONS = toOptions(CALCULATION_MODES, CALCULATION_MODE_LABELS);
export const SCENE_COMPLEXITY_OPTIONS = toOptions(SCENE_COMPLEXITIES, SCENE_COMPLEXITY_LABELS);
export const RECORDING_MODE_OPTIONS = toOptions(RECORDING_MODES, RECORDING_MODE_LABELS);
export const BITRATE_SOURCE_OPTIONS = toOptions(BITRATE_SOURCES, BITRATE_SOURCE_LABELS);

// Select data (Mantine Select values are strings).
export const RESOLUTION_SELECT_DATA = toOptions(RESOLUTIONS, RESOLUTION_LABELS);
export const CODEC_SELECT_DATA = toOptions(CODECS, CODEC_LABELS);
export const RAID_SELECT_DATA = toOptions(RAID_LEVELS, RAID_LABELS);
export const FRAME_RATE_SELECT_DATA = FRAME_RATES.map((fps) => ({
  value: String(fps),
  label: `${fps} fps`,
}));
export const DRIVE_SIZE_SELECT_DATA = DRIVE_SIZES_TB.map((tb) => ({
  value: String(tb),
  label: `${tb} TB`,
}));
export const RESERVE_SELECT_DATA = RESERVE_PERCENTS.map((percent) => ({
  value: String(percent),
  label: `${percent}%`,
}));

/** Maps a Select string back to one of the allowed option values, if it is one. */
export function parseOption<T extends string | number>(
  allowed: readonly T[],
  value: string | null
): T | undefined {
  return allowed.find((option) => String(option) === value);
}
