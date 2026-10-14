'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AppShell, em } from '@mantine/core';
import { useDisclosure, useLocalStorage, useMediaQuery } from '@mantine/hooks';
import { AppHeader } from './AppHeader';
import { MobileNavDrawer } from './MobileNavDrawer';
import { SidebarNav } from './SidebarNav';
import classes from './AppLayout.module.css';

const HEADER_HEIGHT = 56;
const NAVBAR_WIDTH_EXPANDED = 240;
const NAVBAR_WIDTH_COLLAPSED = 64;
/** Matches theme.breakpoints.sm, where the sidebar switches to a mobile drawer. */
const DESKTOP_MEDIA_QUERY = `(min-width: ${em(768)})`;
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'cctv-tool-suite:sidebar-collapsed';

export function AppLayout({ children }: { children: ReactNode }) {
  const [drawerOpened, drawer] = useDisclosure(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage({
    key: SIDEBAR_COLLAPSED_STORAGE_KEY,
    defaultValue: false,
  });
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  // Only user toggles animate; the saved state (applied after hydration) snaps into place.
  const [sidebarAnimated, setSidebarAnimated] = useState(false);

  const toggleSidebar = () => {
    setSidebarAnimated(true);
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  // The drawer is mobile-only; close it if the viewport grows past the breakpoint.
  useEffect(() => {
    if (isDesktop) {
      drawer.close();
    }
  }, [isDesktop, drawer]);

  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      navbar={{
        // Collapsing narrows the navbar into an icon rail rather than hiding it.
        width: sidebarCollapsed ? NAVBAR_WIDTH_COLLAPSED : NAVBAR_WIDTH_EXPANDED,
        breakpoint: 'sm',
        // Below the breakpoint, navigation lives in MobileNavDrawer instead.
        collapsed: { mobile: true },
      }}
      padding="md"
      mod={{ 'sidebar-animated': sidebarAnimated }}
      classNames={{
        root: classes.root,
        header: classes.header,
        navbar: classes.navbar,
        main: classes.main,
      }}
    >
      <AppShell.Header>
        <AppHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenMobileNav={drawer.open}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <SidebarNav collapsed={sidebarCollapsed} />
      </AppShell.Navbar>

      <MobileNavDrawer opened={drawerOpened} onClose={drawer.close} />

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
