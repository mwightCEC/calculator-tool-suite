'use client';

import type { ReactNode } from 'react';
import { Group, Text, ThemeIcon, Title } from '@mantine/core';
import { FieldLayoutProvider } from '../FieldRow/FieldRow';
import classes from './SettingsPanel.module.css';

interface SettingsPanelProps {
  icon: ReactNode;
  title: string;
  /** Id of the control the title labels, when the panel holds a single control. */
  titleFor?: string;
  description: string;
  /** A single control beside the title, e.g. the retention stepper. */
  control?: ReactNode;
  /** Fields below the title, laid out with labels above the controls. */
  children?: ReactNode;
}

/**
 * Tinted panel with an icon, title and description, as in the approved prototype.
 * Holds a calculator's always-shown settings below its camera or device groups.
 */
export function SettingsPanel({
  icon,
  title,
  titleFor,
  description,
  control,
  children,
}: SettingsPanelProps) {
  return (
    <section className={classes.panel} aria-label={title}>
      <Group justify="space-between" align="center" gap="md">
        <Group gap="md" wrap="nowrap" align="center" className={classes.heading}>
          <ThemeIcon variant="light" size={40} radius="md">
            {icon}
          </ThemeIcon>
          <div>
            <Title order={3} className={classes.title}>
              {titleFor ? <label htmlFor={titleFor}>{title}</label> : title}
            </Title>
            <Text size="sm" className={classes.description}>
              {description}
            </Text>
          </div>
        </Group>
        {control}
      </Group>
      {children && <FieldLayoutProvider value="stacked">{children}</FieldLayoutProvider>}
    </section>
  );
}
