import { isPointRange, type StorageCalculationResult, type ValueRange } from '@cctv/calc-core';
import { Text } from '@mantine/core';
import {
  formatMbps,
  formatNumber,
  formatRangeBounds,
  formatTb,
  formatTbPerDay,
} from '../../../../../lib/format';
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
  // Drive count and RAID level are in the Capacity breakdown, so they have no metric here.
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
      label: 'Usable capacity',
      value: formatTb(drives.usableCapacityTb),
      detail: `${formatNumber(drives.rawCapacityTb)} TB raw`,
    },
  ];
}

/** Key figures in a row, divided by rules (stacked when the card is narrow). */
export function MetricTiles({ result }: { result: StorageCalculationResult }) {
  return (
    <dl className={classes.tiles}>
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
    </dl>
  );
}
