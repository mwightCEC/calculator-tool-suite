'use client';

import type { VoltageDropResult } from '@cctv/calc-core';
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
import {
  buildMetricTiles,
  describeLimit,
  describeProblem,
  describeWorstRun,
  HEADLINE_LABEL,
  isSupplyLoadKnown,
  SUPPLY_LOAD_UNAVAILABLE_NOTE,
  supplySegments,
  visibleProblems,
} from '../../_lib/result-summary';
import { formatSupplyAmps } from '../../_lib/supply-units';
import { buildShareUrl } from '../../_state/share-link';
import type { VoltageDropCalculatorState } from '../../_state/voltage-drop-calculator-state';
import { RunBreakdown } from './RunBreakdown';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'voltage-drop-results';

interface ResultsCardProps {
  result: VoltageDropResult;
  /** The inputs behind the result: group names, colours, supply, limit and units. */
  state: VoltageDropCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const drop = describeWorstRun(state, result);
  const usesWatts = state.deviceGroups.some((group) => group.load.input === 'watts');
  const problems = visibleProblems(result);

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="Voltage drop"
      actions={<ResultsActions getShareUrl={() => buildShareUrl(state, window.location.href)} />}
    >
      <HeadlineTile
        value={drop.value}
        label={HEADLINE_LABEL}
        range={drop.detail}
        footnote={describeLimit(state)}
      />

      {problems.length > 0 && (
        <Stack component="ul" gap="xs" className={classes.list} role="status">
          {problems.map((problem) => (
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

      <Disclosure title="Run and supply breakdown">
        <Stack gap="md">
          <RunBreakdown state={state} result={result} />
          <div>
            <Text component="h3" className={classes.sectionTitle}>
              Supply load
            </Text>
            {isSupplyLoadKnown(result) ? (
              <SegmentBar
                detailed
                segments={supplySegments(state, result)}
                formatValue={(amps) => formatSupplyAmps(state.powerSupply, amps)}
              />
            ) : (
              <Text size="sm" className={classes.unavailable}>
                {SUPPLY_LOAD_UNAVAILABLE_NOTE}
              </Text>
            )}
          </div>
        </Stack>
      </Disclosure>

      <FaqLink toolId="voltage-drop" label="How this is calculated" />

      {usesWatts && (
        <Text className={classes.note}>
          Loads given in watts draw more current as the voltage falls; the amps shown include this.
        </Text>
      )}
    </ResultsPanel>
  );
}
