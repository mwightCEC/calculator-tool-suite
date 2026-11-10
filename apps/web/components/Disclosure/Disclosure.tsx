'use client';

import { useId, type ReactNode } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { Collapse, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Disclosure.module.css';

interface DisclosureProps {
  title: string;
  /** Muted text after the title, e.g. what the section holds. */
  hint?: string;
  defaultOpened?: boolean;
  /** False when the section is a card's only content, so no rule is drawn above it. */
  divider?: boolean;
  children: ReactNode;
}

/** A section below a divider that opens and closes from its title. */
export function Disclosure({
  title,
  hint,
  defaultOpened = false,
  divider = true,
  children,
}: DisclosureProps) {
  const [opened, { toggle }] = useDisclosure(defaultOpened);
  const bodyId = useId();

  return (
    <div className={classes.root} data-divider={divider || undefined}>
      <UnstyledButton
        className={classes.toggle}
        onClick={toggle}
        aria-expanded={opened}
        aria-controls={bodyId}
      >
        <IconChevronRight
          size={14}
          stroke={2.25}
          className={classes.chevron}
          data-opened={opened || undefined}
          aria-hidden="true"
        />
        <Text component="span" className={classes.title}>
          {title}
        </Text>
        {hint && (
          <Text component="span" className={classes.hint}>
            {hint}
          </Text>
        )}
      </UnstyledButton>
      <Collapse expanded={opened} id={bodyId}>
        <div className={classes.body}>{children}</div>
      </Collapse>
    </div>
  );
}
