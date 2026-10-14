'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import classes from './ColorSchemeToggle.module.css';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <ActionIcon
      variant="chrome"
      size="lg"
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle color scheme"
    >
      {/* Both icons render; CSS shows the right one so server and client markup match. */}
      <IconMoon className={classes.moon} size={20} stroke={1.75} />
      <IconSun className={classes.sun} size={20} stroke={1.75} />
    </ActionIcon>
  );
}
