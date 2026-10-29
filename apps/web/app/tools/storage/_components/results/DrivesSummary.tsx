'use client';

import type { StorageCalculationResult } from '@cctv/calc-core';
import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconMinus,
  IconServer2,
  IconShieldCheck,
} from '@tabler/icons-react';
import { ActionIcon, Group, List, Popover, Stack, Text, ThemeIcon } from '@mantine/core';
import { describeDriveArray } from '../../_lib/drive-array';
import classes from './ResultsCard.module.css';

const HELP = {
  'storage-needed':
    'The fewest drives of the selected size that hold the required storage, after RAID redundancy and the reserve. When bitrates are estimated, the drives are sized for the high end of the likely range so footage isn’t lost early.',
  'days-from-capacity':
    'The drives you entered, rounded up to a valid count for the RAID level if needed. Retention is estimated from their usable capacity after RAID redundancy and the reserve.',
} as const;

/**
 * The recommended (or entered) drives: RAID level, one tile per drive and the
 * level's trade-offs, as in the approved prototype.
 */
export function DrivesSummary({ result }: { result: StorageCalculationResult }) {
  const summary = describeDriveArray(result);
  const hiddenDrives = summary.driveCount - summary.tilesShown;

  return (
    <Stack
      gap="md"
      component="section"
      aria-labelledby="drive-array-title"
      className={classes.drivesBox}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon
          variant="light"
          color={summary.faultTolerant ? 'brand' : 'orange'}
          size={36}
          radius="md"
        >
          {summary.faultTolerant ? (
            <IconShieldCheck size={20} stroke={1.75} />
          ) : (
            <IconAlertTriangle size={20} stroke={1.75} />
          )}
        </ThemeIcon>
        <div>
          <Group gap={2} wrap="nowrap">
            <Text component="h3" id="drive-array-title" className={classes.drivesValue}>
              {summary.title}
            </Text>
            <Popover width={280} position="bottom-start" withArrow shadow="md">
              <Popover.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="About these drives"
                  className={classes.infoButton}
                >
                  <IconInfoCircle size={16} stroke={1.75} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Text size="sm">{HELP[result.mode]}</Text>
              </Popover.Dropdown>
            </Popover>
          </Group>
          <Text className={classes.drivesDetail}>{summary.description}</Text>
        </div>
      </Group>

      <Group
        gap="xs"
        role="img"
        aria-label={`${summary.driveCount} drives of ${summary.driveSizeTb} TB`}
      >
        {Array.from({ length: summary.tilesShown }, (_, index) => (
          <Stack key={index} gap={2} align="center" className={classes.driveTile}>
            <ThemeIcon variant="light" size={40} radius="xl">
              <IconServer2 size={18} stroke={1.75} />
            </ThemeIcon>
            <Text size="xs">Drive {index + 1}</Text>
            <Text size="xs" className={classes.drivesDetail}>
              {summary.driveSizeTb} TB
            </Text>
          </Stack>
        ))}
        {hiddenDrives > 0 && (
          <Text size="sm" className={classes.drivesDetail}>
            +{hiddenDrives} more
          </Text>
        )}
      </Group>

      <List size="sm" spacing={4}>
        {summary.tradeoffs.map((tradeoff) => (
          <List.Item
            key={tradeoff.text}
            icon={
              <ThemeIcon
                size={18}
                radius="xl"
                variant="light"
                color={tradeoff.benefit ? 'teal' : 'orange'}
                role="img"
                aria-label={tradeoff.benefit ? 'Benefit' : 'Drawback'}
              >
                {tradeoff.benefit ? <IconCheck size={12} /> : <IconMinus size={12} />}
              </ThemeIcon>
            }
          >
            {tradeoff.text}
          </List.Item>
        ))}
      </List>
    </Stack>
  );
}
