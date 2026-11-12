'use client';

import { isBitrateModelValidated, type StorageCalculationResult } from '@cctv/calc-core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Group, Text } from '@mantine/core';
import { Disclosure } from '../../../../../components/Disclosure/Disclosure';
import { FaqLink } from '../../../../../components/FaqLink/FaqLink';
import { ResultsActions } from '../../../../../components/ResultsCard/ResultsActions';
import {
  HeadlineTile,
  PreliminaryBitrateNote,
  ResultsPanel,
  SummaryRows,
} from '../../../../../components/ResultsCard/ResultsPanel';
import { buildSummarySections, describeHeadline, describeWarning } from '../../_lib/result-summary';
import { buildShareUrl } from '../../_state/share-link';
import type { StorageCalculatorState } from '../../_state/storage-calculator-state';
import { CapacityBar } from './CapacityBar';
import { DrivesSummary } from './DrivesSummary';
import classes from './ResultsCard.module.css';

export const RESULTS_CARD_ID = 'storage-results';

interface ResultsCardProps {
  result: StorageCalculationResult;
  /** The inputs behind the result: group names and colours, share link. */
  state: StorageCalculatorState;
}

const RESULTS_TITLES = {
  'storage-needed': 'Estimated total capacity',
  'days-from-capacity': 'Estimated total retention',
} as const;

export function ResultsCard({ result, state }: ResultsCardProps) {
  const summary = buildSummarySections(result, state);
  const headline = describeHeadline(result);
  const warning = describeWarning(result);

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title={RESULTS_TITLES[result.mode]}
      actions={<ResultsActions getShareUrl={() => buildShareUrl(state, window.location.href)} />}
    >
      {result.isEstimated && !isBitrateModelValidated && <PreliminaryBitrateNote />}

      <HeadlineTile
        value={headline.value}
        label={headline.label}
        range={headline.likelyRange}
        footnote={headline.note}
      />

      {warning && (
        <Group gap={6} wrap="nowrap" className={classes.warning} role="status">
          <IconAlertTriangle size={18} stroke={1.75} aria-hidden="true" />
          <Text size="sm">{warning}</Text>
        </Group>
      )}

      <SummaryRows rows={summary.recording} />
      <div className={classes.capacityRows}>
        <SummaryRows rows={summary.capacity} />
      </div>

      <Disclosure title="Capacity breakdown">
        <CapacityBar
          breakdown={result.breakdown}
          groups={state.cameraGroups}
          singleGroup={state.cameraGroups.length === 1}
        />
      </Disclosure>

      <Disclosure title="Drives and RAID">
        <DrivesSummary result={result} />
      </Disclosure>

      <FaqLink toolId="storage" label="How estimates are calculated" />
    </ResultsPanel>
  );
}
