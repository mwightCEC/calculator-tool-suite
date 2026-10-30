import type { PoeResult } from '@cctv/calc-core';
import { Group, Stack, Text } from '@mantine/core';
import { formatNumber, formatWatts } from '../../../../../lib/format';
import type { PoeCalculatorState } from '../../_state/poe-calculator-state';
import classes from './ResultsCard.module.css';

interface GroupBreakdownProps {
  state: PoeCalculatorState;
  result: PoeResult;
}

/** Count × per-device allocation = total, one line per group. */
export function GroupBreakdown({ state, result }: GroupBreakdownProps) {
  return (
    <div>
      <Text component="h3" className={classes.sectionTitle}>
        By group
      </Text>
      <Stack component="ul" gap={4} className={classes.list}>
        {result.groups.map((usage) => {
          const group = state.deviceGroups.find((candidate) => candidate.id === usage.groupId);
          return (
            group && (
              <Group
                component="li"
                key={group.id}
                justify="space-between"
                wrap="nowrap"
                gap="sm"
                className={classes.groupRow}
              >
                <span className={classes.groupName}>{group.name}</span>
                <span className={classes.groupValue}>
                  {formatNumber(group.deviceCount, 0)} × {formatWatts(usage.perDeviceWatts)} ={' '}
                  {formatWatts(usage.totalWatts)}
                </span>
              </Group>
            )
          );
        })}
      </Stack>
    </div>
  );
}
