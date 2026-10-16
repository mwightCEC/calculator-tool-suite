import {
  storageCalculatorStateSchema,
  type StorageCalculatorState,
} from './storage-calculator-state';

/*
 * Shareable links: the whole calculator state lives in the query string as
 * ?v=<format version>&s=<base64url-encoded JSON>. Links are untrusted input, so
 * decoded state is always validated against storageCalculatorStateSchema.
 */

export const SHARE_VERSION_PARAM = 'v';
export const SHARE_STATE_PARAM = 's';
/** Bump when the encoded shape changes incompatibly, and decode older versions if needed. */
export const SHARE_FORMAT_VERSION = '1';

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
 * Encoded state. Parsing through the schema first gives a canonical key order,
 * so the same calculation always produces the same link.
 */
export function encodeState(state: StorageCalculatorState): string {
  const canonical = storageCalculatorStateSchema.safeParse(state);
  // The reducer keeps state valid; encode it as-is rather than throw if that ever slips.
  return toBase64Url(JSON.stringify(canonical.success ? canonical.data : state));
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
  if (params.get(SHARE_VERSION_PARAM) !== SHARE_FORMAT_VERSION) {
    return { status: 'invalid' };
  }
  try {
    const parsed = storageCalculatorStateSchema.safeParse(JSON.parse(fromBase64Url(encoded)));
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
