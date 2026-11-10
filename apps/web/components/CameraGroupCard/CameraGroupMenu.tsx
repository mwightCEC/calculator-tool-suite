'use client';

import { IconChevronsDown, IconChevronsUp, IconDots, IconRotate } from '@tabler/icons-react';
import { ActionIcon, Menu } from '@mantine/core';
import classes from './CameraGroupMenu.module.css';

interface CameraGroupMenuProps {
  /** What the groups hold, for the labels: "camera" or "device". */
  noun: 'camera' | 'device';
  /** Every group is collapsed, so the toggle offers Expand all. */
  allCollapsed: boolean;
  onToggleAll: () => void;
  /** False when the groups are already the single default group. */
  canClear: boolean;
  onClear: () => void;
}

/**
 * The "⋯" menu beside the configuration heading: Expand all / Collapse all, then
 * "Clear camera configuration" in red, which removes every group and starts over from the
 * one default group (with Undo). It is disabled while there is nothing to clear.
 */
export function CameraGroupMenu({
  noun,
  allCollapsed,
  onToggleAll,
  canClear,
  onClear,
}: CameraGroupMenuProps) {
  const ToggleIcon = allCollapsed ? IconChevronsDown : IconChevronsUp;
  const groupsLabel = `${noun === 'camera' ? 'Camera' : 'Device'} groups`;

  return (
    <Menu position="bottom-start" shadow="md" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label={`${groupsLabel} options`}>
          <IconDots size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<ToggleIcon size={16} />} onClick={onToggleAll}>
          {allCollapsed ? 'Expand all' : 'Collapse all'}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          className={classes.danger}
          leftSection={<IconRotate size={16} />}
          onClick={onClear}
          disabled={!canClear}
        >
          Clear {noun} configuration
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
