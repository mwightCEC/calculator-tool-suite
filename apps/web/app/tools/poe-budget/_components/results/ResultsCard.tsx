'use client';

import type { PoeResult } from '@cctv/calc-core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { Disclosure } from '../../../../../components/Disclosure/Disclosure';
import { FaqLink } from '../../../../../components/FaqLink/FaqLink';
import { ResultsActions } from '../../../../../components/ResultsCard/ResultsActions';
import {
  HeadlineTile,
  MetricRow,
  ResultsPanel,
} from '../../../../../components/ResultsCard/ResultsPanel';
import { SegmentBar } from '../../../../../components/SegmentBar/SegmentBar';
import { formatWatts } from '../../../../../lib/format';
import { buildChecks, describeOverallStatus } from '../../_lib/checks';
import {
  budgetSegments,
  buildMetricTiles,
  describeBudget,
  describeDevices,
  describeProblem,
  describeUsage,
} from '../../_lib/result-summary';
import type { PoeCalculatorState } from '../../_state/poe-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { CHECK_BADGE_COLORS, ChecksList } from './ChecksList';
import { GroupBreakdown } from './GroupBreakdown';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'poe-results';

interface ResultsCardProps {
  result: PoeResult;
  /** The inputs behind the result: group names, colours and the switch's reserve. */
  state: PoeCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const usage = describeUsage(result);
  const usesWatts = state.deviceGroups.some((group) => group.power.input === 'watts');
  const checks = buildChecks(state, result);
  const overall = describeOverallStatus(checks);

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="PoE budget"
      actions={<ResultsActions getShareUrl={() => buildShareUrl(state, window.location.href)} />}
      badge={
        <Badge
          variant="light"
          color={CHECK_BADGE_COLORS[overall.level]}
          radius="sm"
          className={classes.statusBadge}
          data-level={overall.level}
        >
          {overall.label}
        </Badge>
      }
    >
      <HeadlineTile
        value={usage.value}
        label="PoE budget used"
        range={usage.detail}
        footnote={`${describeDevices(state, result)} · ${describeBudget(state, result)}`}
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

      <ChecksList checks={checks} />

      <Disclosure title="Power breakdown">
        <Stack gap="md">
          <SegmentBar detailed segments={budgetSegments(state, result)} formatValue={formatWatts} />
          <GroupBreakdown state={state} result={result} />
        </Stack>
      </Disclosure>

      <FaqLink toolId="poe-budget" label="How this is calculated" />

      {usesWatts && (
        <Text className={classes.note}>
          Watts include an estimated cable loss. A switch that reserves power by PoE class may set
          aside more than the devices draw.
        </Text>
      )}
    </ResultsPanel>
  );
}
