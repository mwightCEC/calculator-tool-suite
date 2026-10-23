import type { CSSProperties, ReactNode } from 'react';
import { Group, Paper, Text, Title } from '@mantine/core';
import classes from './CameraGroupCard.module.css';

interface CamerasCardProps {
  /** Index into the group colour palette, so the footer matches the results. */
  colorIndex: number;
  /** Value in the "Total" footer. */
  totalValue: ReactNode;
  /** The camera fields. */
  children: ReactNode;
}

/** Simple mode's single camera setup: the group card's fields and total, without group controls. */
export function CamerasCard({ colorIndex, totalValue, children }: CamerasCardProps) {
  const colorVariables = { '--group-tint': `var(--group-tint-${colorIndex})` } as CSSProperties;

  return (
    <Paper
      component="section"
      withBorder
      className={classes.card}
      style={colorVariables}
      aria-labelledby="cameras-title"
    >
      <Title order={2} id="cameras-title" className={classes.camerasTitle}>
        Cameras
      </Title>
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
