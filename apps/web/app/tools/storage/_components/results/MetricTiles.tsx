import type { StorageCalculationResult } from '@cctv/calc-core';
import { MetricRow, type MetricTile } from '../../../../../components/ResultsCard/ResultsPanel';
import { formatNumber, formatTb } from '../../../../../lib/format';
import { RAID_LABELS } from '../../_lib/storage-labels';

/** Capacity of the drives: what's left for footage, after RAID, and in total. */
function buildTiles(result: StorageCalculationResult, reservePercent: number): MetricTile[] {
  const { drives, breakdown } = result;
  const raid = drives.raidLevel === 'none' ? 'no RAID' : RAID_LABELS[drives.raidLevel];
  return [
    {
      label: 'Recording capacity',
      value: formatTb(drives.usableCapacityTb - breakdown.reserveTb),
      detail: `after ${reservePercent}% reserve`,
    },
    {
      label: 'Usable capacity',
      value: formatTb(drives.usableCapacityTb),
      detail: `${raid}, ${formatNumber(drives.driveCount, 0)} drives`,
    },
    {
      label: 'Raw capacity',
      value: formatTb(drives.rawCapacityTb),
      detail: `${formatNumber(drives.driveCount, 0)} × ${drives.driveSizeTb} TB`,
    },
  ];
}

interface MetricTilesProps {
  result: StorageCalculationResult;
  reservePercent: number;
}

/** Recording, usable and raw capacity of the drives. */
export function MetricTiles({ result, reservePercent }: MetricTilesProps) {
  return <MetricRow tiles={buildTiles(result, reservePercent)} />;
}
