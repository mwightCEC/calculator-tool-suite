import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  readSavedParams,
  resolveStartingState,
  writeSavedParams,
  type SavedStateStorage,
} from './saved-state';
import { createShareCodec } from './share-codec';

const KEY = 'test:calculator';

const codec = createShareCodec({
  version: '1',
  toPayload: (state: { cameras: number }) => [state.cameras],
  fromPayload: { '1': (payload) => (Array.isArray(payload) ? { cameras: payload[0] } : null) },
  schema: z.object({ cameras: z.int().min(1) }),
});

/** In-memory stand-in for localStorage. */
function memoryStorage(): SavedStateStorage & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

/** Storage that throws on every call, like a browser with storage blocked. */
const blockedStorage: SavedStateStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('saved share parameters', () => {
  it('saves, reads back and forgets', () => {
    const storage = memoryStorage();
    writeSavedParams(storage, KEY, codec.encodeShareParams({ cameras: 3 }));
    expect(readSavedParams(storage, KEY)?.toString()).toBe(
      codec.encodeShareParams({ cameras: 3 }).toString()
    );
    writeSavedParams(storage, KEY, null);
    expect(storage.items.has(KEY)).toBe(false);
    expect(readSavedParams(storage, KEY)).toBeNull();
  });

  it('copes with missing or blocked storage', () => {
    expect(readSavedParams(null, KEY)).toBeNull();
    expect(readSavedParams(blockedStorage, KEY)).toBeNull();
    expect(() => writeSavedParams(blockedStorage, KEY, new URLSearchParams())).not.toThrow();
    expect(() => writeSavedParams(blockedStorage, KEY, null)).not.toThrow();
  });
});

describe('resolveStartingState', () => {
  const link = codec.encodeShareParams({ cameras: 5 });
  const saved = codec.encodeShareParams({ cameras: 2 });
  const noLink = new URLSearchParams();
  const brokenLink = new URLSearchParams({ v: '1', s: 'not-base64!' });
  const start = (linkParams: URLSearchParams, savedParams: URLSearchParams | null) =>
    resolveStartingState(codec.decodeShareParams, linkParams, savedParams);

  it('prefers a share link over the saved state', () => {
    expect(start(link, saved)).toEqual({ source: 'link', state: { cameras: 5 } });
  });

  it('reports a broken link instead of falling back to the saved state', () => {
    expect(start(brokenLink, saved)).toEqual({ source: 'invalid-link' });
  });

  it('uses the saved state when the URL has no link', () => {
    expect(start(noLink, saved)).toEqual({ source: 'saved', state: { cameras: 2 } });
  });

  it('falls back to the defaults when the saved state is broken or missing', () => {
    expect(start(noLink, brokenLink)).toEqual({ source: 'default' });
    expect(start(noLink, codec.encodeShareParams({ cameras: 0 }))).toEqual({ source: 'default' });
    expect(start(noLink, null)).toEqual({ source: 'default' });
  });
});
