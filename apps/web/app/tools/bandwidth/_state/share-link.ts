import { createShareCodec } from '../../../../lib/share/share-codec';
import { bandwidthCalculatorStateSchema } from './bandwidth-calculator-state';
import { stateToV2Payload, v2PayloadToState } from './share-format-v2';

/*
 * Bandwidth share links (see lib/share/share-codec.ts for the URL scheme).
 *
 * - v=2 (written now): compact positional array, see share-format-v2.ts.
 * - v=1 is no longer read: it carried sub-streams, recorded streams and the
 *   recorder limit, which were removed. Those links report as invalid.
 */

export const SHARE_FORMAT_VERSION = '2';

export const bandwidthShareCodec = createShareCodec({
  version: SHARE_FORMAT_VERSION,
  toPayload: stateToV2Payload,
  fromPayload: { [SHARE_FORMAT_VERSION]: v2PayloadToState },
  schema: bandwidthCalculatorStateSchema,
});

export const { encodeState, decodeShareParams, buildShareUrl } = bandwidthShareCodec;
