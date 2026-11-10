'use client';

import { isBitrateModelValidated, type BandwidthResult, type NetworkLinks } from '@cctv/calc-core';
import { Disclosure } from '../../../../../components/Disclosure/Disclosure';
import { FaqLink } from '../../../../../components/FaqLink/FaqLink';
import { ResultsActions } from '../../../../../components/ResultsCard/ResultsActions';
import {
  HeadlineTile,
  PreliminaryBitrateNote,
  ResultsPanel,
  SummaryRows,
} from '../../../../../components/ResultsCard/ResultsPanel';
import { SegmentBar } from '../../../../../components/SegmentBar/SegmentBar';
import { formatMbps, formatNumber } from '../../../../../lib/format';
import { bandwidthSegments, buildMetricTiles, describeBandwidth } from '../../_lib/result-summary';
import type { BandwidthCalculatorState } from '../../_state/bandwidth-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { LinkChecks } from './LinkChecks';

export const RESULTS_CARD_ID = 'bandwidth-results';

const plural = (count: number, noun: string) =>
  `${formatNumber(count, 0)} ${count === 1 ? noun : `${noun}s`}`;

interface ResultsCardProps {
  result: BandwidthResult;
  /** The inputs behind the result: group names and colours, viewing and overhead settings. */
  state: BandwidthCalculatorState;
  /** Sets the uplink speed checked under Network checks; null turns the check off. */
  onUplinkChange: (uplinkMbps: NetworkLinks['uplinkMbps']) => void;
}

export function ResultsCard({ result, state, onUplinkChange }: ResultsCardProps) {
  const bandwidth = describeBandwidth(result);

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="Bandwidth estimate"
      actions={<ResultsActions getShareUrl={() => buildShareUrl(state, window.location.href)} />}
    >
      {result.isEstimated && !isBitrateModelValidated && <PreliminaryBitrateNote />}

      <HeadlineTile
        value={bandwidth.value}
        label={result.isEstimated ? 'Typical camera traffic' : 'Camera traffic'}
        range={bandwidth.likelyRange}
        footnote={`${plural(result.totalCameras, 'camera')} in ${plural(state.cameraGroups.length, 'group')} · includes ${state.overheadPercent}% overhead`}
      />

      <SummaryRows rows={buildMetricTiles(state, result)} />

      <LinkChecks
        checks={result.linkChecks}
        uplinkMbps={state.network.uplinkMbps}
        onUplinkChange={onUplinkChange}
      />

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

      <FaqLink toolId="bandwidth" label="How estimates are calculated" />
    </ResultsPanel>
  );
}
