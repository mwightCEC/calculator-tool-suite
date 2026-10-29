import type { StorageCalculationResult } from '@cctv/calc-core';
import { Text } from '@mantine/core';
import { formatNumber, formatTb } from '../../../../../lib/format';
import { RAID_LABELS } from '../../_lib/storage-labels';
import classes from './ResultsCard.module.css';

interface Tile {
  label: string;
  value: string;
  detail: string;
}

/** Capacity of the drives: what's left for footage, after RAID, and in total. */
function buildTiles(result: StorageCalculationResult, reservePercent: number): Tile[] {
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

/** Key figures in a row, divided by rules (stacked when the card is narrow). */
export function MetricTiles({ result, reservePercent }: MetricTilesProps) {
  return (
    <dl className={classes.tiles}>
      {buildTiles(result, reservePercent).map((tile) => (
        <div key={tile.label} className={classes.tile}>
          <Text component="dt" className={classes.tileLabel}>
            {tile.label}
          </Text>
          <Text component="dd" className={classes.tileValue}>
            {tile.value}
          </Text>
          <Text component="dd" className={classes.tileDetail}>
            {tile.detail}
          </Text>
        </div>
      ))}
    </dl>
  );
}
