'use client';

import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import {
  browserStorage,
  readSavedParams,
  resolveStartingState,
  writeSavedParams,
} from './saved-state';
import { buildPlainUrl, type ShareCodec } from './share-codec';

/** Wait for typing to pause before rewriting the address bar. */
const URL_WRITE_DELAY_MS = 300;

/**
 * Keeps a calculator's state, the page URL and the browser's saved copy in step:
 * 1. On first load, restores state from a shared link (or reports a bad one),
 *    otherwise from the state saved when the page was last used.
 * 2. Afterwards, saves every change and writes it back to the URL with
 *    replaceState, so the address bar is always a shareable link and Back isn't
 *    flooded with entries. The default calculation keeps a clean URL and clears
 *    the saved copy.
 *
 * Reads window.location directly rather than useSearchParams, which would need
 * a Suspense boundary and client-only rendering in the static export.
 */
export function useUrlStateSync<State>(
  state: State,
  /** Must be stable (e.g. wrapped in useCallback). */
  loadState: (state: State) => void,
  /** Module-level constant, so it is stable between renders. */
  codec: ShareCodec<State>,
  /** codec.encodeState of the calculator's initial state. */
  defaultEncoded: string,
  /** localStorage key for this calculator's saved state. */
  storageKey: string
) {
  const restored = useRef(false);

  useEffect(() => {
    // Only restore once, even when development mode runs effects twice.
    if (restored.current) {
      return;
    }
    const savedParams = readSavedParams(browserStorage(), storageKey);
    const start = resolveStartingState(
      codec.decodeShareParams,
      new URLSearchParams(window.location.search),
      savedParams
    );
    if (start.source === 'link' || start.source === 'saved') {
      loadState(start.state);
    } else if (start.source === 'invalid-link') {
      notifications.show({
        color: 'amber',
        title: 'Couldn’t open the shared link',
        message: 'The link is incomplete or from an incompatible version. Showing the defaults.',
      });
    } else if (savedParams) {
      // Saved state that no longer decodes (e.g. from an unsupported version).
      writeSavedParams(browserStorage(), storageKey, null);
    }
    restored.current = true;
  }, [codec, loadState, storageKey]);

  useEffect(() => {
    if (!restored.current) {
      return;
    }
    const isDefault = codec.encodeState(state) === defaultEncoded;
    // Saved straight away, so leaving the page right after a change keeps it.
    writeSavedParams(
      browserStorage(),
      storageKey,
      isDefault ? null : codec.encodeShareParams(state)
    );

    const timer = window.setTimeout(() => {
      const url = isDefault
        ? buildPlainUrl(window.location.href)
        : codec.buildShareUrl(state, window.location.href);
      if (url !== window.location.href) {
        window.history.replaceState(window.history.state, '', url);
      }
    }, URL_WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [codec, defaultEncoded, state, storageKey]);
}
