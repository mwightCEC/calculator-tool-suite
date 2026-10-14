import { Stack, Text, Title } from '@mantine/core';
import { ToolGrid } from './_components/ToolGrid';

export default function HomePage() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>All tools</Title>
        <Text c="dimmed">Calculators for CCTV installers and system designers.</Text>
      </div>
      <ToolGrid />
    </Stack>
  );
}
