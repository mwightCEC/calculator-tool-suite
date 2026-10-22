import { createShareCodec } from '../../../../lib/share/share-codec';
import { bandwidthCalculatorStateSchema } from './bandwidth-calculator-state';
import { stateToV1Payload, v1PayloadToState } from './share-format-v1';

/*
 * Bandwidth share links (see lib/share/share-codec.ts for the URL scheme).
 *
 * - v=1 (written now): compact positional array, see share-format-v1.ts.
 */

export const SHARE_FORMAT_VERSION = '1';

export const bandwidthShareCodec = createShareCodec({
  version: SHARE_FORMAT_VERSION,
  toPayload: stateToV1Payload,
  fromPayload: { [SHARE_FORMAT_VERSION]: v1PayloadToState },
  schema: bandwidthCalculatorStateSchema,
});

export const { encodeState, decodeShareParams, buildShareUrl } = bandwidthShareCodec;
