'use client';

import { UPLINK_SPEEDS_MBPS, type NetworkLinks } from '@cctv/calc-core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { parseOption } from '../../../../lib/camera-labels';
import { UPLINK_OFF, UPLINK_OPTIONS } from '../_lib/bandwidth-labels';
import { InputCard } from './InputCard';

interface NetworkChecksCardProps {
  network: NetworkLinks;
  onChange: (changes: Partial<NetworkLinks>) => void;
}

/** The optional uplink check; a speed chosen becomes a check in the results. */
export function NetworkChecksCard({ network, onChange }: NetworkChecksCardProps) {
  return (
    <InputCard id="bandwidth-network-title" title="Network checks">
      <FieldRow
        label="Uplink"
        help="Speed of the network link that carries all the camera traffic, such as a switch uplink. Checked against the bandwidth estimate."
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
    </InputCard>
  );
}
