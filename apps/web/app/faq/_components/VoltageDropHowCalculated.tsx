import { List } from '@mantine/core';

/** Plain-language explanation of the method and its limits, on the FAQ page. */
export function VoltageDropHowCalculated() {
  return (
    <List size="sm" spacing="xs">
      <List.Item>
        One cable per device. The drop is <i>current × loop resistance</i>, counting both
        conductors, out and back.
      </List.Item>
      <List.Item>
        Copper at 20 °C. AWG from copper&apos;s resistivity; mm² from IEC 60228 class 5 maximums.
        Warm cable and copper-clad aluminium (CCA) drop more.
      </List.Item>
      <List.Item>
        Loads in <b>amps</b> draw the same current at any voltage; loads in <b>watts</b> draw more
        as the voltage falls. A run that can&apos;t deliver the power is flagged.
      </List.Item>
      <List.Item>
        <b>24 V AC</b> is treated as DC at its RMS voltage. Transformers are rated in VA; current =
        VA ÷ voltage.
      </List.Item>
      <List.Item>
        The <b>smallest wire</b> and <b>longest run</b> keep the drop within the limit. Within the
        limit doesn&apos;t confirm a device will run: check the voltage at the device against its
        minimum input voltage.
      </List.Item>
      <List.Item>
        The <b>supply load</b> adds every device&apos;s current: OK within the rating less the
        reserve, a caution in the reserve, over above the full rating.
      </List.Item>
    </List>
  );
}
