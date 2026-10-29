'use client';

import {
  OVERHEAD_PERCENTS,
  UPLINK_SPEEDS_MBPS,
  type NetworkLinks,
  type OverheadPercent,
} from '@cctv/calc-core';
import { Disclosure } from '../../../../components/Disclosure/Disclosure';
import {
  FieldLayoutProvider,
  FieldRow,
  fieldLabelId,
} from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { parseOption } from '../../../../lib/camera-labels';
import { OVERHEAD_OPTIONS, UPLINK_OFF, UPLINK_OPTIONS } from '../_lib/bandwidth-labels';
import classes from './SettingsSection.module.css';

interface NetworkSectionProps {
  network: NetworkLinks;
  overheadPercent: OverheadPercent;
  onNetworkChange: (changes: Partial<NetworkLinks>) => void;
  onOverheadChange: (overheadPercent: OverheadPercent) => void;
}

/**
 * Collapsible section with the optional uplink check (a speed chosen becomes a
 * check in the results) and the overhead allowance. Collapsing it only hides the fields.
 */
export function NetworkSection({
  network,
  overheadPercent,
  onNetworkChange,
  onOverheadChange,
}: NetworkSectionProps) {
  return (
    <Disclosure title="Network check and overhead" hint="(optional)">
      <div className={classes.panel}>
        <FieldLayoutProvider value="stacked">
          <FieldRow
            label="Uplink"
            help="Speed of the network link that carries all the camera traffic, such as a switch uplink. Checked against the bandwidth estimate."
            controlId="bandwidth-uplink"
          >
            <OptionButtons
              id="bandwidth-uplink"
              value={network.uplinkMbps === null ? UPLINK_OFF : String(network.uplinkMbps)}
              onChange={(value) =>
                onNetworkChange({ uplinkMbps: parseOption(UPLINK_SPEEDS_MBPS, value) ?? null })
              }
              options={UPLINK_OPTIONS}
              aria-labelledby={fieldLabelId('bandwidth-uplink')}
            />
          </FieldRow>

          <FieldRow
            label="Overhead allowance"
            help="Added to every total to cover network protocol overhead and short bitrate bursts above the average."
            controlId="bandwidth-overhead"
          >
            <OptionButtons
              id="bandwidth-overhead"
              value={String(overheadPercent)}
              onChange={(value) => {
                const percent = parseOption(OVERHEAD_PERCENTS, value);
                if (percent !== undefined) {
                  onOverheadChange(percent);
                }
              }}
              options={OVERHEAD_OPTIONS}
              aria-labelledby={fieldLabelId('bandwidth-overhead')}
            />
          </FieldRow>
        </FieldLayoutProvider>
      </div>
    </Disclosure>
  );
}
