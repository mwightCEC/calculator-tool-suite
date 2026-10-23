'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Collapse, Group, Paper, Text } from '@mantine/core';
import { CameraGroupHeader } from './CameraGroupHeader';
import classes from './CameraGroupCard.module.css';

interface CameraGroupCardProps {
  groupId: string;
  name: string;
  cameraCount: number;
  /** Index into the group colour palette (--group-color-N). */
  colorIndex: number;
  /** Controlled by the page (useGroupExpansion) so Collapse all can reach every card. */
  expanded: boolean;
  onToggleExpanded: () => void;
  canDuplicate: boolean;
  canDelete: boolean;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** One-line description of the group, shown while collapsed. */
  collapsedSummary: string;
  /** Headline value shown beside the summary while collapsed. */
  collapsedValue: string;
  /** Value in the "Group total" footer. */
  totalValue: ReactNode;
  /** The group's fields, shown while expanded. */
  children: ReactNode;
}

/** A collapsible, colour-coded camera group card. Each calculator supplies its fields and totals. */
export function CameraGroupCard({
  groupId,
  name,
  cameraCount,
  colorIndex,
  expanded,
  onToggleExpanded,
  canDuplicate,
  canDelete,
  onRename,
  onDuplicate,
  onDelete,
  collapsedSummary,
  collapsedValue,
  totalValue,
  children,
}: CameraGroupCardProps) {
  const bodyId = `${groupId}-body`;

  // Group colour as CSS variables so the stylesheet can tint the dot, badge and footer.
  const colorVariables = {
    '--group-color': `var(--group-color-${colorIndex})`,
    '--group-tint': `var(--group-tint-${colorIndex})`,
  } as CSSProperties;

  return (
    <Paper
      component="section"
      withBorder
      className={classes.card}
      style={colorVariables}
      aria-label={name}
    >
      <CameraGroupHeader
        name={name}
        cameraCount={cameraCount}
        expanded={expanded}
        bodyId={bodyId}
        canDuplicate={canDuplicate}
        canDelete={canDelete}
        onToggleExpanded={onToggleExpanded}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />

      {!expanded && (
        <Group justify="space-between" wrap="nowrap" gap="md" className={classes.summary}>
          <Text size="sm" className={classes.summaryText}>
            {collapsedSummary}
          </Text>
          <Text size="sm" fw={600} className={classes.nowrap}>
            {collapsedValue}
          </Text>
        </Group>
      )}

      <Collapse expanded={expanded} id={bodyId}>
        <div className={classes.fields}>{children}</div>
      </Collapse>

      <Group justify="space-between" gap="md" className={classes.footer}>
        <Text size="sm">Group total</Text>
        <Text size="sm" fw={600}>
          {totalValue}
        </Text>
      </Group>
    </Paper>
  );
}
