import { TOOLS } from '../../tools/tool-registry';
import { browserStorage } from './saved-state';

/*
 * "Clear all calculators" (the header's help menu): forgets every calculator's saved state
 * and sends the open calculator back to its defaults, with Undo. The open calculator hears
 * about it through window events (see useUrlStateSync), so nothing needs to reload.
 */

/** Sent after every calculator's saved state was removed. */
export const CALCULATORS_CLEARED_EVENT = 'cctv-tool-suite:calculators-cleared';
/** Sent after Undo put the saved state back, so the open calculator reloads it. */
export const CALCULATORS_RESTORED_EVENT = 'cctv-tool-suite:calculators-restored';

/** Where a calculator's last state is kept in the browser, by tool id. */
export function savedStateKey(toolId: string): string {
  return `cctv-tool-suite:${toolId}-calculator`;
}

/** The raw saved entries, by key, so Undo can put them back as they were. */
type SavedSnapshot = [key: string, value: string][];

/**
 * Removes every calculator's saved state and tells the open calculator to start over.
 * Returns a function that undoes it.
 */
export function clearAllCalculators(): () => void {
  const storage = browserStorage();
  const snapshot: SavedSnapshot = [];
  try {
    for (const tool of TOOLS) {
      const key = savedStateKey(tool.id);
      const value = storage?.getItem(key);
      if (value) {
        snapshot.push([key, value]);
      }
      storage?.removeItem(key);
    }
  } catch {
    // Blocked storage: there is nothing saved to clear, but the open calculator still resets.
  }
  window.dispatchEvent(new Event(CALCULATORS_CLEARED_EVENT));

  return () => {
    try {
      for (const [key, value] of snapshot) {
        storage?.setItem(key, value);
      }
    } catch {
      // Full or blocked storage: the open calculator can't be restored from it either.
    }
    window.dispatchEvent(new Event(CALCULATORS_RESTORED_EVENT));
  };
}
