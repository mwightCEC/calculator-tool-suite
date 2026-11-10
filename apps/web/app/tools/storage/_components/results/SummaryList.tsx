import type { StorageCalculationResult } from '@cctv/calc-core';
import { Group, Stack, Text } from '@mantine/core';
import { buildSummaryItems } from '../../_lib/result-summary';
import type { StorageCalculatorState } from '../../_state/storage-calculator-state';
import classes from './ResultsCard.module.css';

interface SummaryListProps {
  result: StorageCalculationResult;
  state: StorageCalculatorState;
}

/**
 * Capacity of the drives and what the cameras record, laid out like PoE budget's
 * checks: the label on the left, the value on the right, and its detail underneath.
 */
export function SummaryList({ result, state }: SummaryListProps) {
  return (
    <Stack component="ul" gap="xs" className={classes.summaryList}>
      {buildSummaryItems(result, state).map(({ label, value, detail }) => (
        <li key={label}>
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Text className={classes.summaryLabel}>{label}</Text>
            <Text className={classes.summaryValue}>{value}</Text>
          </Group>
          {detail && <Text className={classes.summaryDetail}>{detail}</Text>}
        </li>
      ))}
    </Stack>
  );
}
