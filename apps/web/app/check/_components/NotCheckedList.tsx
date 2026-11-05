import { List, Stack, Text, Title } from '@mantine/core';
import { formatNumber } from '../../../lib/format';
import { SKIP_REASON_LABELS, type SkippedLine } from '../_lib/skipped';

/** Cart lines that aren't part of any check, each with the reason. */
export function NotCheckedList({ lines }: { lines: readonly SkippedLine[] }) {
  return (
    <Stack gap="xs">
      <Title order={3} size="h4">
        Not checked
      </Title>
      <List spacing="xs" size="sm">
        {lines.map((line, index) => (
          <List.Item key={`${line.sku}-${index}`}>
            <Text span fw={500} size="sm">
              {line.sku}
              {line.qty !== undefined && ` × ${formatNumber(line.qty, 0)}`}
            </Text>
            {line.name && (
              <Text span size="sm" c="dimmed">
                {' '}
                ({line.name})
              </Text>
            )}
            <Text span size="sm">
              {' — '}
              {SKIP_REASON_LABELS[line.reason]}
            </Text>
          </List.Item>
        ))}
      </List>
    </Stack>
  );
}
