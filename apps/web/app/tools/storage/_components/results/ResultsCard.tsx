'use client';

import type { CalculationMode, StorageCalculationResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconDownload } from '@tabler/icons-react';
import { Badge, Box, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { OptionButtons } from '../../../../../components/OptionButtons/OptionButtons';
import { describeHeadline, describeWarning } from '../../_lib/result-summary';
import { CALCULATION_MODE_OPTIONS } from '../../_lib/storage-labels';
import type { StorageCalculatorState } from '../../_state/storage-calculator-state';
import { CapacityBar } from './CapacityBar';
import { CopyLinkButton } from './CopyLinkButton';
import { DrivesSummary } from './DrivesSummary';
import { MetricTiles } from './MetricTiles';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'storage-results';

interface ResultsCardProps {
  result: StorageCalculationResult;
  /** The inputs behind the result: group names and colours, share link. */
  state: StorageCalculatorState;
  onModeChange: (mode: CalculationMode) => void;
}

export function ResultsCard({ result, state, onModeChange }: ResultsCardProps) {
  const headline = describeHeadline(result);
  const warning = describeWarning(result);

  return (
    <Box
      component="section"
      id={RESULTS_CARD_ID}
      tabIndex={-1}
      aria-label="Results"
      className={classes.card}
    >
      <OptionButtons
        value={state.mode}
        onChange={onModeChange}
        options={CALCULATION_MODE_OPTIONS}
        aria-label="Calculation mode"
      />

      <div>
        <Group justify="space-between" align="center" wrap="nowrap" className={classes.labelRow}>
          <Text className={classes.sectionLabel}>{headline.label}</Text>
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
        <div aria-live="polite" aria-atomic="true">
          <Text className={classes.headlineValue}>{headline.value}</Text>
          {headline.likelyRange && (
            <Text className={classes.headlineRange}>{headline.likelyRange}</Text>
          )}
        </div>
      </div>

      <DrivesSummary result={result} />
      <CapacityBar breakdown={result.breakdown} groups={state.cameraGroups} />
      <MetricTiles result={result} />

      {warning && (
        <Group gap={6} wrap="nowrap" className={classes.warning} role="status">
          <IconAlertTriangle size={18} stroke={1.75} aria-hidden="true" />
          <Text size="sm">{warning}</Text>
        </Group>
      )}

      <Text className={classes.unitsNote}>
        Capacities are decimal TB (10¹² bytes), as printed on drives. Recorders and operating
        systems may show less because they use binary units.
      </Text>

      <Group gap="xs" grow>
        <CopyLinkButton state={state} />
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
