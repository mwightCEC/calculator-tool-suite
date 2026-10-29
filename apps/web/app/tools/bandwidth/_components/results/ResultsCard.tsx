'use client';

import { isBitrateModelValidated, type BandwidthResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconPrinter, IconWorldUpload } from '@tabler/icons-react';
import { Button, Group, Text, ThemeIcon } from '@mantine/core';
import { CopyLinkButton } from '../../../../../components/CopyLinkButton/CopyLinkButton';
import { Disclosure } from '../../../../../components/Disclosure/Disclosure';
import {
  EstimateBadge,
  HeadlineTile,
  MetricRow,
  ResultsPanel,
} from '../../../../../components/ResultsCard/ResultsPanel';
import { SegmentBar } from '../../../../../components/SegmentBar/SegmentBar';
import { formatMbps, formatNumber } from '../../../../../lib/format';
import {
  bandwidthSegments,
  buildMetricTiles,
  describeBandwidth,
  describeRemoteViewing,
  describeViewing,
  describeWarning,
} from '../../_lib/result-summary';
import type { BandwidthCalculatorState } from '../../_state/bandwidth-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { HowCalculated } from '../HowCalculated';
import { LinkChecks } from './LinkChecks';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'bandwidth-results';

const plural = (count: number, noun: string) =>
  `${formatNumber(count, 0)} ${count === 1 ? noun : `${noun}s`}`;

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
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="Bandwidth estimate"
      badge={<EstimateBadge isEstimated={result.isEstimated} />}
    >
      <HeadlineTile
        value={bandwidth.value}
        label="Peak network bandwidth"
        range={bandwidth.likelyRange}
        footnote={`${plural(result.totalCameras, 'camera')} in ${plural(state.cameraGroups.length, 'group')} · includes ${state.overheadPercent}% overhead`}
      />

      {warning && (
        <Group gap={6} wrap="nowrap" className={classes.warning} role="status">
          <IconAlertTriangle size={18} stroke={1.75} aria-hidden="true" />
          <Text size="sm">{warning}</Text>
        </Group>
      )}

      <MetricRow tiles={buildMetricTiles(state, result)} />

      {viewing && (
        <Group
          gap="sm"
          align="flex-start"
          wrap="nowrap"
          component="section"
          aria-labelledby="remote-viewing-result-title"
          className={classes.box}
        >
          <ThemeIcon variant="light" size={36} radius="md">
            <IconWorldUpload size={20} stroke={1.75} />
          </ThemeIcon>
          <div>
            <Text component="h3" id="remote-viewing-result-title" className={classes.boxTitle}>
              Remote viewing: {viewing.value}
            </Text>
            {viewing.likelyRange && (
              <Text className={classes.boxDetail}>{viewing.likelyRange}</Text>
            )}
            <Text className={classes.boxDetail}>{describeViewing(state, result)}</Text>
          </div>
        </Group>
      )}

      <LinkChecks checks={result.linkChecks} remoteViewing={state.remoteViewing.enabled} />

      <Disclosure title="Traffic breakdown">
        <SegmentBar
          detailed
          segments={bandwidthSegments(state, result).map((segment) => ({
            key: segment.key,
            label: segment.label,
            value: segment.mbps,
            color:
              segment.colorIndex === null
                ? 'var(--app-capacity-reserve)'
                : `var(--group-color-${segment.colorIndex})`,
          }))}
          formatValue={formatMbps}
        />
      </Disclosure>

      <Disclosure title="How estimates are calculated">
        <HowCalculated />
      </Disclosure>

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
    </ResultsPanel>
  );
}
