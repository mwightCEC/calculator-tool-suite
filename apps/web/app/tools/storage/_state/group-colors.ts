import { groupColors } from '../../../../theme/palettes';

/*
 * Camera group colours. Rule: two neighbouring groups never share a colour, so
 * cards and capacity-bar segments stay distinguishable. New and duplicated
 * groups prefer colours nobody uses yet, so up to six groups (the palette size)
 * normally all differ; Undo and shared links can reintroduce a repeat, but never
 * next to each other.
 *
 * A group keeps its colour while others change; only a group that would clash
 * with the group above it is re-coloured.
 */

const PALETTE_SIZE = groupColors.length;

interface HasColor {
  colorIndex: number;
}

interface Neighbours {
  /** Colour of the group directly above, if any. */
  previous?: number;
  /** Colour of the group directly below, if any. */
  next?: number;
  /** Colours already used by other groups; less-used colours are preferred. */
  used: readonly number[];
}

/**
 * A colour that differs from both neighbours, preferring the least-used colour.
 * Ties continue the palette order after the group above, so adding groups one
 * by one still cycles through the palette.
 */
export function pickGroupColor({ previous, next, used }: Neighbours): number {
  const start = previous === undefined ? 0 : previous + 1;
  const candidates = Array.from(
    { length: PALETTE_SIZE },
    (_, offset) => (start + offset) % PALETTE_SIZE
  ).filter((color) => color !== previous && color !== next);
  const uses = (color: number) => used.filter((usedColor) => usedColor === color).length;
  // Never empty: at most two colours are excluded from a palette of six.
  return candidates.reduce((best, color) => (uses(color) < uses(best) ? color : best));
}

/** The colour a group would get if inserted at `index` (before the group currently there). */
export function pickColorForInsert(groups: readonly HasColor[], index: number): number {
  return pickGroupColor({
    previous: groups[index - 1]?.colorIndex,
    next: groups[index]?.colorIndex,
    used: groups.map((group) => group.colorIndex),
  });
}

/**
 * Re-colours any group that matches the group above it. Groups without a clash
 * are returned unchanged (same object), so React keeps their identity.
 */
export function repairGroupColors<T extends HasColor>(groups: readonly T[]): T[] {
  const repaired = [...groups];
  for (let index = 1; index < repaired.length; index++) {
    const group = repaired[index]!;
    const previous = repaired[index - 1]!.colorIndex;
    if (group.colorIndex !== previous) {
      continue;
    }
    const others = repaired.filter((_, otherIndex) => otherIndex !== index);
    repaired[index] = {
      ...group,
      colorIndex: pickGroupColor({
        previous,
        next: repaired[index + 1]?.colorIndex,
        used: others.map((other) => other.colorIndex),
      }),
    };
  }
  return repaired;
}
