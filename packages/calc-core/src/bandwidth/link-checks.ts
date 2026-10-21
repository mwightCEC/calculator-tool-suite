import type { ValueRange } from '../range';

/** Utilisation bands from the spec: up to 70% OK, over 70% to 90% caution, over 90% over capacity. */
export const LINK_CAUTION_ABOVE = 0.7;
export const LINK_OVER_CAPACITY_ABOVE = 0.9;

export const LINK_STATUSES = ['ok', 'caution', 'over-capacity'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

/**
 * The links a user can check, and the traffic each carries:
 * - recorder-limit: the recorder's incoming bandwidth limit (carries ingest)
 * - uplink: the recorder or camera-switch uplink (carries ingest)
 * - site-upload: the site's internet upload speed (carries remote viewing)
 */
export const LINK_KINDS = ['recorder-limit', 'uplink', 'site-upload'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export interface LinkCheck {
  link: LinkKind;
  capacityMbps: number;
  /** Traffic on the link, in Mbps. */
  loadMbps: ValueRange;
  /** High estimate ÷ capacity (conservative); 1 = exactly full. */
  utilisation: number;
  status: LinkStatus;
}

export function linkStatus(utilisation: number): LinkStatus {
  if (utilisation > LINK_OVER_CAPACITY_ABOVE) {
    return 'over-capacity';
  }
  return utilisation > LINK_CAUTION_ABOVE ? 'caution' : 'ok';
}

/** Checks a link against its load, using the high estimate. */
export function checkLink(link: LinkKind, capacityMbps: number, loadMbps: ValueRange): LinkCheck {
  const utilisation = loadMbps.high / capacityMbps;
  return { link, capacityMbps, loadMbps, utilisation, status: linkStatus(utilisation) };
}
