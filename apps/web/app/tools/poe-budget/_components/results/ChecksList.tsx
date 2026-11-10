import { Badge, Group, Stack, Text } from '@mantine/core';
import type { CheckLevel, PoeCheck } from '../../_lib/checks';
import classes from './ResultsCard.module.css';

export const CHECK_BADGE_COLORS: Record<CheckLevel, string> = {
  ok: 'green',
  caution: 'amber',
  fail: 'red',
};

/** One row per check, each with its own badge, so every check's result is visible at once. */
export function ChecksList({ checks }: { checks: PoeCheck[] }) {
  return (
    <section aria-labelledby="poe-checks-title" className={classes.checks}>
      <Text component="h3" id="poe-checks-title" className={classes.sectionTitle}>
        Checks
      </Text>
      <Stack component="ul" gap="xs" className={classes.list}>
        {checks.map((check) => (
          <li key={check.key}>
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Text className={classes.checkName}>{check.label}</Text>
              <Badge
                variant="light"
                color={CHECK_BADGE_COLORS[check.level]}
                radius="sm"
                className={classes.statusBadge}
                data-level={check.level}
              >
                {check.status}
              </Badge>
            </Group>
            <Text className={classes.note}>{check.detail}</Text>
          </li>
        ))}
      </Stack>
    </section>
  );
}
