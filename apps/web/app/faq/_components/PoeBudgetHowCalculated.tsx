import { PORT_STANDARD_MIN_VOLTS, PORT_STANDARDS, poeClassSpec } from '@cctv/calc-core';
import { List } from '@mantine/core';

const class3 = poeClassSpec(3);
const class4 = poeClassSpec(4);

/** "44 / 50 / 50 / 52 V", from the calc-core table. */
const MIN_VOLTS = `${PORT_STANDARDS.map((standard) => PORT_STANDARD_MIN_VOLTS[standard]).join(' / ')} V`;

/** Plain-language explanation of the method and its limits. */
export function PoeBudgetHowCalculated() {
  return (
    <List size="sm" spacing="xs">
      <List.Item>
        Each device takes an <b>allocation</b> from the PoE budget: <i>devices × allocation</i> for
        every group.
      </List.Item>
      <List.Item>
        Given as a <b>PoE class</b>: the class&apos;s full switch-side allocation, e.g.{' '}
        {class3.switchWatts} W for class 3 and {class4.switchWatts} W for class 4.
      </List.Item>
      <List.Item>
        Given in <b>watts</b>: the datasheet maximum plus cable loss, solved at the port
        standard&apos;s minimum voltage ({MIN_VOLTS}), the same method behind the class allocations.
        A blank cable length assumes 328 ft (100 m).
      </List.Item>
      <List.Item>
        The <b>total load</b> is OK within the budget less the reserve, a caution in the reserve,
        over above the full budget.
      </List.Item>
      <List.Item>
        Four separate <b>checks</b>: power budget, PoE ports, port standard (the most one port can
        deliver) and cable length (328 ft (100 m), the Ethernet limit). The mobile bar and Export
        show the worst one.
      </List.Item>
    </List>
  );
}
