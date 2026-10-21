'use client';

import { UPLINK_SPEEDS_MBPS, type NetworkLinks } from '@cctv/calc-core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { parseOption } from '../../../../lib/camera-labels';
import { UPLINK_OFF, UPLINK_OPTIONS } from '../_lib/bandwidth-labels';
import { InputCard } from './InputCard';
import { OptionalMbpsInput } from './OptionalMbpsInput';

const EMPTY_IS_OFF = 'Leave empty to skip this check';

interface NetworkChecksCardProps {
  network: NetworkLinks;
  onChange: (changes: Partial<NetworkLinks>) => void;
}

/** Optional link capacities; each one entered becomes a check in the results. */
export function NetworkChecksCard({ network, onChange }: NetworkChecksCardProps) {
  return (
    <InputCard id="bandwidth-network-title" title="Network checks">
      <FieldRow
        label="Recorder limit"
        help="The recorder's maximum incoming bandwidth, from its datasheet. Checked against the traffic it records."
        controlId="bandwidth-recorder-limit"
        note={EMPTY_IS_OFF}
      >
        <OptionalMbpsInput
          id="bandwidth-recorder-limit"
          value={network.recorderLimitMbps}
          onChange={(recorderLimitMbps) => onChange({ recorderLimitMbps })}
        />
      </FieldRow>

      <FieldRow
        label="Uplink"
        help="Speed of the recorder's network port or the camera switch's uplink to it. Checked against the traffic the recorder receives."
        controlId="bandwidth-uplink"
      >
        <OptionButtons
          id="bandwidth-uplink"
          value={network.uplinkMbps === null ? UPLINK_OFF : String(network.uplinkMbps)}
          onChange={(value) =>
            onChange({ uplinkMbps: parseOption(UPLINK_SPEEDS_MBPS, value) ?? null })
          }
          options={UPLINK_OPTIONS}
          aria-labelledby={fieldLabelId('bandwidth-uplink')}
        />
      </FieldRow>

      <FieldRow
        label="Site upload"
        help="The site's internet upload speed. Checked against the traffic sent to remote viewers."
        controlId="bandwidth-site-upload"
        note={EMPTY_IS_OFF}
      >
        <OptionalMbpsInput
          id="bandwidth-site-upload"
          value={network.siteUploadMbps}
          onChange={(siteUploadMbps) => onChange({ siteUploadMbps })}
        />
      </FieldRow>
    </InputCard>
  );
}
