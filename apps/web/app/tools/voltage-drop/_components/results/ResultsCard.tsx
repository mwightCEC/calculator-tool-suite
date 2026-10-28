'use client';

import type { BudgetStatus, RunStatus, VoltageDropResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconPrinter } from '@tabler/icons-react';
import { Badge, Box, Button, Group, Stack, Text } from '@mantine/core';
import { CopyLinkButton } from '../../../../../components/CopyLinkButton/CopyLinkButton';
import { SegmentBar } from '../../../../../components/SegmentBar/SegmentBar';
import { formatAmps } from '../../../../../lib/format';
import {
  describeLimit,
  describeProblem,
  describeRating,
  describeRemaining,
  describeSupplyLoad,
  describeWorstDrop,
  RUN_STATUS_LABELS,
  SUPPLY_STATUS_LABELS,
  supplySegments,
  worstRun,
} from '../../_lib/result-summary';
import { buildShareUrl } from '../../_state/share-link';
import type { VoltageDropCalculatorState } from '../../_state/voltage-drop-calculator-state';
import { RunBreakdown } from './RunBreakdown';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'voltage-drop-results';

const RUN_BADGE_COLORS: Record<RunStatus, string> = {
  ok: 'green',
  'over-limit': 'red',
  'cannot-power': 'red',
};

const SUPPLY_BADGE_COLORS: Record<BudgetStatus, string> = {
  ok: 'green',
  'into-reserve': 'amber',
  'over-budget': 'red',
};

interface ResultsCardProps {
  result: VoltageDropResult;
  /** The inputs behind the result: group names, colours, supply, limit and units. */
  state: VoltageDropCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const drop = describeWorstDrop(state, result);
  const runStatus = worstRun(result).status;
  const supply = describeSupplyLoad(result);
  const usesWatts = state.deviceGroups.some((group) => group.load.input === 'watts');

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
          <Text className={classes.sectionLabel}>Worst voltage drop</Text>
          <Badge
            variant="light"
            color={RUN_BADGE_COLORS[runStatus]}
            radius="sm"
            className={classes.statusBadge}
            data-status={runStatus}
          >
            {RUN_STATUS_LABELS[runStatus]}
          </Badge>
        </Group>

        {/* Polite live region so screen readers hear the headline update as inputs change. */}
        <div aria-live="polite" aria-atomic="true">
          <Text className={classes.headlineValue}>{drop.value}</Text>
          <Text className={classes.secondaryText}>{drop.detail}</Text>
        </div>
        <Text className={classes.note}>{describeLimit(state)}.</Text>
      </div>

      <RunBreakdown state={state} result={result} />

      <div>
        <Group justify="space-between" align="center" wrap="nowrap" className={classes.labelRow}>
          <Text className={classes.sectionLabel}>Supply load</Text>
          <Badge
            variant="light"
            color={SUPPLY_BADGE_COLORS[result.supplyStatus]}
            radius="sm"
            className={classes.statusBadge}
            data-status={result.supplyStatus}
          >
            {SUPPLY_STATUS_LABELS[result.supplyStatus]}
          </Badge>
        </Group>
        <Text className={classes.figureValue}>{supply.value}</Text>
        <Text className={classes.secondaryText}>
          {supply.detail} · {describeRemaining(result)}
        </Text>
        <Text className={classes.note}>{describeRating(state, result)}.</Text>
      </div>

      <SegmentBar segments={supplySegments(state, result)} formatValue={formatAmps} />

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
    </Box>
  );
}
