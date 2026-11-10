'use client';

import Link from 'next/link';
import { IconHelp, IconHelpCircle, IconRotate } from '@tabler/icons-react';
import { ActionIcon, Menu } from '@mantine/core';
import { clearAllCalculators } from '../../lib/share/clear-all-calculators';
import { FAQ_PAGE } from '../../tools/tool-registry';
import { notifyWithUndo } from '../CameraGroupCard/undo-notifications';
import classes from './HelpButton.module.css';

/**
 * The header's help menu: the FAQ page, then "Clear all calculators" in red, which forgets
 * every calculator's saved inputs and resets the open one (with Undo).
 */
export function HelpButton() {
  const clearAll = () => {
    const undo = clearAllCalculators();
    notifyWithUndo('calculators-cleared', 'Cleared all calculators', undo);
  };

  return (
    <Menu position="bottom-end" shadow="md" withinPortal>
      <Menu.Target>
        <ActionIcon variant="chrome" size="lg" aria-label="Help">
          <IconHelp size={20} stroke={1.75} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          component={Link}
          href={FAQ_PAGE.route}
          leftSection={<IconHelpCircle size={16} />}
        >
          {FAQ_PAGE.title}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          className={classes.danger}
          leftSection={<IconRotate size={16} />}
          onClick={clearAll}
        >
          Clear all calculators
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
