'use client';

import {
  isBitrateModelValidated,
  isSubStreamModelValidated,
  type BandwidthResult,
} from '@cctv/calc-core';
import { IconAlertTriangle, IconPrinter } from '@tabler/icons-react';
import { Badge, Box, Button, Group, Text } from '@mantine/core';
import { CopyLinkButton } from '../../../../../components/CopyLinkButton/CopyLinkButton';
import {
  describeIngest,
  describeViewing,
  describeViewingUpload,
  describeWarning,
  ingestSegments,
} from '../../_lib/result-summary';
import type { BandwidthCalculatorState } from '../../_state/bandwidth-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { IngestBar } from './IngestBar';
import { LinkChecks } from './LinkChecks';
import { MetricTiles } from './MetricTiles';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'bandwidth-results';

const modelsValidated = isBitrateModelValidated && isSubStreamModelValidated;

interface ResultsCardProps {
  result: BandwidthResult;
  /** The inputs behind the result: group names and colours, viewing and overhead settings. */
  state: BandwidthCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const ingest = describeIngest(result);
  const upload = describeViewingUpload(result);
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
          <Text className={classes.sectionLabel}>Recorder ingest</Text>
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
          <Text className={classes.headlineValue}>{ingest.value}</Text>
          {ingest.likelyRange && (
            <Text className={classes.secondaryText}>{ingest.likelyRange}</Text>
          )}
        </div>
        <Text className={classes.note}>
          Peak traffic from the cameras to the recorder, including {state.overheadPercent}%
          overhead.
        </Text>
      </div>

      <IngestBar segments={ingestSegments(state, result)} />

      <div>
        <Text className={`${classes.sectionLabel} ${classes.labelRow}`}>Remote viewing upload</Text>
        <Text className={classes.figureValue}>
          {upload.value}
          {upload.likelyRange && (
            <Text span className={classes.secondaryText}>
              {' '}
              · {upload.likelyRange}
            </Text>
          )}
        </Text>
        <Text className={classes.note}>{describeViewing(state, result)}</Text>
      </div>

      <LinkChecks checks={result.linkChecks} />

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
          {!modelsValidated && ' Bitrate estimates use preliminary placeholder values.'}
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
