/*
 * Wording for the "Remaining" metric tile that PoE budget and Voltage drop share:
 * what is left of the usable amount (the budget or rating less the reserve), or
 * how far short of it the supply falls.
 */

/** "Remaining" while there is room, else "Short by". */
export function remainingLabel(over: boolean): string {
  return over ? 'Short by' : 'Remaining';
}

/** Names the reserve under the tile: "before the reserve"; nothing when there is none. */
export function remainingDetail(over: boolean, reservePercent: number): string | null {
  if (reservePercent === 0) {
    return null;
  }
  return over ? `keeping the ${reservePercent}% reserve` : 'before the reserve';
}
