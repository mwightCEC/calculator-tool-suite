'use client';

import type { LensFovResult } from '@cctv/calc-core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Group, Stack, Text } from '@mantine/core';
import { FaqLink } from '../../../../../components/FaqLink/FaqLink';
import { ResultsActions } from '../../../../../components/ResultsCard/ResultsActions';
import {
  HeadlineTile,
  MetricRow,
  ResultsPanel,
} from '../../../../../components/ResultsCard/ResultsPanel';
import {
  buildMetricTiles,
  describeCamera,
  describeHeadline,
  describeNote,
} from '../../_lib/result-summary';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'lens-fov-results';

interface ResultsCardProps {
  result: LensFovResult;
  /** The inputs behind the result: camera, mode and units. */
  state: LensFovCalculatorState;
}

export function ResultsCard({ result, state }: ResultsCardProps) {
  const headline = describeHeadline(state, result);

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="Field of view"
      actions={<ResultsActions getShareUrl={() => buildShareUrl(state, window.location.href)} />}
    >
      <HeadlineTile
        value={headline.value}
        label={headline.label}
        range={headline.detail}
        footnote={describeCamera(state)}
      />

      {result.notes.length > 0 && (
        <Stack component="ul" gap="xs" className={classes.list} role="status">
          {result.notes.map((note) => (
            <Group
              component="li"
              key={note}
              gap={6}
              wrap="nowrap"
              align="flex-start"
              className={classes.notice}
            >
              <IconAlertTriangle
                size={18}
                stroke={1.75}
                className={classes.noticeIcon}
                aria-hidden="true"
              />
              <Text size="sm">{describeNote(note, state, result)}</Text>
            </Group>
          ))}
        </Stack>
      )}

      <MetricRow tiles={buildMetricTiles(state, result)} />

      <FaqLink toolId="lens-fov" label="How this is calculated" />
    </ResultsPanel>
  );
}
