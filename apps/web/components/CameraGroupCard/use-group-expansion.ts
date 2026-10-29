'use client';

import { useState } from 'react';

const NONE: ReadonlySet<string> = new Set();

/**
 * Which camera group cards are expanded, kept by the page so one button can
 * collapse or expand them all while each card still toggles on its own.
 * Only collapsed ids are stored, so new and duplicated groups start expanded.
 */
export function useGroupExpansion(groupIds: readonly string[]) {
  const [collapsedIds, setCollapsedIds] = useState(NONE);

  // Forget groups that no longer exist, so a later group that reuses the id starts expanded.
  if ([...collapsedIds].some((id) => !groupIds.includes(id))) {
    setCollapsedIds(new Set(groupIds.filter((id) => collapsedIds.has(id))));
  }

  const allCollapsed = groupIds.length > 0 && groupIds.every((id) => collapsedIds.has(id));

  return {
    isExpanded: (id: string) => !collapsedIds.has(id),
    toggle: (id: string) =>
      setCollapsedIds((current) => {
        const next = new Set(current);
        if (!next.delete(id)) {
          next.add(id);
        }
        return next;
      }),
    allCollapsed,
    /** Collapses every group, or expands them all once every group is collapsed. */
    toggleAll: () => setCollapsedIds(allCollapsed ? NONE : new Set(groupIds)),
    expandAll: () => setCollapsedIds(NONE),
    /** Collapses every current group; a group added afterwards starts expanded. */
    collapseAll: () => setCollapsedIds(new Set(groupIds)),
  };
}
