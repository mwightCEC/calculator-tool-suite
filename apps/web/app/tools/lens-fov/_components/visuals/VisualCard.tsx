'use client';

import { useId, type ReactNode } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { Collapse, Group, Paper, Text, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Visuals.module.css';

interface VisualCardProps {
  title: string;
  /** What the drawing shows, if it needs saying; hidden with the drawing when the card is closed. */
  description?: string;
  /** A control at the end of the title row, e.g. Camera view's pixel grid switch. */
  action?: ReactNode;
  children: ReactNode;
}

/** A card for one drawing that opens and closes from its title, open to begin with; any `action` sits at the end of the title row. */
export function VisualCard({ title, description, action, children }: VisualCardProps) {
  const [opened, { toggle }] = useDisclosure(true);
  const titleId = useId();
  const bodyId = useId();

  const heading = (
    <Title order={2} className={classes.title} data-with-action={action ? true : undefined}>
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
  );

  return (
    <Paper
      component="section"
      withBorder
      radius="lg"
      className={classes.card}
      aria-labelledby={titleId}
    >
      {action ? (
        <Group justify="space-between" wrap="nowrap" gap="sm">
          {heading}
          {action}
        </Group>
      ) : (
        heading
      )}
      <Collapse expanded={opened} id={bodyId}>
        <div className={classes.cardBody}>
          {description && (
            <Text size="sm" className={classes.description}>
              {description}
            </Text>
          )}
          {children}
        </div>
      </Collapse>
    </Paper>
  );
}
