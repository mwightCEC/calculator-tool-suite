'use client';

import { Progress, Tooltip } from '@mantine/core';
import { formatWatts } from '../../../../../lib/format';
import type { BudgetSegment } from '../../_lib/result-summary';
import classes from './ResultsCard.module.css';

interface BudgetBarProps {
  segments: BudgetSegment[];
}

/** The PoE budget split by device group, with the free watts and the reserve at the end. */
export function BudgetBar({ segments }: BudgetBarProps) {
  const visible = segments.filter((segment) => segment.watts > 0);
  const totalWatts = visible.reduce((sum, segment) => sum + segment.watts, 0);

  return (
    <div>
      <Progress.Root size={18} className={classes.bar}>
        {visible.map((segment) => (
          <Tooltip
            key={segment.key}
            label={`${segment.label}: ${formatWatts(segment.watts)}`}
            withArrow
          >
            <Progress.Section
              value={(segment.watts / totalWatts) * 100}
              color={segment.color}
              aria-label={`${segment.label}: ${formatWatts(segment.watts)}`}
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
            <span className={classes.legendValue}>{formatWatts(segment.watts)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
