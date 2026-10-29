'use client';

import { Progress, Tooltip } from '@mantine/core';
import classes from './SegmentBar.module.css';

export interface BarSegment {
  key: string;
  label: string;
  value: number;
  /** CSS colour for the bar segment and legend swatch. */
  color: string;
}

interface SegmentBarProps {
  segments: BarSegment[];
  /** Formats a segment's value for the tooltip and legend, e.g. "24.7 W". */
  formatValue: (value: number) => string;
  /**
   * The results-card style from the approved prototype: a taller bar and a one-column
   * legend with each value in bold and its share of the total.
   */
  detailed?: boolean;
}

/** Share of the total as a whole percent; "<1%" keeps a small segment from reading as none. */
function formatShare(fraction: number): string {
  const percent = Math.round(fraction * 100);
  return percent === 0 && fraction > 0 ? '<1%' : `${percent}%`;
}

/** A capacity split into coloured segments, with a legend. Empty segments are left out. */
export function SegmentBar({ segments, formatValue, detailed = false }: SegmentBarProps) {
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div data-detailed={detailed || undefined} className={classes.root}>
      <Progress.Root
        size={detailed ? 24 : 18}
        radius={detailed ? 'md' : undefined}
        className={classes.bar}
      >
        {visible.map((segment) => (
          <Tooltip
            key={segment.key}
            label={`${segment.label}: ${formatValue(segment.value)}`}
            withArrow
          >
            <Progress.Section
              value={(segment.value / total) * 100}
              color={segment.color}
              aria-label={`${segment.label}: ${formatValue(segment.value)}`}
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
            <span className={classes.legendValue}>{formatValue(segment.value)}</span>
            {detailed && (
              <span className={classes.legendShare}>{formatShare(segment.value / total)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
