import { List } from '@mantine/core';
import { BitrateRangeItem, PreliminaryBitrateText } from './BitrateEstimateNotes';

/** Plain-language explanation of the method and its limits. */
export function StorageHowCalculated() {
  return (
    <div>
      <List size="sm" spacing="xs">
        <List.Item>
          Each group writes <i>bitrate × cameras × recorded hours</i> per day. Storage needed is
          daily footage × retention days, plus the reserve.
        </List.Item>
        <BitrateRangeItem />
        <List.Item>
          Drives are sized for the high end of the range. RAID parity or mirroring and the reserve
          come out of raw capacity first.
        </List.Item>
        <List.Item>
          Capacities are decimal TB, as on drive labels; recorders often show binary units, about 9%
          smaller.
        </List.Item>
      </List>
      <PreliminaryBitrateText />
    </div>
  );
}
