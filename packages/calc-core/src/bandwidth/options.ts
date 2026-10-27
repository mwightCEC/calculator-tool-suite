// Allowed values for Bandwidth calculator inputs. Display labels live in the UI.

/**
 * Per-camera rate for remote viewing: the cameras' own average bitrate, or a
 * custom rate entered for the stream viewers watch (for example a sub-stream).
 */
export const VIEWING_BITRATE_SOURCES = ['camera', 'custom'] as const;
export type ViewingBitrateSource = (typeof VIEWING_BITRATE_SOURCES)[number];

/** Uplink speeds for the network link carrying camera traffic, in Mbps. */
export const UPLINK_SPEEDS_MBPS = [10, 100, 1000, 10_000] as const;
export type UplinkSpeedMbps = (typeof UPLINK_SPEEDS_MBPS)[number];

/** Allowance added to every total for protocol overhead and bitrate bursts. */
export const OVERHEAD_PERCENTS = [0, 5, 10, 20] as const;
export type OverheadPercent = (typeof OVERHEAD_PERCENTS)[number];

export const MAX_REMOTE_VIEWERS = 100;
export const MAX_CAMERAS_PER_VIEWER = 64;
/** Upper bound for a site upload speed a user types in, in Mbps. */
export const MAX_LINK_CAPACITY_MBPS = 100_000;
