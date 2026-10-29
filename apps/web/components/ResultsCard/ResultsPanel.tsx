import type { ReactNode } from 'react';
import { Badge, Group, Paper, Title } from '@mantine/core';
import classes from './ResultsPanel.module.css';

interface ResultsPanelProps {
  /** Element id, so the mobile result bar can scroll to the card. */
  id: string;
  title: string;
  /** Shown beside the title, e.g. EstimateBadge or a status badge. */
  badge?: ReactNode;
  children: ReactNode;
}

/** A calculator's results card: title and badge, then the headline tile, figures and sections. */
export function ResultsPanel({ id, title, badge, children }: ResultsPanelProps) {
  const titleId = `${id}-title`;
  return (
    <Paper
      component="section"
      id={id}
      tabIndex={-1}
      aria-labelledby={titleId}
      withBorder
      radius="lg"
      className={classes.card}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        <Title order={2} id={titleId} className={classes.title}>
          {title}
        </Title>
        {badge}
      </Group>
      {children}
    </Paper>
  );
}

/** "Estimated" (amber) when any bitrate is estimated, otherwise "From known bitrates" (green). */
export function EstimateBadge({ isEstimated }: { isEstimated: boolean }) {
  return (
    <Badge
      variant={isEstimated ? 'filled' : 'light'}
      color={isEstimated ? 'amber' : 'green'}
      radius="sm"
      className={classes.badge}
      data-source={isEstimated ? 'estimated' : 'known'}
    >
      {isEstimated ? 'Estimated' : 'From known bitrates'}
    </Badge>
  );
}

interface HeadlineTileProps {
  value: string;
  label: string;
  /** e.g. "likely 12–23 Mbps"; omitted when the value is exact. */
  range?: string | null;
  /** Small text under the range, e.g. what the figure includes. */
  footnote?: ReactNode;
}

/** The headline figure in a tinted tile, announced politely as inputs change. */
export function HeadlineTile({ value, label, range, footnote }: HeadlineTileProps) {
  return (
    <div aria-live="polite" aria-atomic="true" className={classes.hero}>
      <p className={classes.headlineValue}>{value}</p>
      <p className={classes.headlineLabel}>{label}</p>
      {range && <p className={classes.headlineRange}>{range}</p>}
      {footnote && <p className={classes.footnote}>{footnote}</p>}
    </div>
  );
}

export interface MetricTile {
  label: string;
  value: string;
  detail?: string | null;
}

/** Key figures in a row divided by rules, stacked when the card is narrow. */
export function MetricRow({ tiles }: { tiles: MetricTile[] }) {
  return (
    <dl className={classes.tiles}>
      {tiles.map((tile) => (
        <div key={tile.label} className={classes.tile}>
          <dt className={classes.tileLabel}>{tile.label}</dt>
          <dd className={classes.tileValue}>{tile.value}</dd>
          {tile.detail && <dd className={classes.tileDetail}>{tile.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
