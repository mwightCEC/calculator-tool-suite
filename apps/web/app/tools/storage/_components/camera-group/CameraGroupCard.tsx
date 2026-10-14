'use client';

import { useState, type CSSProperties } from 'react';
import type { CameraGroupUsage } from '@cctv/calc-core';
import { Collapse, Group, Paper, Text } from '@mantine/core';
import { formatGb, formatMbps } from '../../_lib/format';
import { summarizeGroup } from '../../_lib/group-summary';
import type { CameraGroupState } from '../../_state/storage-calculator-state';
import type { StorageCalculatorActions } from '../../_state/use-storage-calculator';
import { CameraGroupFields } from './CameraGroupFields';
import { CameraGroupHeader } from './CameraGroupHeader';
import classes from './CameraGroupCard.module.css';

interface CameraGroupCardProps {
  group: CameraGroupState;
  usage: CameraGroupUsage;
  canDuplicate: boolean;
  canDelete: boolean;
  actions: StorageCalculatorActions;
}

export function CameraGroupCard({
  group,
  usage,
  canDuplicate,
  canDelete,
  actions,
}: CameraGroupCardProps) {
  const [expanded, setExpanded] = useState(true);
  const bodyId = `${group.id}-body`;
  // "~" marks values that come from the bitrate estimate.
  const approx = group.bitrate.source === 'estimate' ? '~' : '';
  const gbPerDay = `${approx}${formatGb(usage.gbPerDay.typical)}/day`;

  // Group colour as CSS variables so the stylesheet can tint the dot, badge and footer.
  const colorVariables = {
    '--group-color': `var(--group-color-${group.colorIndex})`,
    '--group-tint': `var(--group-tint-${group.colorIndex})`,
  } as CSSProperties;

  return (
    <Paper
      component="section"
      withBorder
      className={classes.card}
      style={colorVariables}
      aria-label={group.name}
    >
      <CameraGroupHeader
        name={group.name}
        cameraCount={group.cameraCount}
        expanded={expanded}
        bodyId={bodyId}
        canDuplicate={canDuplicate}
        canDelete={canDelete}
        onToggleExpanded={() => setExpanded((value) => !value)}
        onRename={(name) => actions.updateGroup(group.id, { name })}
        onDuplicate={() => actions.duplicateGroup(group.id)}
        onDelete={() => actions.removeGroup(group.id)}
      />

      {!expanded && (
        <Group justify="space-between" wrap="nowrap" gap="md" className={classes.summary}>
          <Text size="sm" className={classes.summaryText}>
            {summarizeGroup(group, usage)}
          </Text>
          <Text size="sm" fw={600} className={classes.nowrap}>
            {gbPerDay}
          </Text>
        </Group>
      )}

      <Collapse expanded={expanded} id={bodyId}>
        <CameraGroupFields group={group} usage={usage} actions={actions} />
      </Collapse>

      <Group justify="space-between" gap="md" className={classes.footer}>
        <Text size="sm">Group total</Text>
        <Text size="sm" fw={600}>
          {approx}
          {formatMbps(usage.totalBitrateMbps.typical)} · {gbPerDay}
        </Text>
      </Group>
    </Paper>
  );
}
