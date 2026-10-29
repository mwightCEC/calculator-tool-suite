'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconChevronRight,
  IconLayoutGrid,
  IconLayoutSidebarLeftCollapse,
  type Icon,
} from '@tabler/icons-react';
import { ActionIcon, Badge, Divider, NavLink, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { TOOLS } from '../../tools/tool-registry';
import classes from './SidebarNav.module.css';

interface SidebarNavProps {
  /** Icon-only rail with tooltips instead of icons and labels. */
  collapsed: boolean;
  /** Called after a navigation item is chosen (used to close the mobile drawer). */
  onNavigate?: () => void;
  /**
   * Collapses or expands the desktop sidebar: a button beside All tools while expanded,
   * a tab on the rail's edge while collapsed. The mobile drawer omits it.
   */
  onToggleCollapsed?: () => void;
}

export function SidebarNav({ collapsed, onNavigate, onToggleCollapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Tools" className={classes.nav} data-collapsed={collapsed || undefined}>
      <div className={classes.topRow}>
        <SidebarItem
          label="All tools"
          icon={IconLayoutGrid}
          href="/"
          active={pathname === '/'}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {onToggleCollapsed && !collapsed && (
          <Tooltip label="Collapse sidebar" position="right" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={onToggleCollapsed}
              aria-label="Collapse sidebar"
              aria-expanded
              className={classes.collapseButton}
            >
              <IconLayoutSidebarLeftCollapse size={20} stroke={1.75} />
            </ActionIcon>
          </Tooltip>
        )}
      </div>

      {onToggleCollapsed && collapsed && (
        <Tooltip label="Expand sidebar" position="right" withArrow>
          <UnstyledButton
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            aria-expanded={false}
            className={classes.expandTab}
          >
            <IconChevronRight size={14} stroke={2.25} />
          </UnstyledButton>
        </Tooltip>
      )}

      {collapsed ? (
        <Divider className={classes.sectionDivider} />
      ) : (
        <Text className={classes.sectionLabel}>Calculators</Text>
      )}

      {TOOLS.map((tool) => (
        <SidebarItem
          key={tool.id}
          label={tool.name}
          icon={tool.icon}
          href={tool.status === 'available' ? tool.route : undefined}
          active={pathname.startsWith(tool.route)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

interface SidebarItemProps {
  label: string;
  icon: Icon;
  /** Omitted for tools that are not built yet; the item renders disabled. */
  href: string | undefined;
  active: boolean;
  collapsed: boolean;
  onNavigate: (() => void) | undefined;
}

function SidebarItem({
  label,
  icon: ItemIcon,
  href,
  active,
  collapsed,
  onNavigate,
}: SidebarItemProps) {
  const comingSoon = href === undefined;
  const navLinkClassNames = {
    root: classes.link,
    section: classes.section,
    body: classes.body,
    label: classes.label,
  };
  const iconSection = <ItemIcon size={20} stroke={1.75} />;
  const soonBadge =
    comingSoon && !collapsed ? (
      <Badge color="amber" size="xs" radius="sm">
        soon
      </Badge>
    ) : undefined;

  const item = comingSoon ? (
    <NavLink
      // No href: the tool is not built yet, so this is not a navigable link.
      label={collapsed ? undefined : label}
      aria-label={collapsed ? `${label} (coming soon)` : undefined}
      aria-disabled
      disabled
      leftSection={iconSection}
      rightSection={soonBadge}
      classNames={navLinkClassNames}
    />
  ) : (
    <NavLink
      component={Link}
      href={href}
      label={collapsed ? undefined : label}
      aria-label={collapsed ? label : undefined}
      active={active}
      aria-current={active ? 'page' : undefined}
      variant="filled"
      leftSection={iconSection}
      onClick={onNavigate}
      classNames={navLinkClassNames}
    />
  );

  return (
    <Tooltip
      label={comingSoon ? `${label} — coming soon` : label}
      position="right"
      withArrow
      disabled={!collapsed}
    >
      {item}
    </Tooltip>
  );
}
