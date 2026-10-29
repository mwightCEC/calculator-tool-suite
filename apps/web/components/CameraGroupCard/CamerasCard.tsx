import type { CSSProperties, ReactNode } from 'react';
import { Group, Paper, Text, Title } from '@mantine/core';
import classes from './CameraGroupCard.module.css';

interface CamerasCardProps {
  /** Card heading; Cameras unless the calculator counts other devices. */
  title?: string;
  /** Index into the group colour palette, so the footer matches the results. */
  colorIndex: number;
  /** Value in the "Total" footer. */
  totalValue: ReactNode;
  /** The camera fields. */
  children: ReactNode;
  /** "nested" sits inside a section card that has its own heading, so the title is hidden. */
  variant?: 'default' | 'nested';
}

/** Simple mode's single camera setup: the group card's fields and total, without group controls. */
export function CamerasCard({
  title = 'Cameras',
  colorIndex,
  totalValue,
  children,
  variant = 'default',
}: CamerasCardProps) {
  const nested = variant === 'nested';
  const colorVariables = { '--group-tint': `var(--group-tint-${colorIndex})` } as CSSProperties;

  return (
    <Paper
      component="section"
      withBorder
      radius={nested ? 'lg' : undefined}
      className={classes.card}
      data-variant={variant}
      style={colorVariables}
      aria-labelledby={nested ? undefined : 'cameras-title'}
      aria-label={nested ? title : undefined}
    >
      {!nested && (
        <Title order={2} id="cameras-title" className={classes.camerasTitle}>
          {title}
        </Title>
      )}
      <div className={classes.fields}>{children}</div>
      <Group justify="space-between" gap="md" className={classes.footer}>
        <Text size="sm">Total</Text>
        <Text size="sm" fw={600}>
          {totalValue}
        </Text>
      </Group>
    </Paper>
  );
}
