'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconMenu2 } from '@tabler/icons-react';
import { ActionIcon, Group, Text, Title } from '@mantine/core';
import { findToolByPath, SUITE_HEADING } from '../../tools/tool-registry';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { HelpButton } from './HelpButton';
import classes from './AppHeader.module.css';

interface AppHeaderProps {
  onOpenMobileNav: () => void;
}

/**
 * Logo, then the page heading: the open tool's title and subtitle, or the suite's.
 * The heading is the page's h1. Narrow screens put it on a second row, without the subtitle.
 */
export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  const heading = findToolByPath(usePathname()) ?? SUITE_HEADING;

  return (
    <div className={classes.bar}>
      <ActionIcon
        variant="chrome"
        size="lg"
        hiddenFrom="sm"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className={classes.menu}
      >
        <IconMenu2 size={20} stroke={1.75} />
      </ActionIcon>

      <Link href="/" className={classes.brand} aria-label="Clinton Electronics Tool Suite home">
        {/* White logo on the blue header (both colour schemes); SVGs are served unoptimized. */}
        <Image
          src="/Clinton_Logo_White.svg"
          alt=""
          width={380}
          height={35}
          priority
          className={classes.logo}
        />
      </Link>

      <span className={classes.divider} aria-hidden="true" />

      <div className={classes.heading}>
        <Title order={1} className={classes.title}>
          {heading.title}
        </Title>
        <Text className={classes.subtitle}>{heading.subtitle}</Text>
      </div>

      <Group gap="xs" wrap="nowrap" className={classes.actions}>
        <HelpButton />
        <ColorSchemeToggle />
      </Group>
    </div>
  );
}
