import type { VoltageDropResult } from '@cctv/calc-core';
import { Group, Stack, Text } from '@mantine/core';
import { describeRunDrop, describeRunLimits } from '../../_lib/result-summary';
import type { VoltageDropCalculatorState } from '../../_state/voltage-drop-calculator-state';
import classes from './ResultsCard.module.css';

interface RunBreakdownProps {
  state: VoltageDropCalculatorState;
  result: VoltageDropResult;
}

/** Drop and device voltage per group, with the smallest wire and longest run that pass. */
export function RunBreakdown({ state, result }: RunBreakdownProps) {
  return (
    <div>
      <Text component="h3" className={classes.sectionTitle}>
        By group
      </Text>
      <Stack component="ul" gap="xs" className={classes.list}>
        {result.groups.map((usage) => {
          const group = state.deviceGroups.find((candidate) => candidate.id === usage.groupId);
          return (
            group && (
              <li key={group.id}>
                <Group justify="space-between" wrap="nowrap" gap="sm" className={classes.groupRow}>
                  <span className={classes.groupName}>{group.name}</span>
                  <span className={classes.groupValue} data-status={usage.status}>
                    {describeRunDrop(usage)}
                  </span>
                </Group>
                <Text className={classes.runLimits}>
                  {describeRunLimits(usage, state.cableLengthUnit)}
                </Text>
              </li>
            )
          );
        })}
      </Stack>
    </div>
  );
}
