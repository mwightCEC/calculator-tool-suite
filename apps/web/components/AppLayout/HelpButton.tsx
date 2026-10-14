'use client';

import { IconHelp } from '@tabler/icons-react';
import { ActionIcon, Popover, Stack, Text } from '@mantine/core';

export function HelpButton() {
  return (
    <Popover width={280} position="bottom-end" shadow="md" withArrow>
      <Popover.Target>
        <ActionIcon variant="chrome" size="lg" aria-label="Help">
          <IconHelp size={20} stroke={1.75} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            About these tools
          </Text>
          <Text size="sm">
            Calculators for CCTV installers and system designers. Results are planning estimates;
            confirm against manufacturer specifications.
          </Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
