// Allowed values for every calculator input. Display labels live in the UI.

/** Lowest first. nHD is 640×360 and 960H is 960×480; the rest are megapixel tiers. */
export const RESOLUTIONS = [
  'nHD',
  '960H',
  '1MP',
  '2MP',
  '3MP',
  '4MP',
  '5MP',
  '6MP',
  '8MP',
  '12MP',
] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export const CODECS = ['h264', 'h265', 'mjpeg'] as const;
export type Codec = (typeof CODECS)[number];

export const FRAME_RATES = [1, 5, 10, 15, 20, 25, 30] as const;
export type FrameRate = (typeof FRAME_RATES)[number];

/** Scene detail and movement, which drives compressibility (not recording time). */
export const SCENE_COMPLEXITIES = ['low', 'medium', 'high'] as const;
export type SceneComplexity = (typeof SCENE_COMPLEXITIES)[number];

/** Controls how many hours per day are written to disk. */
export const RECORDING_MODES = ['continuous', 'motion', 'schedule'] as const;
export type RecordingMode = (typeof RECORDING_MODES)[number];

export const MOTION_PERCENT_MIN = 5;
export const MOTION_PERCENT_MAX = 100;
export const MOTION_PERCENT_STEP = 5;

export const SCHEDULE_HOURS_MIN = 1;
export const SCHEDULE_HOURS_MAX = 24;

/**
 * Where a group's bitrate comes from:
 * - `estimate`: the bitrate model's planning range (early design, cameras not chosen).
 * - `known-average`: a measured average from an existing system's stream statistics.
 * - `bitrate-cap`: the CBR / max-bitrate limit configured on the camera (reliable worst case).
 */
export const BITRATE_SOURCES = ['estimate', 'known-average', 'bitrate-cap'] as const;
export type BitrateSource = (typeof BITRATE_SOURCES)[number];

/** Limits for a bitrate the user enters (known average or cap). */
export const BITRATE_INPUT_MIN_MBPS = 0.1;
export const BITRATE_INPUT_MAX_MBPS = 100;

export const DRIVE_SIZES_TB = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] as const;
export type DriveSizeTb = (typeof DRIVE_SIZES_TB)[number];

export const RAID_LEVELS = ['none', 'raid1', 'raid5', 'raid6', 'raid10'] as const;
export type RaidLevel = (typeof RAID_LEVELS)[number];

export const RESERVE_PERCENTS = [0, 5, 10, 15] as const;
export type ReservePercent = (typeof RESERVE_PERCENTS)[number];

/**
 * - `storage-needed`: user supplies a retention target; we size the drives.
 * - `days-from-capacity`: user supplies a drive count; we estimate retention.
 */
export const CALCULATION_MODES = ['storage-needed', 'days-from-capacity'] as const;
export type CalculationMode = (typeof CALCULATION_MODES)[number];
