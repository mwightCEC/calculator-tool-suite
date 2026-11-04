'use client';

import type { LensFovResult } from '@cctv/calc-core';
import { IconAlertTriangle, IconPrinter } from '@tabler/icons-react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { CopyLinkButton } from '../../../../../components/CopyLinkButton/CopyLinkButton';
import { Disclosure } from '../../../../../components/Disclosure/Disclosure';
import {
  HeadlineTile,
  MetricRow,
  ResultsPanel,
} from '../../../../../components/ResultsCard/ResultsPanel';
import {
  buildMetricTiles,
  describeCamera,
  describeDoriLevel,
  describeHeadline,
  describeNote,
} from '../../_lib/result-summary';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { HowCalculated } from '../HowCalculated';
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
      badge={
        <Badge
          variant="light"
          color={result.doriLevel ? 'blue' : 'amber'}
          radius="sm"
          className={classes.doriBadge}
          data-level={result.doriLevel ?? 'below'}
        >
          {describeDoriLevel(result.doriLevel)}
        </Badge>
      }
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

      <Disclosure title="How this is calculated">
        <HowCalculated />
      </Disclosure>

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
