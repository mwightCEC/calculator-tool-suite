'use client';

import type { PoeResult } from '@cctv/calc-core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Group, Stack, Text } from '@mantine/core';
import { Disclosure } from '../../../../../components/Disclosure/Disclosure';
import { FaqLink } from '../../../../../components/FaqLink/FaqLink';
import { ResultsActions } from '../../../../../components/ResultsCard/ResultsActions';
import {
  HeadlineTile,
  ResultsPanel,
  SummaryRows,
} from '../../../../../components/ResultsCard/ResultsPanel';
import { SegmentBar } from '../../../../../components/SegmentBar/SegmentBar';
import { formatWatts } from '../../../../../lib/format';
import { buildChecks } from '../../_lib/checks';
import {
  budgetSegments,
  buildMetricTiles,
  describeBudget,
  describeProblem,
  describeUsage,
} from '../../_lib/result-summary';
import type { PoeCalculatorState } from '../../_state/poe-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { ChecksList } from './ChecksList';
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
  const checks = buildChecks(state, result);

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="PoE budget used"
      actions={<ResultsActions getShareUrl={() => buildShareUrl(state, window.location.href)} />}
    >
      <HeadlineTile
        value={usage.value}
        label={usage.detail}
        footnote={describeBudget(state, result)}
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

      <SummaryRows rows={buildMetricTiles(state, result)} />

      <ChecksList checks={checks} />

      <Disclosure title="Power breakdown">
        <Stack gap="md">
          <SegmentBar detailed segments={budgetSegments(state, result)} formatValue={formatWatts} />
          <GroupBreakdown state={state} result={result} />
        </Stack>
      </Disclosure>

      <FaqLink toolId="poe-budget" label="How this is calculated" />
    </ResultsPanel>
  );
}
