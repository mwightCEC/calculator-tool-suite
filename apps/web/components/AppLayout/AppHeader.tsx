'use client';

import Link from 'next/link';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMenu2,
} from '@tabler/icons-react';
import { ActionIcon, Group } from '@mantine/core';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { HelpButton } from './HelpButton';
import classes from './AppHeader.module.css';

interface AppHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

export function AppHeader({ sidebarCollapsed, onToggleSidebar, onOpenMobileNav }: AppHeaderProps) {
  const SidebarIcon = sidebarCollapsed
    ? IconLayoutSidebarLeftExpand
    : IconLayoutSidebarLeftCollapse;

  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <ActionIcon
          variant="chrome"
          size="lg"
          visibleFrom="sm"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <SidebarIcon size={20} stroke={1.75} />
        </ActionIcon>
        <ActionIcon
          variant="chrome"
          size="lg"
          hiddenFrom="sm"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <IconMenu2 size={20} stroke={1.75} />
        </ActionIcon>

        <Link href="/" className={classes.brand}>
          Clinton Tool Suite
        </Link>
      </Group>

      <Group gap="xs" wrap="nowrap">
        <HelpButton />
        <ColorSchemeToggle />
      </Group>
    </Group>
  );
}
