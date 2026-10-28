import type { VoltageDropResult } from '@cctv/calc-core';
import { Paper, Text, Title } from '@mantine/core';
import { formatAmps, formatPercent } from '../../../../lib/format';
import classes from './VoltageDropCalculator.module.css';

interface DropSummaryProps {
  result: VoltageDropResult;
}

/** The largest drop on any run, as a share of the supply; null when a run can't power its device. */
function worstDrop(result: VoltageDropResult): number | null {
  const drops = result.groups.map((group) => group.dropFraction);
  return drops.includes(null) ? null : Math.max(...(drops as number[]));
}

/** Interim totals while the inputs are built; V3 replaces this with the results card. */
export function DropSummary({ result }: DropSummaryProps) {
  const drop = worstDrop(result);
  return (
    <Paper
      component="section"
      withBorder
      className={classes.card}
      aria-labelledby="drop-summary-title"
    >
      <Title order={2} id="drop-summary-title" className={classes.cardTitle}>
        Voltage drop
      </Title>
      <Text fw={600}>
        {drop === null ? "A run can't power its device" : `Worst run: ${formatPercent(drop)} drop`}
      </Text>
      <Text size="sm" className={classes.secondaryText}>
        {formatAmps(result.totalAmps)} of {formatAmps(result.usableAmps)} usable ·{' '}
        {result.totalDevices} {result.totalDevices === 1 ? 'device' : 'devices'}
      </Text>
    </Paper>
  );
}
