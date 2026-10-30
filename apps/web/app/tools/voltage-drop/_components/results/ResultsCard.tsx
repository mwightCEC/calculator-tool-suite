'use client';

import type { VoltageDropResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconPrinter } from '@tabler/icons-react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { CopyLinkButton } from '../../../../../components/CopyLinkButton/CopyLinkButton';
import { Disclosure } from '../../../../../components/Disclosure/Disclosure';
import {
  HeadlineTile,
  MetricRow,
  ResultsPanel,
} from '../../../../../components/ResultsCard/ResultsPanel';
import { SegmentBar } from '../../../../../components/SegmentBar/SegmentBar';
import { formatAmps } from '../../../../../lib/format';
import {
  buildMetricTiles,
  describeDevices,
  describeLimit,
  describeProblem,
  describeStatus,
  describeWorstDrop,
  type ResultStatus,
  supplySegments,
} from '../../_lib/result-summary';
import { buildShareUrl } from '../../_state/share-link';
import type { VoltageDropCalculatorState } from '../../_state/voltage-drop-calculator-state';
import { HowCalculated } from '../HowCalculated';
import { RunBreakdown } from './RunBreakdown';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'voltage-drop-results';

const STATUS_BADGE_COLORS: Record<ResultStatus['status'], string> = {
  ok: 'green',
  'into-reserve': 'amber',
  'over-budget': 'red',
  'over-limit': 'red',
  'cannot-power': 'red',
};

interface ResultsCardProps {
  result: VoltageDropResult;
  /** The inputs behind the result: group names, colours, supply, limit and units. */
  state: VoltageDropCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const drop = describeWorstDrop(state, result);
  const status = describeStatus(result);
  const usesWatts = state.deviceGroups.some((group) => group.load.input === 'watts');

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="Voltage drop"
      badge={
        <Badge
          variant="light"
          color={STATUS_BADGE_COLORS[status.status]}
          radius="sm"
          className={classes.statusBadge}
          data-status={status.status}
        >
          {status.label}
        </Badge>
      }
    >
      <HeadlineTile
        value={drop.value}
        label="Worst voltage drop"
        range={drop.detail}
        footnote={`${describeDevices(state)} · ${describeLimit(state)}`}
      />

      {result.problems.length > 0 && (
        <Stack component="ul" gap="xs" className={classes.list} role="status">
          {result.problems.map((problem) => (
            <Group
              component="li"
              key={'groupId' in problem ? `${problem.kind}-${problem.groupId}` : problem.kind}
              gap={6}
              wrap="nowrap"
              align="flex-start"
              className={classes.problem}
              data-kind={problem.kind}
            >
              <IconAlertTriangle
                size={18}
                stroke={1.75}
                className={classes.problemIcon}
                aria-hidden="true"
              />
              <Text size="sm">{describeProblem(problem, state, result)}</Text>
            </Group>
          ))}
        </Stack>
      )}

      <MetricRow tiles={buildMetricTiles(state, result)} />

      <Disclosure title="Run and supply breakdown">
        <Stack gap="md">
          <RunBreakdown state={state} result={result} />
          <div>
            <Text component="h3" className={classes.sectionTitle}>
              Supply load
            </Text>
            <SegmentBar
              detailed
              segments={supplySegments(state, result)}
              formatValue={formatAmps}
            />
          </div>
        </Stack>
      </Disclosure>

      <Disclosure title="How this is calculated">
        <HowCalculated />
      </Disclosure>

      {usesWatts && (
        <Text className={classes.note}>
          Loads given in watts draw more current as the voltage falls; the amps shown include this.
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
