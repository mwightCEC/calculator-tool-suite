import { isPointRange, type BandwidthResult, type ValueRange } from '@cctv/calc-core';
import { SimpleGrid, Text } from '@mantine/core';
import { formatMbps, formatNumber, formatRangeBounds } from '../../../../../lib/format';
import type { BandwidthCalculatorState } from '../../_state/bandwidth-calculator-state';
import classes from './ResultsCard.module.css';

interface Tile {
  label: string;
  value: string;
  detail: string | null;
}

/** Range text for a tile, or null when the value is exact. */
function rangeDetail(range: ValueRange): string | null {
  return isPointRange(range) ? null : `${formatRangeBounds(range)} Mbps`;
}

/** "~" when the range is an estimate rather than an exact figure. */
const approx = (range: ValueRange) => (isPointRange(range) ? '' : '~');

function buildTiles(state: BandwidthCalculatorState, result: BandwidthResult): Tile[] {
  const { streamsMbps, averagePerCameraMbps, bandwidthMbps } = result;
  const overheadMbps = bandwidthMbps.typical - streamsMbps.typical;
  return [
    {
      label: 'Camera streams',
      value: `${approx(streamsMbps)}${formatMbps(streamsMbps.typical)}`,
      detail: rangeDetail(streamsMbps),
    },
    {
      label: 'Overhead',
      value: `${approx(bandwidthMbps)}${formatMbps(overheadMbps)}`,
      detail: `${state.overheadPercent}% allowance`,
    },
    {
      label: 'Per camera',
      value: `${approx(averagePerCameraMbps)}${formatMbps(averagePerCameraMbps.typical)}`,
      detail: 'Average, before overhead',
    },
    {
      label: 'Cameras',
      value: formatNumber(result.totalCameras, 0),
      detail: `${formatNumber(state.cameraGroups.length, 0)} ${state.cameraGroups.length === 1 ? 'group' : 'groups'}`,
    },
  ];
}

interface MetricTilesProps {
  state: BandwidthCalculatorState;
  result: BandwidthResult;
}

/** Stream total and overhead, average per camera and camera count. */
export function MetricTiles({ state, result }: MetricTilesProps) {
  return (
    <SimpleGrid cols={2} spacing="xs" component="dl" className={classes.tiles}>
      {buildTiles(state, result).map((tile) => (
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
