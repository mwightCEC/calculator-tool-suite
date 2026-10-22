import type { LinkCheck, LinkStatus } from '@cctv/calc-core';
import { Badge, Group, Progress, Stack, Text } from '@mantine/core';
import { LINK_LABELS, LINK_STATUS_LABELS } from '../../_lib/bandwidth-labels';
import { describeLinkLoad } from '../../_lib/result-summary';
import classes from './ResultsCard.module.css';

const STATUS_BADGE_COLORS: Record<LinkStatus, string> = {
  ok: 'green',
  caution: 'amber',
  'over-capacity': 'red',
};

const STATUS_METER_COLORS: Record<LinkStatus, string> = {
  ok: 'var(--app-status-ok)',
  caution: 'var(--app-status-warn)',
  'over-capacity': 'var(--app-status-danger)',
};

function LinkCheckRow({ check }: { check: LinkCheck }) {
  const label = LINK_LABELS[check.link];
  const load = describeLinkLoad(check);
  return (
    <li>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text className={classes.linkName}>{label}</Text>
        <Badge
          variant="light"
          color={STATUS_BADGE_COLORS[check.status]}
          radius="sm"
          className={classes.statusBadge}
          data-status={check.status}
        >
          {LINK_STATUS_LABELS[check.status]}
        </Badge>
      </Group>
      <Progress
        size={8}
        value={Math.min(check.utilisation, 1) * 100}
        color={STATUS_METER_COLORS[check.status]}
        className={classes.linkMeter}
        aria-label={`${label}: ${load}`}
      />
      <Text className={classes.note}>{load}</Text>
    </li>
  );
}

/** One row per link entered under Network checks, or a hint when none are. */
export function LinkChecks({ checks }: { checks: LinkCheck[] }) {
  return (
    <div>
      <Text className={`${classes.sectionLabel} ${classes.labelRow}`}>Network checks</Text>
      {checks.length === 0 ? (
        <Text className={classes.secondaryText}>
          Enter a recorder limit, uplink or site upload speed under Network checks to see whether
          the traffic fits.
        </Text>
      ) : (
        <Stack component="ul" gap="sm" className={classes.linkList}>
          {checks.map((check) => (
            <LinkCheckRow key={check.link} check={check} />
          ))}
        </Stack>
      )}
    </div>
  );
}
