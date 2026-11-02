import type { LensFovResult } from '@cctv/calc-core';
import { Badge } from '@mantine/core';
import {
  HeadlineTile,
  MetricRow,
  ResultsPanel,
} from '../../../../components/ResultsCard/ResultsPanel';
import {
  DORI_LEVEL_LABELS,
  formatDegrees,
  formatDensity,
  formatLength,
} from '../_lib/lens-fov-labels';
import type { LensFovCalculatorState } from '../_state/lens-fov-calculator-state';

export const RESULTS_CARD_ID = 'lens-fov-results';

interface FovSummaryProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
}

/** Interim results: the headline figures until the full results card replaces it (L3). */
export function FovSummary({ state, result }: FovSummaryProps) {
  const unit = state.lengthUnit;
  const coverage = `${formatLength(result.horizontalCoverageM, unit)} × ${formatLength(result.verticalCoverageM, unit)}`;
  const level = result.doriLevel ? DORI_LEVEL_LABELS[result.doriLevel] : 'Below detection';

  return (
    <ResultsPanel
      id={RESULTS_CARD_ID}
      title="Field of view"
      badge={
        <Badge variant="light" color={result.doriLevel ? 'blue' : 'amber'} radius="sm">
          {level}
        </Badge>
      }
    >
      {state.solveFor === 'coverage' ? (
        <HeadlineTile
          value={coverage}
          label={`Coverage at ${formatLength(result.distanceM, unit)}`}
        />
      ) : (
        <HeadlineTile
          value={formatLength(result.distanceM, unit)}
          label="Farthest distance for the target"
          footnote={`Covers ${coverage} there`}
        />
      )}
      <MetricRow
        tiles={[
          { label: 'Pixel density', value: formatDensity(result.pixelsPerMetre, unit) },
          { label: 'Horizontal FOV', value: formatDegrees(result.horizontalFovDeg) },
          { label: '6 ft person', value: `${Math.round(result.personHeightPx)} px` },
        ]}
      />
    </ResultsPanel>
  );
}
