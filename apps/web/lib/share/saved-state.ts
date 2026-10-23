import type { ShareCodec } from './share-codec';

/*
 * Each calculator's last state, saved in the browser so it survives leaving the
 * page. It is stored as the same query string a share link carries, so saved
 * state gets the same format versions and schema validation as a link.
 */

/** The subset of Web Storage used here, so tests can pass a stand-in. */
export type SavedStateStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** localStorage, or null where it is unavailable (server render, blocked storage). */
export function browserStorage(): SavedStateStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The saved share parameters, or null when nothing is saved or storage can't be read. */
export function readSavedParams(
  storage: SavedStateStorage | null,
  key: string
): URLSearchParams | null {
  try {
    const saved = storage?.getItem(key);
    return saved ? new URLSearchParams(saved) : null;
  } catch {
    return null;
  }
}

/** Saves the share parameters, or forgets the saved state when given null. */
export function writeSavedParams(
  storage: SavedStateStorage | null,
  key: string,
  params: URLSearchParams | null
) {
  try {
    if (params) {
      storage?.setItem(key, params.toString());
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
