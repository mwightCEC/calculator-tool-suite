import type { ShareCodec } from './share-codec';

/*
 * Each calculator's last state, saved in the browser so it survives leaving the
 * page. It is stored as the same query string a share link carries, so saved
 * state gets the same format versions and schema validation as a link.
 *
 * Saved state expires: every save records the time, and state left untouched
 * for longer than SAVED_STATE_MAX_AGE_MS is forgotten, so a return visit the
 * next day starts fresh. Share links never expire.
 */

/** How long saved state lasts after the calculator was last used. */
export const SAVED_STATE_MAX_AGE_MS = 4 * 60 * 60 * 1000;

/** The subset of Web Storage used here, so tests can pass a stand-in. */
export type SavedStateStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** What is stored under a calculator's key. */
type SavedEntry = { savedAt: number; params: string };

/** localStorage, or null where it is unavailable (server render, blocked storage). */
export function browserStorage(): SavedStateStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The stored entry, or null when it isn't one (including the older, untimed format). */
function parseEntry(saved: string): SavedEntry | null {
  try {
    const entry: unknown = JSON.parse(saved);
    if (
      typeof entry === 'object' &&
      entry !== null &&
      'savedAt' in entry &&
      'params' in entry &&
      typeof entry.savedAt === 'number' &&
      typeof entry.params === 'string'
    ) {
      return { savedAt: entry.savedAt, params: entry.params };
    }
  } catch {
    // Not JSON: an entry saved before saved state expired.
  }
  return null;
}

/**
 * The saved share parameters and when they were saved, or null when nothing is saved or
 * storage can't be read. Expired or unrecognised entries are removed.
 */
export function readSavedEntry(
  storage: SavedStateStorage | null,
  key: string,
  now = Date.now()
): { params: URLSearchParams; savedAt: number } | null {
  try {
    const saved = storage?.getItem(key);
    if (!saved) {
      return null;
    }
    const entry = parseEntry(saved);
    const age = entry ? now - entry.savedAt : Number.NaN;
    // A future time (clock changed) counts as expired, so it can't live forever.
    if (!entry || !(age >= 0 && age <= SAVED_STATE_MAX_AGE_MS)) {
      storage?.removeItem(key);
      return null;
    }
    return { params: new URLSearchParams(entry.params), savedAt: entry.savedAt };
  } catch {
    return null;
  }
}

/** The saved share parameters alone (see readSavedEntry). */
export function readSavedParams(
  storage: SavedStateStorage | null,
  key: string,
  now = Date.now()
): URLSearchParams | null {
  return readSavedEntry(storage, key, now)?.params ?? null;
}

/** Saves the share parameters with the time, or forgets the saved state when given null. */
export function writeSavedParams(
  storage: SavedStateStorage | null,
  key: string,
  params: URLSearchParams | null,
  now = Date.now()
) {
  try {
    if (params) {
      const entry: SavedEntry = { savedAt: now, params: params.toString() };
      storage?.setItem(key, JSON.stringify(entry));
    } else {
      storage?.removeItem(key);
    }
  } catch {
    // Full or blocked storage: the calculator still works, it just won't remember.
  }
}

export type StartingState<State> =
  | { source: 'link' | 'saved'; state: State }
  | { source: 'invalid-link' }
  | { source: 'default' };

/**
 * Where a calculator starts: a share link in the URL wins, then the saved state,
 * then the defaults. A broken link is reported rather than silently replaced by
 * saved state; broken saved state just falls back to the defaults.
 */
export function resolveStartingState<State>(
  decodeShareParams: ShareCodec<State>['decodeShareParams'],
  linkParams: URLSearchParams,
  savedParams: URLSearchParams | null
): StartingState<State> {
  const shared = decodeShareParams(linkParams);
  if (shared.status === 'loaded') {
    return { source: 'link', state: shared.state };
  }
  if (shared.status === 'invalid') {
    return { source: 'invalid-link' };
  }
  const saved = savedParams ? decodeShareParams(savedParams) : null;
  return saved?.status === 'loaded'
    ? { source: 'saved', state: saved.state }
    : { source: 'default' };
}

/**
 * Whether the calculator opens with the inputs saved from the last visit, for the
 * restored-session banner: from saved state, or from a link holding those same inputs. The
 * address bar always carries the current inputs as a link, so a reload, a reopened tab or
 * a history entry opens as a link; a link from someone else won't match the saved inputs.
 */
export function opensSavedState<State>(
  codec: Pick<ShareCodec<State>, 'decodeShareParams' | 'encodeState'>,
  start: StartingState<State>,
  savedParams: URLSearchParams | null
): boolean {
  if (start.source === 'saved') {
    return true;
  }
  if (start.source !== 'link' || !savedParams) {
    return false;
  }
  const saved = codec.decodeShareParams(savedParams);
  return (
    saved.status === 'loaded' && codec.encodeState(saved.state) === codec.encodeState(start.state)
  );
}
