'use client';

import type { ReactNode } from 'react';
import { Group, Switch } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import classes from './SegmentBar.module.css';

/** A breakdown's "Simplified" choice, remembered per browser under its own key. */
export function useSimplifiedBreakdown(storageKey: string) {
  return useLocalStorage({ key: storageKey, defaultValue: false });
}

interface SegmentBarHeaderProps {
  /** Left of the switch, e.g. "Based on 14 TB raw capacity" or a section title. */
  caption?: ReactNode;
  /** With one group there is nothing to combine, so the switch is hidden. */
  showSwitch: boolean;
  simplified: boolean;
  onSimplifiedChange: (simplified: boolean) => void;
}

/** The row above a breakdown bar: a caption, and the Simplified switch with several groups. */
export function SegmentBarHeader({
  caption,
  showSwitch,
  simplified,
  onSimplifiedChange,
}: SegmentBarHeaderProps) {
  if (!caption && !showSwitch) {
    return null;
  }
  return (
    <Group justify="space-between" align="center" wrap="nowrap" gap="sm" className={classes.header}>
      <div className={classes.caption}>{caption}</div>
      {showSwitch && (
        <Switch
          size="xs"
          label="Simplified"
          checked={simplified}
          onChange={(event) => onSimplifiedChange(event.currentTarget.checked)}
          classNames={{ label: classes.switchLabel }}
        />
      )}
    </Group>
  );
}
