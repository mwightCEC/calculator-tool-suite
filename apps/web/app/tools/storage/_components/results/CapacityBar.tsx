'use client';

import type { CapacityBreakdown } from '@cctv/calc-core';
import { Group, Progress, Switch, Text, Tooltip } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { formatTb } from '../../../../../lib/format';
import type { CameraGroupState } from '../../_state/storage-calculator-state';
import classes from './ResultsCard.module.css';

const SIMPLIFIED_STORAGE_KEY = 'cctv-tool-suite:capacity-bar-simplified';

interface Segment {
  key: string;
  label: string;
  tb: number;
  /** CSS colour for the bar segment and legend swatch. */
  color: string;
}

/** One segment per camera group, in group colours. */
function groupSegments(breakdown: CapacityBreakdown, groups: CameraGroupState[]): Segment[] {
  return breakdown.footageTbByGroup.map(({ groupId, tb }) => {
    const group = groups.find((candidate) => candidate.id === groupId);
    return {
      key: groupId,
      label: group?.name ?? groupId,
      tb,
      color: `var(--group-color-${group?.colorIndex ?? 0})`,
    };
  });
}

/** All camera groups combined into a single footage segment. */
function combinedFootageSegment(breakdown: CapacityBreakdown): Segment {
  return {
    key: 'footage',
    label: 'Camera footage',
    tb: breakdown.footageTbByGroup.reduce((sum, group) => sum + group.tb, 0),
    color: 'var(--mantine-color-brand-6)',
  };
}

function buildSegments(
  breakdown: CapacityBreakdown,
  groups: CameraGroupState[],
  simplified: boolean
): Segment[] {
  return [
    ...(simplified ? [combinedFootageSegment(breakdown)] : groupSegments(breakdown, groups)),
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
      color: 'var(--app-capacity-parity)',
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
  /** Simple mode has one camera setup, so footage is always one segment. */
  singleSetup: boolean;
}

/**
 * Raw drive capacity split into footage, reserve, parity and unused space.
 * "Simplified" combines all camera groups into one footage segment; the choice
 * is remembered per browser. Simple mode always shows one footage segment.
 */
export function CapacityBar({ breakdown, groups, singleSetup }: CapacityBarProps) {
  const [simplified, setSimplified] = useLocalStorage({
    key: SIMPLIFIED_STORAGE_KEY,
    defaultValue: false,
  });
  const segments = buildSegments(breakdown, groups, simplified || singleSetup);
  const visible = segments.filter((segment) => segment.tb > 0);

  return (
    <div>
      <Group
        justify="space-between"
        align="center"
        wrap="nowrap"
        gap="sm"
        className={classes.labelRow}
      >
        <Text className={classes.sectionLabel}>Raw capacity · {formatTb(breakdown.rawTb)}</Text>
        {!singleSetup && (
          <Switch
            size="xs"
            label="Simplified"
            checked={simplified}
            onChange={(event) => setSimplified(event.currentTarget.checked)}
            classNames={{ label: classes.switchLabel }}
          />
        )}
      </Group>
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
