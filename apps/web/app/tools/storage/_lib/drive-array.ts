import type { RaidLevel, StorageCalculationResult } from '@cctv/calc-core';
import { describeDriveCount } from './result-summary';
import { RAID_LABELS } from './storage-labels';

/** Most drive tiles drawn; the rest are summarised as "+N more". */
export const MAX_DRIVE_TILES = 8;

export interface RaidTradeoff {
  text: string;
  /** A benefit (true) or a cost (false). */
  benefit: boolean;
}

interface RaidDetails {
  /** How the array protects footage, e.g. "single parity"; null without RAID. */
  description: string | null;
  /** Drive failures the array always survives. */
  faultTolerance: number;
  tradeoffs: RaidTradeoff[];
}

const benefit = (text: string): RaidTradeoff => ({ text, benefit: true });
const cost = (text: string): RaidTradeoff => ({ text, benefit: false });

export const RAID_DETAILS: Record<RaidLevel, RaidDetails> = {
  none: {
    description: null,
    faultTolerance: 0,
    tradeoffs: [
      benefit('Uses every drive’s full capacity'),
      cost('No protection: a failed drive loses its recordings'),
    ],
  },
  raid1: {
    description: 'mirroring',
    faultTolerance: 1,
    tradeoffs: [
      benefit('Every recording is stored twice'),
      benefit('Survives one drive failure'),
      cost('Half the raw capacity is usable'),
    ],
  },
  raid5: {
    description: 'single parity',
    faultTolerance: 1,
    tradeoffs: [
      benefit('Survives one drive failure'),
      benefit('A common choice for recorders'),
      cost('Loses one drive’s capacity to parity'),
    ],
  },
  raid6: {
    description: 'dual parity',
    faultTolerance: 2,
    tradeoffs: [
      benefit('Survives two drive failures'),
      benefit('Safer during long rebuilds of large drives'),
      cost('Loses two drives’ capacity to parity'),
    ],
  },
  raid10: {
    description: 'mirrored pairs',
    faultTolerance: 1,
    tradeoffs: [
      benefit('Survives one failure per mirrored pair'),
      benefit('Fastest rebuilds'),
      cost('Half the raw capacity is usable'),
    ],
  },
};

export interface DriveArraySummary {
  title: string;
  description: string;
  /** The array survives at least one drive failure. */
  faultTolerant: boolean;
  driveCount: number;
  driveSizeTb: number;
  /** Drive tiles to draw (at most MAX_DRIVE_TILES). */
  tilesShown: number;
  tradeoffs: RaidTradeoff[];
}

/** "RAID 5 (single parity)", or "No RAID". */
function describeRaidLevel(level: RaidLevel): string {
  const { description } = RAID_DETAILS[level];
  return description ? `${RAID_LABELS[level]} (${description})` : 'No RAID';
}

/**
 * The drives box under the capacity breakdown. Storage needed recommends drives;
 * days from capacity describes the drives entered.
 */
export function describeDriveArray(result: StorageCalculationResult): DriveArraySummary {
  const { raidLevel, driveCount, driveSizeTb } = result.drives;
  const details = RAID_DETAILS[raidLevel];
  const { faultTolerance } = details;

  let title: string;
  let description: string;
  if (result.mode === 'storage-needed') {
    title = `Recommended: ${describeDriveCount(result)}`;
    const sizing = result.isEstimated
      ? 'sized for the high estimate'
      : 'sized for the known bitrates';
    description = `${describeRaidLevel(raidLevel)} · ${sizing}`;
  } else {
    title =
      raidLevel === 'none'
        ? 'Independent drives (no RAID)'
        : `${RAID_LABELS[raidLevel]} configuration`;
    description =
      faultTolerance > 0
        ? `${faultTolerance} drive${faultTolerance === 1 ? '' : 's'} can fail without losing recordings.`
        : 'A failed drive loses the recordings stored on it.';
  }

  return {
    title,
    description,
    faultTolerant: faultTolerance > 0,
    driveCount,
    driveSizeTb,
    tilesShown: Math.min(driveCount, MAX_DRIVE_TILES),
    tradeoffs: details.tradeoffs,
  };
}
