'use client';

import type { BudgetStatus, PoeResult } from '@cctv/calc-core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Badge, Box, Group, Stack, Text } from '@mantine/core';
import {
  BUDGET_STATUS_LABELS,
  budgetSegments,
  describeBudget,
  describePorts,
  describeProblem,
  describeRemaining,
  describeUsage,
} from '../../_lib/result-summary';
import type { PoeCalculatorState } from '../../_state/poe-calculator-state';
import { BudgetBar } from './BudgetBar';
import { GroupBreakdown } from './GroupBreakdown';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'poe-results';

const STATUS_BADGE_COLORS: Record<BudgetStatus, string> = {
  ok: 'green',
  'into-reserve': 'amber',
  'over-budget': 'red',
};

interface ResultsCardProps {
  result: PoeResult;
  /** The inputs behind the result: group names, colours and the switch's reserve. */
  state: PoeCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const usage = describeUsage(result);
  const usesWatts = state.deviceGroups.some((group) => group.power.input === 'watts');

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
          <Text className={classes.sectionLabel}>PoE budget used</Text>
          <Badge
            variant="light"
            color={STATUS_BADGE_COLORS[result.budgetStatus]}
            radius="sm"
            className={classes.statusBadge}
            data-status={result.budgetStatus}
          >
            {BUDGET_STATUS_LABELS[result.budgetStatus]}
          </Badge>
        </Group>

        {/* Polite live region so screen readers hear the headline update as inputs change. */}
        <div aria-live="polite" aria-atomic="true">
          <Text className={classes.headlineValue}>{usage.value}</Text>
          <Text className={classes.secondaryText}>
            {usage.detail} · {describeRemaining(result)}
          </Text>
        </div>
        <Text className={classes.note}>{describeBudget(state, result)}.</Text>
      </div>

      <BudgetBar segments={budgetSegments(state, result)} />

      <div>
        <Text className={`${classes.sectionLabel} ${classes.labelRow}`}>Ports</Text>
        <Text className={classes.figureValue}>{describePorts(result)}</Text>
      </div>

      <GroupBreakdown state={state} result={result} />

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
          Watts include an estimated cable loss. A switch that reserves power by PoE class may set
          aside more than the devices draw.
        </Text>
      )}
    </Box>
  );
}
