'use client';

import Link from 'next/link';
import { Badge, Card, Group, SimpleGrid, Text, ThemeIcon, Title } from '@mantine/core';
import { TOOLS, type ToolDefinition } from '../../tools/tool-registry';
import classes from './ToolGrid.module.css';

/**
 * Home page grid of every tool in the registry.
 * Client component: Card's polymorphic `component={Link}` and the registry's
 * icon components are functions, which can't cross the server/client boundary.
 */
export function ToolGrid() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {TOOLS.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </SimpleGrid>
  );
}

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const comingSoon = tool.status === 'coming-soon';
  const ToolIcon = tool.icon;

  const content = (
    <>
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
        <ThemeIcon size="xl" variant="light" color={comingSoon ? 'gray' : 'brand'}>
          <ToolIcon size={24} stroke={1.75} />
        </ThemeIcon>
        {comingSoon && (
          <Badge color="amber" size="sm" radius="sm">
            Coming soon
          </Badge>
        )}
      </Group>
      <Title order={2} className={classes.name}>
        {tool.name}
      </Title>
      <Text size="sm" c="dimmed">
        {tool.description}
      </Text>
    </>
  );

  if (comingSoon) {
    return (
      <Card withBorder padding="lg" className={classes.card} data-coming-soon>
        {content}
      </Card>
    );
  }

  return (
    <Card withBorder padding="lg" component={Link} href={tool.route} className={classes.card}>
      {content}
    </Card>
  );
}
