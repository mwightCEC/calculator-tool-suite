import type { ReactNode } from 'react';
import { Group, Paper, Title } from '@mantine/core';
import classes from './BandwidthCalculator.module.css';

interface InputCardProps {
  /** Id for the heading, which labels the card. */
  id: string;
  title: string;
  /** Optional control beside the title, such as an on/off switch. */
  titleAction?: ReactNode;
  children: ReactNode;
}

/** A titled card of FieldRows for system-wide settings. */
export function InputCard({ id, title, titleAction, children }: InputCardProps) {
  return (
    <Paper component="section" withBorder className={classes.card} aria-labelledby={id}>
      <Group justify="space-between" wrap="nowrap" gap="sm" className={classes.cardHeader}>
        <Title order={2} id={id} className={classes.cardTitle}>
          {title}
        </Title>
        {titleAction}
      </Group>
      {children}
    </Paper>
  );
}
