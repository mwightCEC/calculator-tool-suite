/**
 * Storage uses decimal (SI) units to match drive labels:
 * 1 GB = 10^9 bytes, 1 TB = 10^12 bytes.
 * Recorders and operating systems often display binary units (TiB), which
 * makes the same drive appear ~9% smaller.
 */
export const BYTES_PER_TB = 1e12;
export const GB_PER_TB = 1000;
export const MB_PER_GB = 1000;
export const BITS_PER_BYTE = 8;
export const SECONDS_PER_DAY = 86_400;
export const HOURS_PER_DAY = 24;
