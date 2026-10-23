'use client';

import { IconChevronsDown, IconChevronsUp, IconTrash } from '@tabler/icons-react';
import { Button, Group } from '@mantine/core';

interface CameraGroupToolbarProps {
  /** Every group is collapsed, so the toggle offers Expand all. */
  allCollapsed: boolean;
  onToggleAll: () => void;
  /** False when the groups are already the single default group. */
  canClear: boolean;
  onClear: () => void;
}

/** Page-level controls for the camera group list: Collapse/Expand all and Clear all. */
export function CameraGroupToolbar({
  allCollapsed,
  onToggleAll,
  canClear,
  onClear,
}: CameraGroupToolbarProps) {
  const ToggleIcon = allCollapsed ? IconChevronsDown : IconChevronsUp;

  return (
    <Group gap="xs" justify="flex-end">
      <Button
        variant="default"
        size="xs"
        leftSection={<ToggleIcon size={16} />}
        onClick={onToggleAll}
      >
        {allCollapsed ? 'Expand all' : 'Collapse all'}
      </Button>
      <Button
        variant="default"
        size="xs"
        leftSection={<IconTrash size={16} />}
        onClick={onClear}
        disabled={!canClear}
      >
        Clear all
      </Button>
    </Group>
  );
}
