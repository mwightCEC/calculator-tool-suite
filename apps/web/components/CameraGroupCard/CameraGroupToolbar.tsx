'use client';

import { IconChevronsDown, IconChevronsUp, IconRestore } from '@tabler/icons-react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';

interface CameraGroupToolbarProps {
  /** What the groups hold, for the Reset label: "camera" or "device". */
  noun: 'camera' | 'device';
  /** Every group is collapsed, so the toggle offers Expand all. */
  allCollapsed: boolean;
  onToggleAll: () => void;
  /** False when the groups are already the single default group. */
  canClear: boolean;
  onClear: () => void;
}

/**
 * Page-level controls for the camera group list, as icon buttons named by their
 * tooltips: Collapse/Expand all and Reset groups, which goes back to the one
 * default group (the "clear" props and actions do the same).
 */
export function CameraGroupToolbar({
  noun,
  allCollapsed,
  onToggleAll,
  canClear,
  onClear,
}: CameraGroupToolbarProps) {
  const ToggleIcon = allCollapsed ? IconChevronsDown : IconChevronsUp;
  const toggleLabel = allCollapsed ? 'Expand all' : 'Collapse all';
  const resetLabel = `Reset ${noun} groups`;
  const clearLabel = canClear ? resetLabel : 'Already the default group';

  return (
    <Group gap="xs" wrap="nowrap">
      <Tooltip label={toggleLabel} withArrow>
        <ActionIcon
          variant="default"
          size="input-sm"
          onClick={onToggleAll}
          aria-label={toggleLabel}
        >
          <ToggleIcon size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={clearLabel} withArrow>
        {/* data-disabled rather than disabled, so the tooltip still shows on hover. */}
        <ActionIcon
          variant="default"
          size="input-sm"
          onClick={canClear ? onClear : undefined}
          data-disabled={!canClear || undefined}
          aria-disabled={!canClear}
          aria-label={resetLabel}
        >
          <IconRestore size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
