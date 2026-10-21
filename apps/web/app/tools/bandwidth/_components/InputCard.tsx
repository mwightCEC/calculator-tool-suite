import type { ReactNode } from 'react';
import { Paper, Title } from '@mantine/core';
import classes from './BandwidthCalculator.module.css';

interface InputCardProps {
  /** Id for the heading, which labels the card. */
  id: string;
  title: string;
  children: ReactNode;
}

/** A titled card of FieldRows for system-wide settings. */
export function InputCard({ id, title, children }: InputCardProps) {
  return (
    <Paper component="section" withBorder className={classes.card} aria-labelledby={id}>
      <Title order={2} id={id} className={classes.cardTitle}>
        {title}
      </Title>
      {children}
    </Paper>
  );
}
