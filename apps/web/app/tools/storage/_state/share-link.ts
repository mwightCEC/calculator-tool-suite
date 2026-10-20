import { stateToV2Payload, v2PayloadToState } from './share-format-v2';
import {
  storageCalculatorStateSchema,
  type StorageCalculatorState,
} from './storage-calculator-state';

/*
 * Shareable links: the whole calculator state lives in the query string as
 * ?v=<format version>&s=<base64url-encoded JSON>. Links are untrusted input, so
 * decoded state is always validated against storageCalculatorStateSchema.
 *
 * - v=2 (written now): compact positional array, see share-format-v2.ts.
 * - v=1 (still read): the full state object as JSON.
 */

export const SHARE_VERSION_PARAM = 'v';
export const SHARE_STATE_PARAM = 's';
/** Version written to new links. Bump when the encoded shape changes, and keep decoding older versions. */
export const SHARE_FORMAT_VERSION = '2';
/** The original full-JSON format; links using it still open. */
export const LEGACY_SHARE_FORMAT_VERSION = '1';

/** Base64url (URL-safe, unpadded) of UTF-8 text, so group names can use any characters. */
function toBase64Url(text: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Encoded state in the current format. Positional, so the same calculation
 * always produces the same link (group ids aren't stored).
 */
export function encodeState(state: StorageCalculatorState): string {
  return toBase64Url(JSON.stringify(stateToV2Payload(state)));
}

/** Turns decoded JSON into a state-shaped object for the given format version. */
function payloadToState(version: string | null, payload: unknown): unknown {
  switch (version) {
    case SHARE_FORMAT_VERSION:
      return v2PayloadToState(payload);
    case LEGACY_SHARE_FORMAT_VERSION:
      return payload;
    default:
      return null;
  }
}

export function encodeShareParams(state: StorageCalculatorState): URLSearchParams {
  return new URLSearchParams({
    [SHARE_VERSION_PARAM]: SHARE_FORMAT_VERSION,
    [SHARE_STATE_PARAM]: encodeState(state),
  });
}

export type SharedStateResult =
  | { status: 'none' }
  | { status: 'loaded'; state: StorageCalculatorState }
  | { status: 'invalid' };

/** Reads calculator state from query parameters. `none` when the link carries no state. */
export function decodeShareParams(params: URLSearchParams): SharedStateResult {
  const encoded = params.get(SHARE_STATE_PARAM);
  if (encoded === null) {
    return { status: 'none' };
  }
  try {
    const payload = JSON.parse(fromBase64Url(encoded));
    const candidate = payloadToState(params.get(SHARE_VERSION_PARAM), payload);
    const parsed = storageCalculatorStateSchema.safeParse(candidate);
    return parsed.success ? { status: 'loaded', state: parsed.data } : { status: 'invalid' };
  } catch {
    // Not base64, not UTF-8 or not JSON.
    return { status: 'invalid' };
  }
}

/** Current page URL with the share parameters replaced, keeping any other parameters. */
export function buildShareUrl(state: StorageCalculatorState, currentUrl: string): string {
  const url = new URL(currentUrl);
  for (const [key, value] of encodeShareParams(state)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Current page URL without the share parameters (used for the default state). */
export function buildPlainUrl(currentUrl: string): string {
  const url = new URL(currentUrl);
  url.searchParams.delete(SHARE_VERSION_PARAM);
  url.searchParams.delete(SHARE_STATE_PARAM);
  return url.toString();
}
