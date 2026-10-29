'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Group, Paper, Text, Title } from '@mantine/core';
import { MAX_CAMERA_GROUPS } from '../../lib/camera-groups/group-list';
import { CameraGroupToolbar } from './CameraGroupToolbar';
import type { useGroupExpansion } from './use-group-expansion';
import classes from './CameraConfigurationCard.module.css';

interface CameraConfigurationCardProps {
  groupCount: number;
  /** The page's group expansion, so adding and clearing can collapse or expand the cards. */
  expansion: ReturnType<typeof useGroupExpansion>;
  /** Adds a group at the top of the list. */
  onAddGroup: () => void;
  /** False when the groups are already the single default group. */
  canClear: boolean;
  onClear: () => void;
  /** The group cards, then any settings that belong with them. */
  children: ReactNode;
}

/**
 * The section that holds a calculator's camera groups: heading, Add camera group,
 * Collapse all / Clear all, then the cards.
 */
export function CameraConfigurationCard({
  groupCount,
  expansion,
  onAddGroup,
  canClear,
  onClear,
  children,
}: CameraConfigurationCardProps) {
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;

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
          <Title order={2} id="camera-configuration-title" className={classes.title}>
            Camera configuration
          </Title>
          <Text size="sm" className={classes.description}>
            Add one or more camera groups. Each group can have different settings.
          </Text>
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
          {atGroupLimit ? `Up to ${MAX_CAMERA_GROUPS} camera groups` : 'Add camera group'}
        </Button>
      </Group>

      <CameraGroupToolbar
        allCollapsed={expansion.allCollapsed}
        onToggleAll={expansion.toggleAll}
        canClear={canClear}
        onClear={() => {
          onClear();
          expansion.expandAll();
        }}
      />

      {children}
    </Paper>
  );
}
