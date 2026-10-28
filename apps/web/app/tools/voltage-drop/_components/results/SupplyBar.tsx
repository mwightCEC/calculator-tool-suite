'use client';

import { Progress, Tooltip } from '@mantine/core';
import { formatAmps } from '../../../../../lib/format';
import type { SupplySegment } from '../../_lib/result-summary';
import classes from './ResultsCard.module.css';

interface SupplyBarProps {
  segments: SupplySegment[];
}

/** The supply's rated current split by device group, with the free amps and the reserve at the end. */
export function SupplyBar({ segments }: SupplyBarProps) {
  const visible = segments.filter((segment) => segment.amps > 0);
  const totalAmps = visible.reduce((sum, segment) => sum + segment.amps, 0);

  return (
    <div>
      <Progress.Root size={18} className={classes.bar}>
        {visible.map((segment) => (
          <Tooltip
            key={segment.key}
            label={`${segment.label}: ${formatAmps(segment.amps)}`}
            withArrow
          >
            <Progress.Section
              value={(segment.amps / totalAmps) * 100}
              color={segment.color}
              aria-label={`${segment.label}: ${formatAmps(segment.amps)}`}
            />
          </Tooltip>
        ))}
      </Progress.Root>

      <ul className={classes.legend}>
        {visible.map((segment) => (
          <li key={segment.key} className={classes.legendItem}>
            <span
              className={classes.swatch}
              style={{ backgroundColor: segment.color }}
              aria-hidden="true"
            />
            <span className={classes.legendLabel}>{segment.label}</span>
            <span className={classes.legendValue}>{formatAmps(segment.amps)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
