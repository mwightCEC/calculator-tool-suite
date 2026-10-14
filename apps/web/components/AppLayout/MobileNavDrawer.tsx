'use client';

import { IconX } from '@tabler/icons-react';
import { ActionIcon, Drawer, Group } from '@mantine/core';
import { LogoMark } from './LogoMark';
import { SidebarNav } from './SidebarNav';
import classes from './MobileNavDrawer.module.css';

interface MobileNavDrawerProps {
  opened: boolean;
  onClose: () => void;
}

/** Slide-out navigation for viewports below the sm breakpoint. */
export function MobileNavDrawer({ opened, onClose }: MobileNavDrawerProps) {
  return (
    <Drawer.Root opened={opened} onClose={onClose} size={260}>
      <Drawer.Overlay />
      <Drawer.Content className={classes.content}>
        <Drawer.Header className={classes.header}>
          <Drawer.Title>
            <Group gap="xs" wrap="nowrap" className={classes.title}>
              <LogoMark />
              CCTV tool suite
            </Group>
          </Drawer.Title>
          <ActionIcon variant="chrome" size="lg" onClick={onClose} aria-label="Close navigation">
            <IconX size={20} stroke={1.75} />
          </ActionIcon>
        </Drawer.Header>
        <Drawer.Body className={classes.body}>
          <SidebarNav collapsed={false} onNavigate={onClose} />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
