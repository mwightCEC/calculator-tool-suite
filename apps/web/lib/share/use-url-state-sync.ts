'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { notifyWithUndo } from '../../components/CameraGroupCard/undo-notifications';
import { CALCULATORS_CLEARED_EVENT, CALCULATORS_RESTORED_EVENT } from './clear-all-calculators';
import {
  browserStorage,
  opensSavedState,
  readSavedEntry,
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
 *    otherwise from the state saved when the page was last used (if that was
 *    recent enough: see SAVED_STATE_MAX_AGE_MS).
 * 2. Afterwards, saves every change and writes it back to the URL with
 *    replaceState, so the address bar is always a shareable link and Back isn't
 *    flooded with entries. The default calculation keeps a clean URL and clears
 *    the saved copy.
 *
 * 3. Reports a restore of the saved inputs, from saved state or a link holding the same
 *    inputs (RestoredSession) for the banner, whose Start over
 *    resets the whole calculator with Undo, and follows "Clear all calculators"
 *    (clear-all-calculators.ts) and its Undo.
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
  /** The calculator's initial state; a module-level constant. */
  defaultState: State,
  /** localStorage key for this calculator's saved state (savedStateKey). */
  storageKey: string
): RestoredSession {
  const restored = useRef(false);
  // Age of the saved state this visit opened with, while its banner is showing.
  const [restoredAgeMs, setRestoredAgeMs] = useState<number | null>(null);

  useEffect(() => {
    // Only restore once, even when development mode runs effects twice.
    if (restored.current) {
      return;
    }
    const now = Date.now();
    const saved = readSavedEntry(browserStorage(), storageKey, now);
    const savedParams = saved?.params ?? null;
    const start = resolveStartingState(
      codec.decodeShareParams,
      new URLSearchParams(window.location.search),
      savedParams
    );
    if (start.source === 'link' || start.source === 'saved') {
      loadState(start.state);
      if (saved && opensSavedState(codec, start, savedParams)) {
        setRestoredAgeMs(now - saved.savedAt);
      }
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

  // "Clear all calculators" and its Undo, from the header's help menu.
  useEffect(() => {
    const onCleared = () => {
      loadState(defaultState);
      setRestoredAgeMs(null);
    };
    const onRestored = () => {
      const savedParams = readSavedParams(browserStorage(), storageKey);
      const saved = savedParams ? codec.decodeShareParams(savedParams) : null;
      if (saved?.status === 'loaded') {
        loadState(saved.state);
      }
    };
    window.addEventListener(CALCULATORS_CLEARED_EVENT, onCleared);
    window.addEventListener(CALCULATORS_RESTORED_EVENT, onRestored);
    return () => {
      window.removeEventListener(CALCULATORS_CLEARED_EVENT, onCleared);
      window.removeEventListener(CALCULATORS_RESTORED_EVENT, onRestored);
    };
  }, [codec, defaultState, loadState, storageKey]);

  useEffect(() => {
    if (!restored.current) {
      return;
    }
    const isDefault = codec.encodeState(state) === codec.encodeState(defaultState);
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
  }, [codec, defaultState, state, storageKey]);

  const startOver = useCallback(() => {
    const previous = state;
    loadState(defaultState);
    setRestoredAgeMs(null);
    notifyWithUndo('started-over', 'Started over with the default inputs', () =>
      loadState(previous)
    );
  }, [defaultState, loadState, state]);

  const dismiss = useCallback(() => setRestoredAgeMs(null), []);

  return { restoredAgeMs, startOver, dismiss };
}

/** A visit that reopened the calculator's saved state, for the restored-session banner. */
export interface RestoredSession {
  /** How old the restored state was when the page opened; null when there's no banner. */
  restoredAgeMs: number | null;
  /** Resets the whole calculator to its defaults, with Undo. */
  startOver: () => void;
  /** Hides the banner and keeps the restored inputs. */
  dismiss: () => void;
}
