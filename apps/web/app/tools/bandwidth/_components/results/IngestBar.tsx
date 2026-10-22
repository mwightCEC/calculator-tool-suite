'use client';

import { Progress, Tooltip } from '@mantine/core';
import { formatMbps } from '../../../../../lib/format';
import type { TrafficSegment } from '../../_lib/result-summary';
import classes from './ResultsCard.module.css';

/** CSS colour for a segment: its group's palette colour, or slate for overhead. */
const segmentColor = (segment: TrafficSegment) =>
  segment.colorIndex === null
    ? 'var(--app-capacity-reserve)'
    : `var(--group-color-${segment.colorIndex})`;

interface IngestBarProps {
  segments: TrafficSegment[];
}

/** Typical recorder ingest split by camera group, with overhead as the last segment. */
export function IngestBar({ segments }: IngestBarProps) {
  const visible = segments.filter((segment) => segment.mbps > 0);
  const totalMbps = visible.reduce((sum, segment) => sum + segment.mbps, 0);
  if (totalMbps === 0) {
    return null;
  }

  return (
    <div>
      <Progress.Root size={14} className={classes.bar}>
        {visible.map((segment) => (
          <Tooltip
            key={segment.key}
            label={`${segment.label}: ${formatMbps(segment.mbps)}`}
            withArrow
          >
            <Progress.Section
              value={(segment.mbps / totalMbps) * 100}
              color={segmentColor(segment)}
              aria-label={`${segment.label}: ${formatMbps(segment.mbps)}`}
            />
          </Tooltip>
        ))}
      </Progress.Root>

      <ul className={classes.legend}>
        {visible.map((segment) => (
          <li key={segment.key} className={classes.legendItem}>
            <span
              className={classes.swatch}
              style={{ backgroundColor: segmentColor(segment) }}
              aria-hidden="true"
            />
            <span className={classes.legendLabel}>{segment.label}</span>
            <span className={classes.legendValue}>{formatMbps(segment.mbps)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
