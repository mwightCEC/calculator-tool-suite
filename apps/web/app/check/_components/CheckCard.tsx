import Link from 'next/link';
import { IconArrowRight, type Icon } from '@tabler/icons-react';
import { Button, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface CheckCardProps {
  icon: Icon;
  title: string;
  details: readonly string[];
  /** The calculator, pre-filled through its share link. */
  href: string;
  buttonLabel: string;
}

/** One check from the cart, with a button that opens it pre-filled in its calculator. */
export function CheckCard({ icon: CheckIcon, title, details, href, buttonLabel }: CheckCardProps) {
  return (
    <Card withBorder padding="lg">
      <Group align="flex-start" wrap="nowrap" gap="md">
        <ThemeIcon size="lg" variant="light" color="brand">
          <CheckIcon size={20} stroke={1.75} />
        </ThemeIcon>
        <Stack gap="xs">
          <Title order={3} size="h4">
            {title}
          </Title>
          {details.map((line) => (
            <Text key={line} size="sm">
              {line}
            </Text>
          ))}
          <Button
            component={Link}
            href={href}
            rightSection={<IconArrowRight size={16} />}
            w="fit-content"
            mt="xs"
          >
            {buttonLabel}
          </Button>
        </Stack>
      </Group>
    </Card>
  );
}
