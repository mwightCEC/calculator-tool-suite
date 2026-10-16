'use client';

import type { CapacityBreakdown } from '@cctv/calc-core';
import { Progress, Text, Tooltip } from '@mantine/core';
import { formatTb } from '../../_lib/format';
import type { CameraGroupState } from '../../_state/storage-calculator-state';
import classes from './ResultsCard.module.css';

interface Segment {
  key: string;
  label: string;
  tb: number;
  /** CSS colour for the bar segment and legend swatch. */
  color: string;
}

function buildSegments(breakdown: CapacityBreakdown, groups: CameraGroupState[]): Segment[] {
  const groupSegments = breakdown.footageTbByGroup.map(({ groupId, tb }) => {
    const group = groups.find((candidate) => candidate.id === groupId);
    return {
      key: groupId,
      label: group?.name ?? groupId,
      tb,
      color: `var(--group-color-${group?.colorIndex ?? 0})`,
    };
  });
  return [
    ...groupSegments,
    {
      key: 'reserve',
      label: 'Reserve',
      tb: breakdown.reserveTb,
      color: 'var(--app-capacity-reserve)',
    },
    {
      key: 'parity',
      label: 'RAID parity',
      tb: breakdown.parityTb,
      color: 'var(--mantine-color-amber-6)',
    },
    {
      key: 'unused',
      label: 'Unused',
      tb: breakdown.unusedTb,
      color: 'var(--app-capacity-unused)',
    },
  ];
}

interface CapacityBarProps {
  breakdown: CapacityBreakdown;
  groups: CameraGroupState[];
}

/** Raw drive capacity split into footage per group, reserve, parity and unused space. */
export function CapacityBar({ breakdown, groups }: CapacityBarProps) {
  const segments = buildSegments(breakdown, groups);
  const visible = segments.filter((segment) => segment.tb > 0);

  return (
    <div>
      <Text className={classes.sectionLabel}>Raw capacity · {formatTb(breakdown.rawTb)}</Text>
      <Progress.Root size={18} className={classes.bar}>
        {visible.map((segment) => (
          <Tooltip key={segment.key} label={`${segment.label}: ${formatTb(segment.tb)}`} withArrow>
            <Progress.Section
              value={(segment.tb / breakdown.rawTb) * 100}
              color={segment.color}
              aria-label={`${segment.label}: ${formatTb(segment.tb)}`}
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
            <span className={classes.legendValue}>{formatTb(segment.tb)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
