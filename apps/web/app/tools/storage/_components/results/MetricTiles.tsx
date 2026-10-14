import { isPointRange, type StorageCalculationResult, type ValueRange } from '@cctv/calc-core';
import { SimpleGrid, Text } from '@mantine/core';
import {
  formatMbps,
  formatNumber,
  formatRangeBounds,
  formatTb,
  formatTbPerDay,
} from '../../_lib/format';
import { RAID_LABELS } from '../../_lib/storage-labels';
import classes from './ResultsCard.module.css';

interface Tile {
  label: string;
  value: string;
  detail: string | null;
}

/** Range text for a tile, or null when the value is exact. */
function rangeDetail(range: ValueRange, unit: string, digits?: number): string | null {
  return isPointRange(range) ? null : `${formatRangeBounds(range, digits)} ${unit}`;
}

function buildTiles(result: StorageCalculationResult): Tile[] {
  const approx = result.isEstimated ? '~' : '';
  const { drives } = result;
  return [
    {
      label: 'Total bitrate',
      value: `${approx}${formatMbps(result.totalBitrateMbps.typical)}`,
      detail: rangeDetail(result.totalBitrateMbps, 'Mbps'),
    },
    {
      label: 'Daily write',
      value: `${approx}${formatTbPerDay(result.dailyWriteTb.typical)}`,
      detail: rangeDetail(result.dailyWriteTb, 'TB/day', 2),
    },
    {
      label: 'Drives',
      value: `${drives.driveCount} × ${drives.driveSizeTb} TB`,
      detail: drives.raidLevel === 'none' ? 'No RAID' : RAID_LABELS[drives.raidLevel],
    },
    {
      label: 'Usable capacity',
      value: formatTb(drives.usableCapacityTb),
      detail: `${formatNumber(drives.rawCapacityTb)} TB raw`,
    },
  ];
}

export function MetricTiles({ result }: { result: StorageCalculationResult }) {
  return (
    <SimpleGrid cols={2} spacing="xs" component="dl" className={classes.tiles}>
      {buildTiles(result).map((tile) => (
        <div key={tile.label} className={classes.tile}>
          <Text component="dt" className={classes.tileLabel}>
            {tile.label}
          </Text>
          <Text component="dd" className={classes.tileValue}>
            {tile.value}
          </Text>
          {tile.detail && (
            <Text component="dd" className={classes.tileDetail}>
              {tile.detail}
            </Text>
          )}
        </div>
      ))}
    </SimpleGrid>
  );
}
