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
import {
  SegmentBarHeader,
  useSimplifiedBreakdown,
} from '../../../../../components/SegmentBar/SegmentBarHeader';
import { formatMbps, formatNumber } from '../../../../../lib/format';
import { bandwidthSegments, buildMetricTiles, describeBandwidth } from '../../_lib/result-summary';
import type { BandwidthCalculatorState } from '../../_state/bandwidth-calculator-state';
import { buildShareUrl } from '../../_state/share-link';
import { LinkChecks } from './LinkChecks';

export const RESULTS_CARD_ID = 'bandwidth-results';

const SIMPLIFIED_STORAGE_KEY = 'cctv-tool-suite:bandwidth-breakdown-simplified';

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
  const [simplified, setSimplified] = useSimplifiedBreakdown(SIMPLIFIED_STORAGE_KEY);
  const severalGroups = state.cameraGroups.length > 1;

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="Estimated bandwidth"
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
        <SegmentBarHeader
          showSwitch={severalGroups}
          simplified={simplified}
          onSimplifiedChange={setSimplified}
        />
        <SegmentBar
          detailed
          segments={bandwidthSegments(state, result, simplified && severalGroups)}
          formatValue={formatMbps}
        />
      </Disclosure>

      <FaqLink toolId="bandwidth" label="How estimates are calculated" />
    </ResultsPanel>
  );
}
