'use client';

import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { buildPlainUrl, buildShareUrl, decodeShareParams, encodeState } from './share-link';
import {
  createInitialStorageCalculatorState,
  type StorageCalculatorState,
} from './storage-calculator-state';

/** Wait for typing to pause before rewriting the address bar. */
const URL_WRITE_DELAY_MS = 300;

/** The default calculation keeps a clean URL with no share parameters. */
const DEFAULT_STATE_ENCODED = encodeState(createInitialStorageCalculatorState());

/**
 * Keeps the calculator state and the page URL in step:
 * 1. On first load, restores state from a shared link (or reports a bad one).
 * 2. Afterwards, writes every change back to the URL with replaceState, so the
 *    address bar is always a shareable link and Back isn't flooded with entries.
 *
 * Reads window.location directly rather than useSearchParams, which would need
 * a Suspense boundary and client-only rendering in the static export.
 */
export function useUrlStateSync(
  state: StorageCalculatorState,
  /** Must be stable (e.g. wrapped in useCallback). */
  loadState: (state: StorageCalculatorState) => void
) {
  const restored = useRef(false);

  useEffect(() => {
    // Only read the URL once, even when development mode runs effects twice.
    if (restored.current) {
      return;
    }
    const shared = decodeShareParams(new URLSearchParams(window.location.search));
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
  }, [loadState]);

  useEffect(() => {
    if (!restored.current) {
      return;
    }
    const timer = window.setTimeout(() => {
      const url =
        encodeState(state) === DEFAULT_STATE_ENCODED
          ? buildPlainUrl(window.location.href)
          : buildShareUrl(state, window.location.href);
      if (url !== window.location.href) {
        window.history.replaceState(window.history.state, '', url);
      }
    }, URL_WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state]);
}
