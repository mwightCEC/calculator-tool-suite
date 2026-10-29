'use client';

import type { StorageCalculationResult } from '@cctv/calc-core';
import { IconInfoCircle, IconServer2 } from '@tabler/icons-react';
import { ActionIcon, Group, Popover, Text, ThemeIcon } from '@mantine/core';
import { describeDriveCount, describeRaid } from '../../_lib/result-summary';
import classes from './ResultsCard.module.css';

const HELP = {
  'storage-needed': {
    label: 'Required drives',
    text: 'The fewest drives of the selected size that hold the required storage, after RAID redundancy and the reserve. When bitrates are estimated, the drives are sized for the high end of the likely range so footage isn’t lost early.',
  },
  'days-from-capacity': {
    label: 'Drives',
    text: 'The drives you entered, rounded up to a valid count for the RAID level if needed. Retention is estimated from their usable capacity after RAID redundancy and the reserve.',
  },
} as const;

/** Drive count and RAID level, with an explanation of how the drives were chosen. */
export function DrivesSummary({ result }: { result: StorageCalculationResult }) {
  const help = HELP[result.mode];
  const sizedForHigh = result.mode === 'storage-needed' && result.isEstimated;

  return (
    <Group gap="sm" align="flex-start" wrap="nowrap" className={classes.drivesBox}>
      <ThemeIcon variant="light" size={36} radius="xl">
        <IconServer2 size={18} stroke={1.75} />
      </ThemeIcon>
      <div>
        <Group gap={2} align="center" wrap="nowrap">
          <Text className={classes.drivesValue}>
            {help.label}: {describeDriveCount(result)}
          </Text>
          <Popover width={280} position="bottom-start" withArrow shadow="md">
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={`About ${help.label.toLowerCase()}`}
                className={classes.infoButton}
              >
                <IconInfoCircle size={16} stroke={1.75} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm">{help.text}</Text>
            </Popover.Dropdown>
          </Popover>
        </Group>
        <Text className={classes.drivesDetail}>
          {describeRaid(result)}
          {sizedForHigh && ' · sized for the high estimate'}
        </Text>
      </div>
    </Group>
  );
}
