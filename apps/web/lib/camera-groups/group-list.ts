import { MAX_GROUP_NAME_LENGTH } from '@cctv/calc-core';
import { z } from 'zod';
import { groupColors } from '../../theme/palettes';
import { pickColorForInsert, repairGroupColors } from './group-colors';

/*
 * Camera group list operations shared by the calculators' reducers. Each works
 * on any group type with an id, name and colour, keeps the colour rule from
 * group-colors.ts, and returns the same array when nothing changes so reducers
 * can return their previous state.
 */

export const MAX_CAMERA_GROUPS = 20;

export interface ListedGroup {
  id: string;
  name: string;
  /** Index into the theme's group colours. */
  colorIndex: number;
}

/** Index into the theme's group colours; assigned when a group is created. */
export const colorIndexSchema = z
  .int()
  .min(0)
  .max(groupColors.length - 1);

/** A calculator's group list: 1 to MAX_CAMERA_GROUPS groups with unique ids. */
export function groupListSchema<T extends z.ZodType<{ id: string }>>(group: T) {
  return z
    .array(group)
    .min(1)
    .max(MAX_CAMERA_GROUPS)
    .refine((groups) => new Set(groups.map((item) => item.id)).size === groups.length, {
      message: 'Camera group ids must be unique',
    });
}

/** Next unused numeric id, e.g. 4 after g1–g3. Short ids keep shared links compact. */
function nextGroupNumber(groups: readonly ListedGroup[]): number {
  const numbers = groups.map((group) => Number(group.id.replace(/^g/, '')) || 0);
  return Math.max(0, ...numbers) + 1;
}

/**
 * Adds a new group at the end (default) or the start of the list, coloured to
 * differ from its neighbour.
 */
export function addGroup<T extends ListedGroup>(
  groups: T[],
  create: (fields: ListedGroup) => T,
  position: 'start' | 'end' = 'end'
): T[] {
  if (groups.length >= MAX_CAMERA_GROUPS) {
    return groups;
  }
  const number = nextGroupNumber(groups);
  const index = position === 'start' ? 0 : groups.length;
  const group = create({
    id: `g${number}`,
    name: `Camera group ${number}`,
    colorIndex: pickColorForInsert(groups, index),
  });
  return groups.toSpliced(index, 0, group);
}

/** Inserts a copy after its source, coloured to differ from both neighbours. */
export function duplicateGroup<T extends ListedGroup>(groups: T[], id: string): T[] {
  const index = groups.findIndex((group) => group.id === id);
  const source = groups[index];
  if (!source || groups.length >= MAX_CAMERA_GROUPS) {
    return groups;
  }
  const copy: T = {
    ...source,
    id: `g${nextGroupNumber(groups)}`,
    name: `${source.name} copy`.slice(0, MAX_GROUP_NAME_LENGTH),
    colorIndex: pickColorForInsert(groups, index + 1),
  };
  return groups.toSpliced(index + 1, 0, copy);
}

/** Removes a group, never the last one. */
export function removeGroup<T extends ListedGroup>(groups: T[], id: string): T[] {
  if (groups.length <= 1 || !groups.some((group) => group.id === id)) {
    return groups;
  }
  // Removing a group can bring two same-coloured groups together.
  return repairGroupColors(groups.filter((group) => group.id !== id));
}

/**
 * Puts a removed group back at `index` (Undo) with its own colour, unless that
 * would now clash with a neighbour.
 */
export function restoreGroup<T extends ListedGroup>(groups: T[], group: T, index: number): T[] {
  const alreadyPresent = groups.some((existing) => existing.id === group.id);
  if (alreadyPresent || groups.length >= MAX_CAMERA_GROUPS) {
    return groups;
  }
  const at = Math.min(index, groups.length);
  const clashes =
    groups[at - 1]?.colorIndex === group.colorIndex || groups[at]?.colorIndex === group.colorIndex;
  const restored = clashes ? { ...group, colorIndex: pickColorForInsert(groups, at) } : group;
  return groups.toSpliced(at, 0, restored);
}

/** Replaces the group with `id` by `update(group)`; other groups keep their identity. */
export function updateGroup<T extends ListedGroup>(
  groups: T[],
  id: string,
  update: (group: T) => T
): T[] {
  const index = groups.findIndex((group) => group.id === id);
  const group = groups[index];
  if (!group) {
    return groups;
  }
  const updated = update(group);
  return updated === group ? groups : groups.with(index, updated);
}
