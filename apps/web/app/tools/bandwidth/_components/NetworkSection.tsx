'use client';

import {
  OVERHEAD_PERCENTS,
  UPLINK_SPEEDS_MBPS,
  type NetworkLinks,
  type OverheadPercent,
} from '@cctv/calc-core';
import { Select } from '@mantine/core';
import { Disclosure } from '../../../../components/Disclosure/Disclosure';
import { FieldLayoutProvider, FieldRow } from '../../../../components/FieldRow/FieldRow';
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
 * check in the results) and the overhead allowance, side by side. Collapsing it only
 * hides the fields.
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
          <div className={classes.grid}>
            <FieldRow
              label="Uplink"
              help="Speed of the network link that carries all the camera traffic, such as a switch uplink. Checked against the bandwidth estimate."
              controlId="bandwidth-uplink"
            >
              <Select
                id="bandwidth-uplink"
                data={UPLINK_OPTIONS}
                value={network.uplinkMbps === null ? UPLINK_OFF : String(network.uplinkMbps)}
                onChange={(value) =>
                  onNetworkChange({ uplinkMbps: parseOption(UPLINK_SPEEDS_MBPS, value) ?? null })
                }
                allowDeselect={false}
              />
            </FieldRow>

            <FieldRow
              label="Overhead allowance"
              help="Added to every total to cover network protocol overhead and short bitrate bursts above the average."
              controlId="bandwidth-overhead"
            >
              <Select
                id="bandwidth-overhead"
                data={OVERHEAD_OPTIONS}
                value={String(overheadPercent)}
                onChange={(value) => {
                  const percent = parseOption(OVERHEAD_PERCENTS, value);
                  if (percent !== undefined) {
                    onOverheadChange(percent);
                  }
                }}
                allowDeselect={false}
              />
            </FieldRow>
          </div>
        </FieldLayoutProvider>
      </div>
    </Disclosure>
  );
}
