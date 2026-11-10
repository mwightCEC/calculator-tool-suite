'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Group, Paper, Text, Title } from '@mantine/core';
import { MAX_CAMERA_GROUPS } from '../../lib/camera-groups/group-list';
import { formatNumber } from '../../lib/format';
import { CameraGroupMenu } from './CameraGroupMenu';
import type { useGroupExpansion } from './use-group-expansion';
import classes from './CameraConfigurationCard.module.css';

interface CameraConfigurationCardProps {
  /** What the groups hold: "camera" (the default) or "device" (PoE loads aren't all cameras). */
  noun?: 'camera' | 'device';
  groupCount: number;
  /** Cameras (or devices) across every group, for the "32 cameras in 4 groups" line. */
  itemCount: number;
  /** The page's group expansion, so adding and clearing can collapse or expand the cards. */
  expansion: ReturnType<typeof useGroupExpansion>;
  /** Adds a group at the top of the list. */
  onAddGroup: () => void;
  /** False when the groups are already the single default group. */
  canClear: boolean;
  onClear: () => void;
  /** An assumption that applies to every group, shown under the description. */
  assumption?: ReactNode;
  /** The group cards, then any settings that belong with them. */
  children: ReactNode;
}

/** "1 camera", "32 cameras". */
function plural(count: number, noun: string): string {
  return `${formatNumber(count, 0)} ${count === 1 ? noun : `${noun}s`}`;
}

/**
 * The section that holds a calculator's camera groups: heading with the "⋯" menu
 * (Expand / Collapse all, Clear configuration) and Add camera group, then the cards.
 */
export function CameraConfigurationCard({
  noun = 'camera',
  groupCount,
  itemCount,
  expansion,
  onAddGroup,
  canClear,
  onClear,
  assumption,
  children,
}: CameraConfigurationCardProps) {
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const title = noun === 'camera' ? 'Camera configuration' : 'Device configuration';

  return (
    <Paper
      component="section"
      withBorder
      radius="lg"
      className={classes.section}
      aria-labelledby="camera-configuration-title"
    >
      <Group justify="space-between" align="flex-start" gap="sm">
        <div className={classes.heading}>
          <Group gap={4} wrap="nowrap">
            <Title order={2} id="camera-configuration-title" className={classes.title}>
              {title}
            </Title>
            <CameraGroupMenu
              noun={noun}
              allCollapsed={expansion.allCollapsed}
              onToggleAll={expansion.toggleAll}
              canClear={canClear}
              onClear={() => {
                onClear();
                expansion.expandAll();
              }}
            />
          </Group>
          <Text size="sm" className={classes.description}>
            {plural(itemCount, noun)} in {plural(groupCount, 'group')}
          </Text>
          {assumption && (
            <Text size="sm" className={classes.assumption}>
              {assumption}
            </Text>
          )}
        </div>
        <Button
          variant="outline"
          radius="xl"
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            // The new group opens at the top with the others collapsed below it.
            expansion.collapseAll();
            onAddGroup();
          }}
          disabled={atGroupLimit}
        >
          {atGroupLimit ? `Up to ${MAX_CAMERA_GROUPS} ${noun} groups` : `Add ${noun} group`}
        </Button>
      </Group>

      {children}
    </Paper>
  );
}
