import type { ReactNode } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Group, Paper, Stack, Text, Title } from '@mantine/core';
import classes from './ResultsPanel.module.css';

interface ResultsPanelProps {
  /** Element id, so the mobile result bar can scroll to the card. */
  id: string;
  title: string;
  /** Shown beside the title, e.g. a status badge. */
  badge?: ReactNode;
  /** Buttons at the end of the title row, e.g. Copy link and Export; they wrap below when narrow. */
  actions?: ReactNode;
  children: ReactNode;
}

/** A calculator's results card: title and badge, then the headline tile, figures and sections. */
export function ResultsPanel({ id, title, badge, actions, children }: ResultsPanelProps) {
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
      <Group justify="space-between" align="center" wrap={actions ? 'wrap' : 'nowrap'} gap="sm">
        <Group gap="sm" wrap="nowrap">
          <Title order={2} id={titleId} className={classes.title}>
            {title}
          </Title>
          {badge}
        </Group>
        {actions && (
          <Group gap="xs" wrap="nowrap">
            {actions}
          </Group>
        )}
      </Group>
      {children}
    </Paper>
  );
}

/**
 * Beside a result that uses the bitrate model while its values are still
 * unvalidated placeholders, so the estimate isn't taken as final sizing.
 */
export function PreliminaryBitrateNote() {
  return (
    <Group gap={6} wrap="nowrap" align="flex-start" className={classes.preliminary}>
      <IconInfoCircle
        size={18}
        stroke={1.75}
        className={classes.preliminaryIcon}
        aria-hidden="true"
      />
      <Text size="sm">
        <b>Preliminary bitrate estimates</b>, not yet checked against measured cameras. For final
        sizing, choose Manual and enter each camera&apos;s measured or configured bitrate.
      </Text>
    </Group>
  );
}

interface HeadlineTileProps {
  value: string;
  label: string;
  /** e.g. "~12–23 Mbps"; omitted when the value is exact. */
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
  /** SummaryRows only: a line under the value, e.g. its likely range. */
  valueDetail?: string | null;
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

/**
 * Key figures as a list, laid out like PoE budget's checks: the label with its detail
 * underneath on the left, the value (and any detail of its own) right-aligned
 * (Storage and Bandwidth).
 */
export function SummaryRows({ rows }: { rows: MetricTile[] }) {
  return (
    <Stack component="ul" gap="xs" className={classes.summaryList}>
      {rows.map(({ label, value, detail, valueDetail }) => (
        <li key={label}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <div>
              <Text className={classes.summaryLabel}>{label}</Text>
              {detail && <Text className={classes.summaryDetail}>{detail}</Text>}
            </div>
            <div className={classes.summaryValueCell}>
              <Text className={classes.summaryValue}>{value}</Text>
              {valueDetail && <Text className={classes.summaryDetail}>{valueDetail}</Text>}
            </div>
          </Group>
        </li>
      ))}
    </Stack>
  );
}
