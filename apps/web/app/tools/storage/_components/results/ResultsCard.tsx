'use client';

import type { StorageCalculationResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconCircleCheck, IconDownload, IconLink } from '@tabler/icons-react';
import { Badge, Box, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { describeDrives, describeHeadline, describeStatus } from '../../_lib/result-summary';
import type { CameraGroupState } from '../../_state/storage-calculator-state';
import { CapacityBar } from './CapacityBar';
import { MetricTiles } from './MetricTiles';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'storage-results';

interface ResultsCardProps {
  result: StorageCalculationResult;
  groups: CameraGroupState[];
  retentionTargetDays: number;
}

export function ResultsCard({ result, groups, retentionTargetDays }: ResultsCardProps) {
  const headline = describeHeadline(result);
  const status = describeStatus(result, retentionTargetDays);
  const sizedForHigh = result.mode === 'storage-needed' && result.isEstimated;
  const StatusIcon = status.tone === 'ok' ? IconCircleCheck : IconAlertTriangle;

  return (
    <Box
      component="section"
      id={RESULTS_CARD_ID}
      tabIndex={-1}
      aria-label="Results"
      className={classes.card}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text className={classes.sectionLabel}>{headline.label}</Text>
        <Badge
          variant="light"
          color={result.isEstimated ? 'amber' : 'green'}
          radius="sm"
          className={classes.sourceBadge}
        >
          {result.isEstimated ? 'Estimated' : 'From known bitrates'}
        </Badge>
      </Group>

      {/* Polite live region so screen readers hear the headline update as inputs change. */}
      <div aria-live="polite" aria-atomic="true">
        <Text className={classes.headlineValue}>{headline.value}</Text>
        {headline.likelyRange && (
          <Text className={classes.headlineRange}>{headline.likelyRange}</Text>
        )}
      </div>

      <Text className={classes.drives}>
        {describeDrives(result)}
        {sizedForHigh && <span className={classes.sizedNote}> · Sized for the high estimate</span>}
      </Text>

      <CapacityBar breakdown={result.breakdown} groups={groups} />
      <MetricTiles result={result} />

      <Group gap={6} wrap="nowrap" className={classes.status} data-tone={status.tone}>
        <StatusIcon size={18} stroke={1.75} aria-hidden="true" />
        <Text size="sm">{status.text}</Text>
      </Group>

      <Text className={classes.unitsNote}>
        Capacities are decimal TB (10¹² bytes), as printed on drives. Recorders and operating
        systems may show less because they use binary units.
      </Text>

      <Group gap="xs" grow>
        <Button
          variant="outline"
          color="navy.2"
          leftSection={<IconLink size={16} />}
          onClick={() => notifications.show({ message: 'Shareable links are not available yet.' })}
        >
          Copy link
        </Button>
        <Button
          leftSection={<IconDownload size={16} />}
          onClick={() => notifications.show({ message: 'Export is not available yet.' })}
        >
          Export
        </Button>
      </Group>
    </Box>
  );
}
