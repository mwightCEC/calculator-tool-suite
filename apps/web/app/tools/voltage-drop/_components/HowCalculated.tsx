import { COPPER_RESISTIVITY } from '@cctv/calc-core';
import { List } from '@mantine/core';

/** Plain-language explanation of the method and its limits, in the results card. */
export function HowCalculated() {
  return (
    <List size="sm" spacing="xs">
      <List.Item>
        Each device has its own <b>run</b> from the supply. The drop is{' '}
        <i>current × loop resistance</i>, where the loop counts both conductors, out and back.
      </List.Item>
      <List.Item>
        Resistance is for <b>copper</b> at 20 °C ({COPPER_RESISTIVITY} Ω·mm² per metre), for example
        about 6.4 Ω per 1000 ft of 18 AWG. Warm cable and copper-clad aluminium (CCA) have more
        resistance and drop more.
      </List.Item>
      <List.Item>
        <b>By amps</b>, the device draws the same current whatever the voltage. <b>By watts</b>, it
        draws its power at whatever voltage reaches it, so the current rises as the voltage falls. A
        run so long that no current can deliver the power is flagged as unable to power the device.
      </List.Item>
      <List.Item>
        <b>24 V AC</b> is treated like DC at its RMS voltage, using the wire&apos;s resistance only.
      </List.Item>
      <List.Item>
        The <b>smallest wire</b> and <b>longest run</b> are the thinnest listed size and the longest
        length that keep the drop within the limit.
      </List.Item>
      <List.Item>
        The <b>supply load</b> adds up every device&apos;s current. Within the rating less the
        reserve is OK; into the reserve is a caution; above the full rating is over.
      </List.Item>
    </List>
  );
}
