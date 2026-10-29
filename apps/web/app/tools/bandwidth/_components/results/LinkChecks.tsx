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

interface LinkChecksProps {
  checks: LinkCheck[];
  /** Whether remote viewing is on, which offers the site upload check. */
  remoteViewing: boolean;
}

/** One row per link entered, or a hint when none are. */
export function LinkChecks({ checks, remoteViewing }: LinkChecksProps) {
  return (
    <section aria-labelledby="network-checks-title">
      <Text component="h3" id="network-checks-title" className={classes.sectionTitle}>
        Network checks
      </Text>
      {checks.length === 0 ? (
        <Text className={classes.secondaryText}>
          {remoteViewing
            ? 'Choose an uplink speed under Network check and overhead, or enter a site upload speed under Remote viewing, to see whether the traffic fits.'
            : 'Choose an uplink speed under Network check and overhead to see whether the traffic fits.'}
        </Text>
      ) : (
        <Stack component="ul" gap="sm" className={classes.linkList}>
          {checks.map((check) => (
            <LinkCheckRow key={check.link} check={check} />
          ))}
        </Stack>
      )}
    </section>
  );
}
