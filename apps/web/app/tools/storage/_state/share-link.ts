import { createShareCodec } from '../../../../lib/share/share-codec';
import { stateToV2Payload, v2PayloadToState } from './share-format-v2';
import { storageCalculatorStateSchema } from './storage-calculator-state';

/*
 * Storage share links (see lib/share/share-codec.ts for the URL scheme).
 *
 * - v=2 (written now): compact positional array, see share-format-v2.ts.
 * - v=1 (still read): the full state object as JSON.
 */

export {
  buildPlainUrl,
  SHARE_STATE_PARAM,
  SHARE_VERSION_PARAM,
} from '../../../../lib/share/share-codec';

export const SHARE_FORMAT_VERSION = '2';
/** The original full-JSON format; links using it still open. */
export const LEGACY_SHARE_FORMAT_VERSION = '1';

export const storageShareCodec = createShareCodec({
  version: SHARE_FORMAT_VERSION,
  toPayload: stateToV2Payload,
  fromPayload: {
    [SHARE_FORMAT_VERSION]: v2PayloadToState,
    [LEGACY_SHARE_FORMAT_VERSION]: (payload) => payload,
  },
  schema: storageCalculatorStateSchema,
});

export const { encodeState, encodeShareParams, decodeShareParams, buildShareUrl } =
  storageShareCodec;
