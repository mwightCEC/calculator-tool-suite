'use client';

import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { buildPlainUrl, type ShareCodec } from './share-codec';

/** Wait for typing to pause before rewriting the address bar. */
const URL_WRITE_DELAY_MS = 300;

/**
 * Keeps a calculator's state and the page URL in step:
 * 1. On first load, restores state from a shared link (or reports a bad one).
 * 2. Afterwards, writes every change back to the URL with replaceState, so the
 *    address bar is always a shareable link and Back isn't flooded with entries.
 *    The default calculation keeps a clean URL with no share parameters.
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
  defaultEncoded: string
) {
  const restored = useRef(false);

  useEffect(() => {
    // Only read the URL once, even when development mode runs effects twice.
    if (restored.current) {
      return;
    }
    const shared = codec.decodeShareParams(new URLSearchParams(window.location.search));
    if (shared.status === 'loaded') {
      loadState(shared.state);
    } else if (shared.status === 'invalid') {
      notifications.show({
        color: 'amber',
        title: 'Couldn’t open the shared link',
        message: 'The link is incomplete or from an incompatible version. Showing the defaults.',
      });
    }
    restored.current = true;
  }, [codec, loadState]);

  useEffect(() => {
    if (!restored.current) {
      return;
    }
    const timer = window.setTimeout(() => {
      const url =
        codec.encodeState(state) === defaultEncoded
          ? buildPlainUrl(window.location.href)
          : codec.buildShareUrl(state, window.location.href);
      if (url !== window.location.href) {
        window.history.replaceState(window.history.state, '', url);
      }
    }, URL_WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [codec, defaultEncoded, state]);
}
