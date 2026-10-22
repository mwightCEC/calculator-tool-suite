import type { z } from 'zod';

/*
 * Shareable links: a calculator's whole state lives in the query string as
 * ?v=<format version>&s=<base64url-encoded JSON>. Links are untrusted input, so
 * decoded state is always validated against the calculator's state schema.
 * Each calculator owns its own format versions; they are only read on its page.
 */

export const SHARE_VERSION_PARAM = 'v';
export const SHARE_STATE_PARAM = 's';

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

export type SharedStateResult<State> =
  | { status: 'none' }
  | { status: 'loaded'; state: State }
  | { status: 'invalid' };

export interface ShareCodecOptions<State> {
  /** Version written to new links. Bump when the encoded shape changes, and keep decoding older versions. */
  version: string;
  /** The current format's JSON payload for a state. */
  toPayload: (state: State) => unknown;
  /**
   * Turns a decoded payload into a state-shaped object, per format version
   * (current and older). Return null for the wrong shape; the schema check follows.
   */
  fromPayload: Record<string, (payload: unknown) => unknown>;
  schema: z.ZodType<State>;
}

export interface ShareCodec<State> {
  /** Encoded state in the current format; the same calculation always gives the same text. */
  encodeState: (state: State) => string;
  encodeShareParams: (state: State) => URLSearchParams;
  /** Reads calculator state from query parameters. `none` when the link carries no state. */
  decodeShareParams: (params: URLSearchParams) => SharedStateResult<State>;
  /** Current page URL with the share parameters replaced, keeping any other parameters. */
  buildShareUrl: (state: State, currentUrl: string) => string;
}

export function createShareCodec<State>({
  version,
  toPayload,
  fromPayload,
  schema,
}: ShareCodecOptions<State>): ShareCodec<State> {
  const encodeState = (state: State) => toBase64Url(JSON.stringify(toPayload(state)));

  const encodeShareParams = (state: State) =>
    new URLSearchParams({
      [SHARE_VERSION_PARAM]: version,
      [SHARE_STATE_PARAM]: encodeState(state),
    });

  const decodeShareParams = (params: URLSearchParams): SharedStateResult<State> => {
    const encoded = params.get(SHARE_STATE_PARAM);
    if (encoded === null) {
      return { status: 'none' };
    }
    const decode = fromPayload[params.get(SHARE_VERSION_PARAM) ?? ''];
    if (!decode) {
      return { status: 'invalid' };
    }
    try {
      const parsed = schema.safeParse(decode(JSON.parse(fromBase64Url(encoded))));
      return parsed.success ? { status: 'loaded', state: parsed.data } : { status: 'invalid' };
    } catch {
      // Not base64, not UTF-8 or not JSON.
      return { status: 'invalid' };
    }
  };

  const buildShareUrl = (state: State, currentUrl: string) => {
    const url = new URL(currentUrl);
    for (const [key, value] of encodeShareParams(state)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  };

  return { encodeState, encodeShareParams, decodeShareParams, buildShareUrl };
}

/** Current page URL without the share parameters (used for the default state). */
export function buildPlainUrl(currentUrl: string): string {
  const url = new URL(currentUrl);
  url.searchParams.delete(SHARE_VERSION_PARAM);
  url.searchParams.delete(SHARE_STATE_PARAM);
  return url.toString();
}
