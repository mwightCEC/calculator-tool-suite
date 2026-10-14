import type { Metadata } from 'next';
import { Stack, Text, Title } from '@mantine/core';

export const metadata: Metadata = {
  title: 'Storage',
};

// Placeholder route so navigation works. The calculator UI arrives in Milestone 4.
export default function StoragePage() {
  return (
    <Stack gap="xs">
      <Title order={1}>Storage calculator</Title>
      <Text c="dimmed">HDD storage and recording-retention calculator.</Text>
    </Stack>
  );
}
