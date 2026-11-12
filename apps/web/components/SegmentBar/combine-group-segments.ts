import type { BarSegment } from './SegmentBar';

/** Every group's segment combined into one, in the brand colour, for a Simplified breakdown. */
export function combineGroupSegments(
  groupSegments: BarSegment[],
  { key, label }: { key: string; label: string }
): BarSegment {
  return {
    key,
    label,
    value: groupSegments.reduce((sum, segment) => sum + segment.value, 0),
    color: 'var(--mantine-color-brand-6)',
  };
}
