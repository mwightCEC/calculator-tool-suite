'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { Anchor, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { TOOLS } from '../../../tools/tool-registry';
import { BandwidthHowCalculated } from './BandwidthHowCalculated';
import { LensFovHowCalculated } from './LensFovHowCalculated';
import { PoeBudgetHowCalculated } from './PoeBudgetHowCalculated';
import { StorageHowCalculated } from './StorageHowCalculated';
import { VoltageDropHowCalculated } from './VoltageDropHowCalculated';
import classes from './FaqPage.module.css';

/** Each calculator's method section, by its tool registry id (also the section's anchor). */
const METHOD_SECTIONS: Record<string, ComponentType> = {
  storage: StorageHowCalculated,
  bandwidth: BandwidthHowCalculated,
  'poe-budget': PoeBudgetHowCalculated,
  'voltage-drop': VoltageDropHowCalculated,
  'lens-fov': LensFovHowCalculated,
};

/**
 * How each calculator works and what it assumes, one section per calculator in the
 * sidebar's order. The results cards link here with /faq#<tool id>.
 */
export function FaqPage() {
  return (
    <Stack gap="lg" className={classes.page}>
      <div>
        <Title order={2} className={classes.pageTitle}>
          How estimates are calculated
        </Title>
        <Text className={classes.intro}>
          Results are planning estimates: check them against manufacturer specifications.
        </Text>
      </div>

      {TOOLS.map((tool) => {
        const Method = METHOD_SECTIONS[tool.id];
        if (!Method) {
          return null;
        }
        const ToolIcon = tool.icon;
        const titleId = `${tool.id}-title`;
        return (
          <Paper
            key={tool.id}
            component="section"
            id={tool.id}
            aria-labelledby={titleId}
            withBorder
            radius="lg"
            className={classes.section}
          >
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="light" size={36} radius="md">
                <ToolIcon size={20} stroke={1.75} />
              </ThemeIcon>
              <Title order={3} id={titleId} className={classes.title}>
                {tool.name}
              </Title>
            </Group>
            <Method />
            <Anchor component={Link} href={tool.route} className={classes.toolLink}>
              Open the {tool.title}
              <IconArrowRight size={14} stroke={2.25} aria-hidden="true" />
            </Anchor>
          </Paper>
        );
      })}
    </Stack>
  );
}
