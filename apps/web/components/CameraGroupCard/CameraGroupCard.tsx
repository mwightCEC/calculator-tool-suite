'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Collapse, Group, Paper, Text } from '@mantine/core';
import { CameraGroupHeader, type CountNoun } from './CameraGroupHeader';
import classes from './CameraGroupCard.module.css';

interface CameraGroupCardProps {
  groupId: string;
  name: string;
  cameraCount: number;
  /** Words for the count badge; cameras unless the calculator counts other devices. */
  countNoun?: CountNoun;
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
  /**
   * "nested" sits inside a section card: gray header with the summary always shown under the
   * name, and a bordered body. Storage uses it; the other calculators use the default.
   */
  variant?: 'default' | 'nested';
}

/** A collapsible, colour-coded camera group card. Each calculator supplies its fields and totals. */
export function CameraGroupCard({
  groupId,
  name,
  cameraCount,
  countNoun,
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
  variant = 'default',
}: CameraGroupCardProps) {
  const nested = variant === 'nested';
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
      radius={nested ? 'lg' : undefined}
      className={classes.card}
      data-variant={variant}
      style={colorVariables}
      aria-label={name}
    >
      <CameraGroupHeader
        name={name}
        cameraCount={cameraCount}
        countNoun={countNoun}
        subtitle={nested ? collapsedSummary : undefined}
        expanded={expanded}
        bodyId={bodyId}
        canDuplicate={canDuplicate}
        canDelete={canDelete}
        onToggleExpanded={onToggleExpanded}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />

      {!expanded && !nested && (
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
