import Link from 'next/link';
import { IconArrowRight, IconBolt } from '@tabler/icons-react';
import { Button, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  voltageDropCheckDetails,
  voltageDropCheckHref,
  voltageDropCheckTitle,
} from '../_lib/check-labels';
import type { VoltageDropCheck } from '../_lib/voltage-drop-checks';

/** One Voltage drop check from the cart, with a button that opens it pre-filled. */
export function VoltageDropCheckCard({ check }: { check: VoltageDropCheck }) {
  return (
    <Card withBorder padding="lg">
      <Group align="flex-start" wrap="nowrap" gap="md">
        <ThemeIcon size="lg" variant="light" color="brand">
          <IconBolt size={20} stroke={1.75} />
        </ThemeIcon>
        <Stack gap="xs">
          <Title order={3} size="h4">
            {voltageDropCheckTitle(check)}
          </Title>
          {voltageDropCheckDetails(check).map((line) => (
            <Text key={line} size="sm">
              {line}
            </Text>
          ))}
          <Button
            component={Link}
            href={voltageDropCheckHref(check)}
            rightSection={<IconArrowRight size={16} />}
            w="fit-content"
            mt="xs"
          >
            Open voltage drop check
          </Button>
        </Stack>
      </Group>
    </Card>
  );
}
