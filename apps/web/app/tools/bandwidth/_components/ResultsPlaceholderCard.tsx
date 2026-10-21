'use client';

import type { BandwidthResult, ValueRange } from '@cctv/calc-core';
import { Box, Text } from '@mantine/core';
import { formatLikelyRange, formatMbps } from '../../../../lib/format';
import classes from './BandwidthCalculator.module.css';

interface ResultFigureProps {
  label: string;
  mbps: ValueRange;
  approx: boolean;
}

function ResultFigure({ label, mbps, approx }: ResultFigureProps) {
  const likelyRange = formatLikelyRange(mbps, 'Mbps');
  return (
    <div>
      <Text className={classes.sectionLabel}>{label}</Text>
      <Text className={classes.resultValue}>
        {approx ? '~' : ''}
        {formatMbps(mbps.typical)}
      </Text>
      {likelyRange && <Text className={classes.resultRange}>{likelyRange}</Text>}
    </div>
  );
}

interface ResultsPlaceholderCardProps {
  result: BandwidthResult;
}

/** Interim results: recorder ingest and remote viewing upload. */
export function ResultsPlaceholderCard({ result }: ResultsPlaceholderCardProps) {
  return (
    <Box component="section" aria-label="Results" className={classes.resultsCard}>
      {/* Polite live region so screen readers hear the totals update as inputs change. */}
      <div aria-live="polite" aria-atomic="true" className={classes.resultFigures}>
        <ResultFigure
          label="Recorder ingest"
          mbps={result.ingestMbps}
          approx={result.isEstimated}
        />
        <ResultFigure
          label="Remote viewing upload"
          mbps={result.viewingUploadMbps}
          approx={result.viewingPerCameraMbps !== null && result.isEstimated}
        />
      </div>
      {result.isEstimated && (
        <Text size="xs" className={classes.secondaryText}>
          Estimated peak traffic, including the overhead allowance. Bitrate estimates use
          preliminary placeholder values.
        </Text>
      )}
    </Box>
  );
}
