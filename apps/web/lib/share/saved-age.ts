const MINUTE_MS = 60 * 1000;

/**
 * How long ago saved state was last changed, for the restored-session banner:
 * "less than a minute ago", "12 min ago", "2 hr ago", "1 hr 5 min ago".
 */
export function describeSavedAge(ageMs: number): string {
  const minutes = Math.floor(Math.max(ageMs, 0) / MINUTE_MS);
  if (minutes < 1) {
    return 'less than a minute ago';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr ago` : `${hours} hr ${rest} min ago`;
}
