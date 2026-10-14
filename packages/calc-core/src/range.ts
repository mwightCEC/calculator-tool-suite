/**
 * A planning estimate with its uncertainty. For values that come from known
 * data (a measured average or a bitrate cap) low = typical = high.
 */
export interface ValueRange {
  low: number;
  typical: number;
  high: number;
}

export function pointRange(value: number): ValueRange {
  return { low: value, typical: value, high: value };
}

/** True when the range has collapsed to a single value. */
export function isPointRange(range: ValueRange): boolean {
  return range.low === range.typical && range.typical === range.high;
}

export function scaleRange(range: ValueRange, factor: number): ValueRange {
  return { low: range.low * factor, typical: range.typical * factor, high: range.high * factor };
}

export function sumRanges(ranges: readonly ValueRange[]): ValueRange {
  return ranges.reduce(
    (sum, range) => ({
      low: sum.low + range.low,
      typical: sum.typical + range.typical,
      high: sum.high + range.high,
    }),
    pointRange(0)
  );
}
