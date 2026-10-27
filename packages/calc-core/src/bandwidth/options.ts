// Allowed values for Bandwidth calculator inputs. Display labels live in the UI.

/** Sub-stream resolutions offered per camera group. D1 is about 704 × 480 / 576. */
export const SUB_STREAM_RESOLUTIONS = ['d1', '720p', '1080p'] as const;
export type SubStreamResolution = (typeof SUB_STREAM_RESOLUTIONS)[number];

/** Which streams the recorder pulls from every camera. */
export const RECORDED_STREAMS = ['main', 'main-and-sub'] as const;
export type RecordedStreams = (typeof RECORDED_STREAMS)[number];

/** Stream remote viewers watch: sub for grid views, main for a single full-screen camera. */
export const VIEWING_STREAMS = ['sub', 'main'] as const;
export type ViewingStream = (typeof VIEWING_STREAMS)[number];

/** Uplink speeds for the network link carrying camera traffic, in Mbps. */
export const UPLINK_SPEEDS_MBPS = [10, 100, 1000, 10_000] as const;
export type UplinkSpeedMbps = (typeof UPLINK_SPEEDS_MBPS)[number];

/** Allowance added to every total for protocol overhead and bitrate bursts. */
export const OVERHEAD_PERCENTS = [0, 5, 10, 20] as const;
export type OverheadPercent = (typeof OVERHEAD_PERCENTS)[number];

export const MAX_REMOTE_VIEWERS = 100;
export const MAX_CAMERAS_PER_VIEWER = 64;
/** Upper bound for link capacities a user types in (recorder limit, site upload), in Mbps. */
export const MAX_LINK_CAPACITY_MBPS = 100_000;
