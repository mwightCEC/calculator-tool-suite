import type { PoeResult } from '@cctv/calc-core';
import { Paper, Text, Title } from '@mantine/core';
import { formatWatts } from '../../../../lib/format';
import classes from './PoeCalculator.module.css';

interface BudgetSummaryProps {
  result: PoeResult;
}

/** Interim totals while the inputs are built; P3 replaces this with the results card. */
export function BudgetSummary({ result }: BudgetSummaryProps) {
  return (
    <Paper
      component="section"
      withBorder
      className={classes.card}
      aria-labelledby="poe-summary-title"
    >
      <Title order={2} id="poe-summary-title" className={classes.cardTitle}>
        Budget
      </Title>
      <Text fw={600}>
        {formatWatts(result.totalWatts)} of {formatWatts(result.usableWatts)} usable
      </Text>
      <Text size="sm" className={classes.secondaryText}>
        {formatWatts(result.budgetWatts)} budget, {formatWatts(result.reserveWatts)} reserve ·{' '}
        {result.totalDevices} of {result.ports} PoE ports
      </Text>
    </Paper>
  );
}
