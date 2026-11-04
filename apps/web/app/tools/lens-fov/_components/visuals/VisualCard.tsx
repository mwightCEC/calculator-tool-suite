'use client';

import { useId, type ReactNode } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { Collapse, Paper, Text, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Visuals.module.css';

interface VisualCardProps {
  title: string;
  /** What the drawing shows; hidden with the drawing when the card is closed. */
  description: string;
  children: ReactNode;
}

/** A card for one drawing that opens and closes from its title, open to begin with. */
export function VisualCard({ title, description, children }: VisualCardProps) {
  const [opened, { toggle }] = useDisclosure(true);
  const titleId = useId();
  const bodyId = useId();

  return (
    <Paper
      component="section"
      withBorder
      radius="lg"
      className={classes.card}
      aria-labelledby={titleId}
    >
      <Title order={2} className={classes.title}>
        <UnstyledButton
          id={titleId}
          className={classes.cardToggle}
          onClick={toggle}
          aria-expanded={opened}
          aria-controls={bodyId}
        >
          <IconChevronRight
            size={18}
            stroke={2.25}
            className={classes.chevron}
            data-opened={opened || undefined}
            aria-hidden="true"
          />
          {title}
        </UnstyledButton>
      </Title>
      <Collapse expanded={opened} id={bodyId}>
        <div className={classes.cardBody}>
          <Text size="sm" className={classes.description}>
            {description}
          </Text>
          {children}
        </div>
      </Collapse>
    </Paper>
  );
}
