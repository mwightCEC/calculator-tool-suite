import { describe, expect, it } from 'vitest';
import {
  addGroup,
  duplicateGroup,
  removeGroup,
  restoreGroup,
  updateGroup,
  type ListedGroup,
} from './group-list';

// Colour behaviour is covered in group-colors.test.ts; these tests cover ids and identity.

const two = (): ListedGroup[] => [
  { id: 'g1', name: 'Lobby', colorIndex: 0 },
  { id: 'g2', name: 'Car park', colorIndex: 1 },
];

describe('group list operations', () => {
  it('passes the new id, name and colour to the create callback', () => {
    const groups = addGroup(two(), (fields) => fields);
    expect(groups[2]).toEqual({ id: 'g3', name: 'Camera group 3', colorIndex: 2 });
  });

  it('adds at the start when asked, coloured to differ from the group below', () => {
    const groups = addGroup(two(), (fields) => fields, 'start');
    expect(groups.map((group) => group.id)).toEqual(['g3', 'g1', 'g2']);
    expect(groups[0]).toEqual({ id: 'g3', name: 'Camera group 3', colorIndex: 2 });
  });

  it('numbers ids after the highest, ignoring ids that are not numbered', () => {
    const groups = addGroup([{ id: 'custom', name: 'X', colorIndex: 0 }], (fields) => fields);
    expect(groups[1]?.id).toBe('g1');
  });

  it('returns the same array when nothing changes', () => {
    const groups = two();
    expect(duplicateGroup(groups, 'nope')).toBe(groups);
    expect(removeGroup(groups, 'nope')).toBe(groups);
    expect(removeGroup([groups[0]!], 'g1')).toEqual([groups[0]]);
    expect(restoreGroup(groups, groups[0]!, 0)).toBe(groups);
    expect(updateGroup(groups, 'nope', (group) => ({ ...group, name: 'X' }))).toBe(groups);
    expect(updateGroup(groups, 'g1', (group) => group)).toBe(groups);
  });

  it('updates one group and keeps the others’ identity', () => {
    const groups = two();
    const updated = updateGroup(groups, 'g2', (group) => ({ ...group, name: 'Gate' }));
    expect(updated[0]).toBe(groups[0]);
    expect(updated[1]?.name).toBe('Gate');
  });
});
