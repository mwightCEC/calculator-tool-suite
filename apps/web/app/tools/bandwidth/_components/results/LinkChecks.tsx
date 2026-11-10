import {
  UPLINK_SPEEDS_MBPS,
  type LinkCheck,
  type LinkStatus,
  type NetworkLinks,
} from '@cctv/calc-core';
import { Badge, Group, Progress, Select, Stack, Text } from '@mantine/core';
import { FieldRow } from '../../../../../components/FieldRow/FieldRow';
import { parseOption } from '../../../../../lib/camera-labels';
import { LINK_LABELS, UPLINK_OFF, UPLINK_OPTIONS } from '../../_lib/bandwidth-labels';
import { describeLinkLoad, describeLinkStatus } from '../../_lib/result-summary';
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
          {describeLinkStatus(check)}
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
  /** The uplink speed to check against, or null for no uplink check. */
  uplinkMbps: NetworkLinks['uplinkMbps'];
  onUplinkChange: (uplinkMbps: NetworkLinks['uplinkMbps']) => void;
}

/**
 * Network checks: the uplink speed to check against, chosen right here, then one row per
 * link checked (the uplink, and the site upload from Remote viewing).
 */
export function LinkChecks({ checks, uplinkMbps, onUplinkChange }: LinkChecksProps) {
  return (
    <section aria-labelledby="network-checks-title" className={classes.networkChecks}>
      <Text component="h3" id="network-checks-title" className={classes.sectionTitle}>
        Network checks
      </Text>
      <FieldRow
        label="Uplink speed"
        help="Speed of the network link that carries all the camera traffic, such as a switch uplink. Checked against the high end of the bandwidth estimate."
        controlId="bandwidth-uplink"
        className={classes.uplinkRow}
      >
        <Select
          id="bandwidth-uplink"
          size="xs"
          data={UPLINK_OPTIONS}
          value={uplinkMbps === null ? UPLINK_OFF : String(uplinkMbps)}
          onChange={(value) => onUplinkChange(parseOption(UPLINK_SPEEDS_MBPS, value) ?? null)}
          allowDeselect={false}
          className={classes.uplinkSelect}
        />
      </FieldRow>
      {checks.length > 0 && (
        <Stack component="ul" gap="sm" mt="sm" className={classes.linkList}>
          {checks.map((check) => (
            <LinkCheckRow key={check.link} check={check} />
          ))}
        </Stack>
      )}
    </section>
  );
}
