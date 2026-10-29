import {
  GB_PER_TB,
  isPointRange,
  scaleRange,
  type StorageCalculationResult,
  type ValueRange,
} from '@cctv/calc-core';
import { IconActivity, IconDatabase, IconStack2, IconVideo, type Icon } from '@tabler/icons-react';
import { Text } from '@mantine/core';
import { formatGb, formatMbps, formatNumber, formatRangeBounds } from '../../../../../lib/format';
import type { StorageCalculatorState } from '../../_state/storage-calculator-state';
import classes from './ResultsCard.module.css';

interface Metric {
  label: string;
  value: string;
  /** Likely range, when the value is an estimate. */
  detail: string | null;
  icon: Icon;
}

/** Range text for a metric, or null when the value is exact. */
function rangeDetail(range: ValueRange, unit: string, digits?: number): string | null {
  return isPointRange(range) ? null : `${formatRangeBounds(range, digits)} ${unit}`;
}

function buildMetrics(result: StorageCalculationResult, state: StorageCalculatorState): Metric[] {
  const approx = result.isEstimated ? '~' : '';
  const cameras = state.cameraGroups.reduce((sum, group) => sum + group.cameraCount, 0);
  const groups = state.cameraGroups.length;
  // Shown in decimal GB, as on the camera group cards.
  const dailyGb = scaleRange(result.dailyWriteTb, GB_PER_TB);
  return [
    {
      label: 'Total bitrate',
      value: `${approx}${formatMbps(result.totalBitrateMbps.typical)}`,
      detail: rangeDetail(result.totalBitrateMbps, 'Mbps'),
      icon: IconActivity,
    },
    {
      label: 'Daily recording',
      value: `${approx}${formatGb(dailyGb.typical)}/day`,
      detail: rangeDetail(dailyGb, 'GB/day'),
      icon: IconDatabase,
    },
    { label: 'Total cameras', value: formatNumber(cameras, 0), detail: null, icon: IconVideo },
    {
      label: groups === 1 ? 'Camera group' : 'Camera groups',
      value: formatNumber(groups, 0),
      detail: null,
      icon: IconStack2,
    },
  ];
}

interface RecordingMetricsProps {
  result: StorageCalculationResult;
  state: StorageCalculatorState;
}

/** What the cameras record: bitrate, footage per day, cameras and groups. */
export function RecordingMetrics({ result, state }: RecordingMetricsProps) {
  return (
    <dl className={classes.statGrid}>
      {buildMetrics(result, state).map(({ label, value, detail, icon: MetricIcon }) => (
        <div key={label} className={classes.statBox}>
          <MetricIcon size={18} stroke={1.75} className={classes.statIcon} aria-hidden="true" />
          <Text component="dt" className={classes.statLabel}>
            {label}
          </Text>
          <Text component="dd" className={classes.statValue}>
            {value}
          </Text>
          {detail && (
            <Text component="dd" className={classes.statDetail}>
              {detail}
            </Text>
          )}
        </div>
      ))}
    </dl>
  );
}
