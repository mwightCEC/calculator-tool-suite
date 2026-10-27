'use client';

import { isBitrateModelValidated, type BandwidthResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconPrinter } from '@tabler/icons-react';
import { Badge, Box, Button, Group, Text } from '@mantine/core';
import { CopyLinkButton } from '../../../../../components/CopyLinkButton/CopyLinkButton';
import {
  bandwidthSegments,
  describeBandwidth,
  describeRemoteViewing,
  describeViewing,
  describeWarning,
} from '../../_lib/result-summary';
import type { BandwidthCalculatorState } from '../../_state/bandwidth-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { BandwidthBar } from './BandwidthBar';
import { LinkChecks } from './LinkChecks';
import { MetricTiles } from './MetricTiles';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'bandwidth-results';

interface ResultsCardProps {
  result: BandwidthResult;
  /** The inputs behind the result: group names and colours, viewing and overhead settings. */
  state: BandwidthCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const bandwidth = describeBandwidth(result);
  const viewing = result.remoteViewing && describeRemoteViewing(result.remoteViewing);
  const warning = describeWarning(result);

  return (
    <Box
      component="section"
      id={RESULTS_CARD_ID}
      tabIndex={-1}
      aria-label="Results"
      className={classes.card}
    >
      <div>
        <Group justify="space-between" align="center" wrap="nowrap" className={classes.labelRow}>
          <Text className={classes.sectionLabel}>Bandwidth estimate</Text>
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
          <Text className={classes.headlineValue}>{bandwidth.value}</Text>
          {bandwidth.likelyRange && (
            <Text className={classes.secondaryText}>{bandwidth.likelyRange}</Text>
          )}
        </div>
        <Text className={classes.note}>
          Peak traffic from all cameras on the local network, including {state.overheadPercent}%
          overhead.
        </Text>
      </div>

      <BandwidthBar segments={bandwidthSegments(state, result)} />

      {viewing && (
        <div>
          <Text className={`${classes.sectionLabel} ${classes.labelRow}`}>
            Remote viewing bandwidth
          </Text>
          <Text className={classes.figureValue}>
            {viewing.value}
            {viewing.likelyRange && (
              <Text span className={classes.secondaryText}>
                {' '}
                · {viewing.likelyRange}
              </Text>
            )}
          </Text>
          <Text className={classes.note}>{describeViewing(state, result)}</Text>
        </div>
      )}

      {/* Simple mode has no link checks to enter. */}
      {state.inputMode === 'advanced' && (
        <LinkChecks checks={result.linkChecks} remoteViewing={state.remoteViewing.enabled} />
      )}

      {warning && (
        <Group gap={6} wrap="nowrap" className={classes.warning} role="status">
          <IconAlertTriangle size={18} stroke={1.75} aria-hidden="true" />
          <Text size="sm">{warning}</Text>
        </Group>
      )}

      <MetricTiles state={state} result={result} />

      {result.isEstimated && (
        <Text className={classes.note}>
          Estimates are shown as a likely range; link checks use the high end.
          {!isBitrateModelValidated && ' Bitrate estimates use preliminary placeholder values.'}
        </Text>
      )}

      <Group gap="xs" grow>
        <CopyLinkButton getShareUrl={() => buildShareUrl(state, window.location.href)} />
        {/* Opens the print dialog with the printable summary (PrintSummary); "Save as PDF" gives a file. */}
        <Button leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
          Export
        </Button>
      </Group>
    </Box>
  );
}
