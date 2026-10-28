import { createShareCodec } from '../../../../lib/share/share-codec';
import { stateToV1Payload, v1PayloadToState } from './share-format-v1';
import { voltageDropCalculatorStateSchema } from './voltage-drop-calculator-state';

/*
 * Voltage drop share links (see lib/share/share-codec.ts for the URL scheme).
 *
 * - v=1 (written now): compact positional array, see share-format-v1.ts.
 */

export const SHARE_FORMAT_VERSION = '1';

export const voltageDropShareCodec = createShareCodec({
  version: SHARE_FORMAT_VERSION,
  toPayload: stateToV1Payload,
  fromPayload: { [SHARE_FORMAT_VERSION]: v1PayloadToState },
  schema: voltageDropCalculatorStateSchema,
});

export const { encodeState, decodeShareParams, buildShareUrl } = voltageDropShareCodec;
