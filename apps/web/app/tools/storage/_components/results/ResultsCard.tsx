'use client';

import type { StorageCalculationResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconPrinter } from '@tabler/icons-react';
import { Badge, Button, Group, Paper, Text, Title } from '@mantine/core';
import { CopyLinkButton } from '../../../../../components/CopyLinkButton/CopyLinkButton';
import { describeHeadline, describeWarning } from '../../_lib/result-summary';
import { buildShareUrl } from '../../_state/share-link';
import type { StorageCalculatorState } from '../../_state/storage-calculator-state';
import { Disclosure } from '../Disclosure';
import { HowCalculated } from '../HowCalculated';
import { CapacityBar } from './CapacityBar';
import { DrivesSummary } from './DrivesSummary';
import { MetricTiles } from './MetricTiles';
import { RecordingMetrics } from './RecordingMetrics';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'storage-results';

interface ResultsCardProps {
  result: StorageCalculationResult;
  /** The inputs behind the result: group names and colours, share link. */
  state: StorageCalculatorState;
}

const RESULTS_TITLES = {
  'storage-needed': 'Storage estimate',
  'days-from-capacity': 'Retention estimate',
} as const;

export function ResultsCard({ result, state }: ResultsCardProps) {
  const headline = describeHeadline(result);
  const warning = describeWarning(result);

  return (
    <Paper
      component="section"
      id={RESULTS_CARD_ID}
      tabIndex={-1}
      aria-labelledby="results-title"
      withBorder
      radius="lg"
      className={classes.card}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        <Title order={2} id="results-title" className={classes.title}>
          {RESULTS_TITLES[result.mode]}
        </Title>
        <Badge
          variant={result.isEstimated ? 'filled' : 'light'}
          color={result.isEstimated ? 'amber' : 'green'}
          radius="sm"
          className={classes.sourceBadge}
          data-source={result.isEstimated ? 'estimated' : 'known'}
        >
          {result.isEstimated ? 'Estimated' : 'From known bitrates'}
        </Badge>
      </Group>

      {/* Polite live region so screen readers hear the headline update as inputs change. */}
      <div aria-live="polite" aria-atomic="true" className={classes.hero}>
        <Text className={classes.headlineValue}>{headline.value}</Text>
        <Text className={classes.headlineLabel}>{headline.label}</Text>
        {headline.likelyRange && (
          <Text className={classes.headlineRange}>{headline.likelyRange}</Text>
        )}
      </div>

      {warning && (
        <Group gap={6} wrap="nowrap" className={classes.warning} role="status">
          <IconAlertTriangle size={18} stroke={1.75} aria-hidden="true" />
          <Text size="sm">{warning}</Text>
        </Group>
      )}

      <MetricTiles result={result} reservePercent={state.storage.reservePercent} />

      <Disclosure title="Capacity breakdown">
        <CapacityBar
          breakdown={result.breakdown}
          groups={state.cameraGroups}
          singleGroup={state.cameraGroups.length === 1}
        />
      </Disclosure>

      <DrivesSummary result={result} />

      <Disclosure title="Recording metrics">
        <RecordingMetrics result={result} state={state} />
      </Disclosure>

      <Disclosure title="How estimates are calculated">
        <HowCalculated />
      </Disclosure>

      <Text className={classes.unitsNote}>
        Capacities are decimal TB (10¹² bytes), as printed on drives. Recorders and operating
        systems may show less because they use binary units.
      </Text>

      <Group gap="xs" grow>
        <CopyLinkButton getShareUrl={() => buildShareUrl(state, window.location.href)} />
        {/* Opens the print dialog with the printable summary (PrintSummary); "Save as PDF" gives a file. */}
        <Button leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
          Export
        </Button>
      </Group>
    </Paper>
  );
}
