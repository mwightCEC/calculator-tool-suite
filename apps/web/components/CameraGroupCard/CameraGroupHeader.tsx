'use client';

import { IconChevronDown, IconCopy, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Badge, Group, Text, Tooltip } from '@mantine/core';
import { GroupNameInput } from './GroupNameInput';
import classes from './CameraGroupCard.module.css';

/** Singular and plural for a group's count badge, e.g. camera / cameras. */
export interface CountNoun {
  one: string;
  other: string;
}

const CAMERAS: CountNoun = { one: 'camera', other: 'cameras' };

interface CameraGroupHeaderProps {
  name: string;
  cameraCount: number;
  countNoun?: CountNoun;
  /** One-line description under the name, shown in place of the count badge. */
  subtitle?: string;
  expanded: boolean;
  bodyId: string;
  canDuplicate: boolean;
  canDelete: boolean;
  onToggleExpanded: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CameraGroupHeader({
  name,
  cameraCount,
  countNoun = CAMERAS,
  subtitle,
  expanded,
  bodyId,
  canDuplicate,
  canDelete,
  onToggleExpanded,
  onRename,
  onDuplicate,
  onDelete,
}: CameraGroupHeaderProps) {
  return (
    <Group gap="xs" wrap="nowrap" className={classes.header}>
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-controls={bodyId}
        aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
      >
        <IconChevronDown
          size={18}
          className={classes.chevron}
          data-expanded={expanded || undefined}
        />
      </ActionIcon>
      <span className={classes.dot} aria-hidden="true" />
      {subtitle ? (
        <div className={classes.headerText}>
          <GroupNameInput value={name} onChange={onRename} />
          <Text size="xs" className={classes.subtitle}>
            {subtitle}
          </Text>
        </div>
      ) : (
        <>
          <GroupNameInput value={name} onChange={onRename} />
          <Badge className={classes.countBadge} radius="sm" variant="filled">
            {cameraCount} {cameraCount === 1 ? countNoun.one : countNoun.other}
          </Badge>
        </>
      )}

      <Group gap={4} wrap="nowrap" className={classes.headerActions}>
        <Tooltip label="Duplicate group" withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onDuplicate}
            disabled={!canDuplicate}
            aria-label={`Duplicate ${name}`}
          >
            <IconCopy size={18} stroke={1.75} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={canDelete ? 'Delete group' : 'At least one group is required'} withArrow>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={onDelete}
            disabled={!canDelete}
            aria-label={`Delete ${name}`}
          >
            <IconTrash size={18} stroke={1.75} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
