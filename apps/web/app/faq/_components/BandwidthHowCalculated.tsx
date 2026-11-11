import { LINK_CAUTION_ABOVE, LINK_OVER_CAPACITY_ABOVE } from '@cctv/calc-core';
import { List } from '@mantine/core';
import { BitrateRangeItem, PreliminaryBitrateText } from './BitrateEstimateNotes';

const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

/** Plain-language explanation of the method and its limits. */
export function BandwidthHowCalculated() {
  return (
    <div>
      <List size="sm" spacing="xs">
        <List.Item>
          Camera traffic is <i>bitrate × cameras</i> for every group, plus the overhead allowance.
          Cameras stream all the time, so motion or schedule recording doesn&apos;t reduce it.
        </List.Item>
        <List.Item>
          <b>Remote viewing</b> is <i>viewers × cameras each × per-camera bitrate</i>, plus
          overhead.
        </List.Item>
        <BitrateRangeItem />
        <List.Item>
          <b>Network checks</b> use the high end of the range: OK up to{' '}
          {percent(LINK_CAUTION_ABOVE)}, Caution up to {percent(LINK_OVER_CAPACITY_ABOVE)}, then
          &ldquo;Above {percent(LINK_OVER_CAPACITY_ABOVE)}&rdquo;, and &ldquo;Exceeds link&rdquo;
          over 100%.
        </List.Item>
      </List>
      <PreliminaryBitrateText />
    </div>
  );
}
