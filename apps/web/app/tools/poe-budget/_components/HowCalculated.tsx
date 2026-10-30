import { CABLE_LOSS_VOLTS, LOOP_OHMS_PER_100_M, poeClassSpec } from '@cctv/calc-core';
import { List } from '@mantine/core';

const class3 = poeClassSpec(3);
const class4 = poeClassSpec(4);

/** Plain-language explanation of the method and its limits. */
export function HowCalculated() {
  return (
    <List size="sm" spacing="xs">
      <List.Item>
        Each device takes an <b>allocation</b> from the switch&apos;s PoE budget, and the results
        add up <i>devices × allocation</i> for every group.
      </List.Item>
      <List.Item>
        <b>By PoE class</b>, the allocation is the class&apos;s full switch-side power, for example{' '}
        {class3.switchWatts} W for class 3 and {class4.switchWatts} W for class 4. A switch that
        reserves power by class sets this much aside even when the device draws less.
      </List.Item>
      <List.Item>
        <b>By watts</b>, the allocation is the datasheet&apos;s maximum draw plus an estimate of the
        power lost in the cable: <i>(watts ÷ {CABLE_LOSS_VOLTS} V)² × resistance</i>, using{' '}
        {LOOP_OHMS_PER_100_M} Ω per 100 m of Cat5e, halved when the device uses all four pairs. With
        no cable length, 100 m is assumed.
      </List.Item>
      <List.Item>
        The <b>reserve</b> is headroom for start-up surges, heaters in cold weather and devices
        added later. Within the budget less the reserve is OK; into the reserve is a caution; above
        the full budget is over budget.
      </List.Item>
      <List.Item>
        The <b>port standard</b> sets the most one port can deliver. A device that needs a higher
        class than the ports support is flagged, even when the total budget has room.
      </List.Item>
      <List.Item>
        Ethernet runs are limited to 100 m (328 ft). Longer runs need a PoE extender or a switch
        closer to the devices.
      </List.Item>
    </List>
  );
}
