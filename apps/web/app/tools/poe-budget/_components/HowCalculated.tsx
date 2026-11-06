import {
  LOOP_OHMS_PER_100_M,
  PORT_STANDARD_MIN_VOLTS,
  PORT_STANDARDS,
  poeClassSpec,
} from '@cctv/calc-core';
import { List } from '@mantine/core';
import { PORT_STANDARD_SHORT_LABELS } from '../_lib/poe-labels';

const class3 = poeClassSpec(3);
const class4 = poeClassSpec(4);

/** "PoE 44 V, PoE+ 50 V, …" from the calc-core table. */
const MIN_VOLTS = PORT_STANDARDS.map(
  (standard) => `${PORT_STANDARD_SHORT_LABELS[standard]} ${PORT_STANDARD_MIN_VOLTS[standard]} V`
).join(', ');

/** Plain-language explanation of the method and its limits. */
export function HowCalculated() {
  return (
    <List size="sm" spacing="xs">
      <List.Item>
        Each device takes an <b>allocation</b> from the switch&apos;s PoE budget, and the results
        add up <i>devices × allocation</i> for every group.
      </List.Item>
      <List.Item>
        Given as a <b>PoE class</b>, the allocation is the class&apos;s full switch-side power, for
        example {class3.switchWatts} W for class 3 and {class4.switchWatts} W for class 4. A switch
        that reserves power by class sets this much aside even when the device draws less.
      </List.Item>
      <List.Item>
        Given in <b>watts</b>, the allocation is the datasheet&apos;s maximum draw plus an estimate
        of the power lost in the cable, using {LOOP_OHMS_PER_100_M} Ω per 100 m of Cat5e, halved
        when the device uses all four pairs. With no cable length, 100 m is assumed.
      </List.Item>
      <List.Item>
        The cable loss allows for the voltage the cable drops: the device gets{' '}
        <i>(port volts − current × resistance) × current</i>, so the current is solved for, and the
        loss is <i>current² × resistance</i>. The port voltage is the lowest the standard allows (
        {MIN_VOLTS}), the same method behind the class allocations: 25.5 W at 100 m takes 30 W. A
        run that can&apos;t carry the device&apos;s power at all is flagged.
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
      <List.Item>
        The <b>checks</b> are separate: power budget, PoE ports, port standard and cable length. The
        card&apos;s badge shows the worst of them, so a budget with room can still need a different
        switch or shorter runs.
      </List.Item>
    </List>
  );
}
